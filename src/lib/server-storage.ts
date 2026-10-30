import fs from "fs";
import path from "path";
import { Invoice } from "@/types/invoice";
import { SystemSettings, DEFAULT_SYSTEM_SETTINGS } from "@/types/settings";
import { Redis } from "@upstash/redis";
import { neon } from "@neondatabase/serverless";
import { put, list, del } from "@vercel/blob";

// Global cache to persist state across warm serverless requests
declare global {
  var __JSS_INVOICES_CACHE__: Invoice[] | undefined;
  var __JSS_SETTINGS_CACHE__: SystemSettings | undefined;
  var __JSS_POSTGRES_INIT__: boolean | undefined;
}

const REDIS_KEY = "jss:invoices:v1";
const SETTINGS_KEY = "jss:settings:v1";
const BLOB_FILENAME = "jss-enterprise-invoices.json";

const DEFAULT_KV_URL = "https://moved-stork-243662.upstash.io";
const DEFAULT_KV_TOKEN = "gQAAAAAAA7fOAAIgcDE0MzQxODQzMmE3NGQ0NTZiYmZlMjFmYzRiNjcwYjBjMg";

function getKvCredentials(): { url: string; token: string } {
  const url = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || DEFAULT_KV_URL).trim();
  const token = (process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || DEFAULT_KV_TOKEN).trim();
  return { url, token };
}

/* =========================================================================
 * 1. STORAGE PROVIDER DETECTION (VERCEL IN-APP CLOUD DATABASES)
 * ========================================================================= */

export type StorageProviderType = "vercel_kv" | "vercel_postgres" | "vercel_blob" | "file";

export function getActiveStorageProvider(): {
  type: StorageProviderType;
  isCloud: boolean;
  name: string;
} {
  // A. Vercel KV / Upstash Redis (1-Click in Vercel Storage Tab)
  const { url, token } = getKvCredentials();
  if (url && token) {
    return {
      type: "vercel_kv",
      isCloud: true,
      name: "Vercel KV (In-App Cloud DB)",
    };
  }

  // B. Vercel Postgres / Neon Serverless (1-Click in Vercel Storage Tab)
  const postgresUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (postgresUrl) {
    return {
      type: "vercel_postgres",
      isCloud: true,
      name: "Vercel Postgres (In-App Cloud DB)",
    };
  }

  // C. Vercel Blob Storage (1-Click in Vercel Storage Tab)
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    return {
      type: "vercel_blob",
      isCloud: true,
      name: "Vercel Blob (In-App Cloud Storage)",
    };
  }

  // D. Local fallback
  return {
    type: "file",
    isCloud: false,
    name: "Local Server File System",
  };
}

/* =========================================================================
 * 2. VERCEL KV / UPSTASH REDIS ADAPTER
 * ========================================================================= */

function getVercelKVClient(): Redis | null {
  const { url, token } = getKvCredentials();

  if (!url || !token) return null;

  try {
    return new Redis({
      url: url.trim(),
      token: token.trim(),
    });
  } catch (err) {
    console.error("Failed to initialize Vercel KV client:", err);
    return null;
  }
}

/* =========================================================================
 * 3. VERCEL POSTGRES / NEON ADAPTER
 * ========================================================================= */

function getPostgresSql() {
  const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!url) return null;

  try {
    return neon(url.trim());
  } catch (err) {
    console.error("Failed to initialize Vercel Postgres client:", err);
    return null;
  }
}

async function ensurePostgresTable(sql: any): Promise<void> {
  if (globalThis.__JSS_POSTGRES_INIT__) return;

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS invoices (
        id VARCHAR(255) PRIMARY KEY,
        invoice_no VARCHAR(255),
        data JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    globalThis.__JSS_POSTGRES_INIT__ = true;
  } catch (err) {
    console.error("Error creating Vercel Postgres table:", err);
  }
}

/* =========================================================================
 * 4. VERCEL BLOB ADAPTER
 * ========================================================================= */

async function getBlobInvoices(): Promise<Invoice[] | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;

  try {
    const { blobs } = await list({ prefix: BLOB_FILENAME });
    const fileBlob = blobs.find((b) => b.pathname === BLOB_FILENAME);
    if (!fileBlob) return [];

    const res = await fetch(fileBlob.url, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.error("Error reading from Vercel Blob:", err);
  }
  return null;
}

async function saveBlobInvoices(invoices: Invoice[]): Promise<boolean> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return false;

  try {
    await put(BLOB_FILENAME, JSON.stringify(invoices, null, 2), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return true;
  } catch (err) {
    console.error("Error saving to Vercel Blob:", err);
    return false;
  }
}

/* =========================================================================
 * 5. LOCAL FILE SYSTEM ADAPTER
 * ========================================================================= */

function getStorageFilePath(): string {
  const tmpPath = path.join("/tmp", "jss_invoices.json");
  const localDataPath = path.join(process.cwd(), "data", "invoices.json");

  try {
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    return localDataPath;
  } catch {
    return tmpPath;
  }
}

function readFromFile(): Invoice[] {
  const filePath = getStorageFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return deduplicateList(parsed);
      }
    }
  } catch (err) {
    console.warn("Could not read invoices from file:", err);
  }
  return [];
}

function writeToFile(invoices: Invoice[]): void {
  const filePath = getStorageFilePath();
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(invoices, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not write invoices to file:", err);
  }
}

/* =========================================================================
 * 6. DEDUPLICATION HELPER
 * ========================================================================= */

export function deduplicateList(invoices: Invoice[]): Invoice[] {
  const seenIds = new Set<string>();
  const seenNos = new Set<string>();
  const result: Invoice[] = [];

  for (const inv of invoices) {
    if (!inv || !inv.id) continue;
    const invNo = inv.invoiceInfo?.invoiceNo?.trim().toLowerCase();

    // Prevent duplicate IDs
    if (seenIds.has(inv.id)) continue;

    // Prevent duplicate non-empty invoice numbers
    if (invNo && seenNos.has(invNo)) continue;

    seenIds.add(inv.id);
    if (invNo) seenNos.add(invNo);
    result.push(inv);
  }

  return result;
}

/* =========================================================================
 * 7. CORE UNIFIED ASYNC STORAGE API (STRICT CLOUD DATABASE-FIRST)
 * ========================================================================= */

/**
 * READ ALL: Get all invoices directly from the connected Vercel in-app cloud database
 */
export async function getServerInvoices(): Promise<Invoice[]> {
  const provider = getActiveStorageProvider();

  // A. VERCEL KV / UPSTASH REDIS
  if (provider.type === "vercel_kv") {
    try {
      const redis = getVercelKVClient();
      if (redis) {
        const raw = await redis.get<Invoice[]>(REDIS_KEY);
        if (Array.isArray(raw)) {
          const deduped = deduplicateList(raw);
          globalThis.__JSS_INVOICES_CACHE__ = deduped;
          return deduped;
        }
        // If empty key, return empty array (0 invoices)
        globalThis.__JSS_INVOICES_CACHE__ = [];
        return [];
      }
    } catch (err) {
      console.error("Vercel KV read error:", err);
    }
  }

  // B. VERCEL POSTGRES / NEON SERVERLESS
  if (provider.type === "vercel_postgres") {
    try {
      const sql = getPostgresSql();
      if (sql) {
        await ensurePostgresTable(sql);
        const rows = await sql`
          SELECT data FROM invoices
          ORDER BY updated_at DESC;
        `;
        const list = rows.map((r: any) => r.data as Invoice);
        const deduped = deduplicateList(list);
        globalThis.__JSS_INVOICES_CACHE__ = deduped;
        return deduped;
      }
    } catch (err) {
      console.error("Vercel Postgres read error:", err);
    }
  }

  // C. VERCEL BLOB STORAGE
  if (provider.type === "vercel_blob") {
    try {
      const blobInvoices = await getBlobInvoices();
      if (blobInvoices !== null) {
        const deduped = deduplicateList(blobInvoices);
        globalThis.__JSS_INVOICES_CACHE__ = deduped;
        return deduped;
      }
    } catch (err) {
      console.error("Vercel Blob read error:", err);
    }
  }

  // D. IN-MEMORY & LOCAL FILE SYSTEM FALLBACK
  if (globalThis.__JSS_INVOICES_CACHE__ && globalThis.__JSS_INVOICES_CACHE__.length > 0) {
    return deduplicateList(globalThis.__JSS_INVOICES_CACHE__);
  }

  const fileData = readFromFile();
  globalThis.__JSS_INVOICES_CACHE__ = fileData;
  return fileData;
}

/**
 * READ ONE: Get single invoice by ID or Invoice Number
 */
export async function getServerInvoiceById(id: string): Promise<Invoice | null> {
  const provider = getActiveStorageProvider();
  const cleanId = (id || "").trim();

  // If Postgres, query directly
  if (provider.type === "vercel_postgres") {
    try {
      const sql = getPostgresSql();
      if (sql) {
        await ensurePostgresTable(sql);
        const rows = await sql`
          SELECT data FROM invoices
          WHERE id = ${cleanId} OR LOWER(invoice_no) = ${cleanId.toLowerCase()}
          LIMIT 1;
        `;
        if (rows.length > 0) {
          return rows[0].data as Invoice;
        }
      }
    } catch (err) {
      console.error("Vercel Postgres find error:", err);
    }
  }

  const list = await getServerInvoices();
  return (
    list.find(
      (item) => item.id === cleanId || item.invoiceInfo?.invoiceNo?.toLowerCase() === cleanId.toLowerCase()
    ) || null
  );
}

/**
 * CREATE / UPDATE: Save single invoice atomically to the connected cloud database
 */
export async function saveServerInvoice(invoice: Invoice): Promise<Invoice> {
  const provider = getActiveStorageProvider();
  const updatedInvoice: Invoice = {
    ...invoice,
    updatedAt: new Date().toISOString(),
  };
  const invNo = updatedInvoice.invoiceInfo?.invoiceNo?.trim().toLowerCase();

  // 1. VERCEL POSTGRES ATOMIC UPSERT
  if (provider.type === "vercel_postgres") {
    try {
      const sql = getPostgresSql();
      if (sql) {
        await ensurePostgresTable(sql);
        await sql`
          INSERT INTO invoices (id, invoice_no, data, updated_at)
          VALUES (
            ${updatedInvoice.id},
            ${invNo || ""},
            ${JSON.stringify(updatedInvoice)},
            NOW()
          )
          ON CONFLICT (id) DO UPDATE SET
            invoice_no = EXCLUDED.invoice_no,
            data = EXCLUDED.data,
            updated_at = NOW();
        `;
      }
    } catch (err) {
      console.error("Vercel Postgres save error:", err);
    }
  }

  // 2. Fetch current list to update Vercel KV, Blob, Cache, and File
  const list = await getServerInvoices();
  const existingIdx = list.findIndex(
    (item) =>
      item.id === updatedInvoice.id ||
      (invNo && item.invoiceInfo?.invoiceNo?.trim().toLowerCase() === invNo)
  );

  if (existingIdx >= 0) {
    list[existingIdx] = updatedInvoice;
  } else {
    list.unshift(updatedInvoice);
  }

  const deduped = deduplicateList(list);
  globalThis.__JSS_INVOICES_CACHE__ = deduped;

  // 3. VERCEL KV / UPSTASH REDIS SAVE
  if (provider.type === "vercel_kv") {
    try {
      const redis = getVercelKVClient();
      if (redis) await redis.set(REDIS_KEY, deduped);
    } catch (err) {
      console.error("Vercel KV write error:", err);
    }
  }

  // 4. VERCEL BLOB SAVE
  if (provider.type === "vercel_blob") {
    await saveBlobInvoices(deduped);
  }

  writeToFile(deduped);
  return updatedInvoice;
}

/**
 * DELETE: Remove invoice permanently from cloud database
 */
export async function deleteServerInvoice(id: string): Promise<boolean> {
  const provider = getActiveStorageProvider();
  const cleanId = (id || "").trim();

  // 1. VERCEL POSTGRES DELETE
  if (provider.type === "vercel_postgres") {
    try {
      const sql = getPostgresSql();
      if (sql) {
        await ensurePostgresTable(sql);
        await sql`
          DELETE FROM invoices
          WHERE id = ${cleanId} OR LOWER(invoice_no) = ${cleanId.toLowerCase()};
        `;
      }
    } catch (err) {
      console.error("Vercel Postgres delete error:", err);
    }
  }

  // 2. Update list for Vercel KV, Blob, Cache, and File
  const list = await getServerInvoices();
  const filtered = list.filter(
    (item) =>
      item.id !== cleanId &&
      item.invoiceInfo?.invoiceNo?.toLowerCase() !== cleanId.toLowerCase()
  );

  globalThis.__JSS_INVOICES_CACHE__ = filtered;

  // 3. VERCEL KV UPDATE
  if (provider.type === "vercel_kv") {
    try {
      const redis = getVercelKVClient();
      if (redis) await redis.set(REDIS_KEY, filtered);
    } catch (err) {
      console.error("Vercel KV delete error:", err);
    }
  }

  // 4. VERCEL BLOB UPDATE
  if (provider.type === "vercel_blob") {
    await saveBlobInvoices(filtered);
  }

  writeToFile(filtered);
  return true;
}

/**
 * RESET WHOLE DATABASE: Complete wipe of all records from cloud database and cache
 */
export async function resetServerDatabase(): Promise<{ success: boolean; message: string }> {
  const provider = getActiveStorageProvider();

  // 1. Vercel Postgres
  if (provider.type === "vercel_postgres") {
    try {
      const sql = getPostgresSql();
      if (sql) {
        await ensurePostgresTable(sql);
        await sql`DELETE FROM invoices;`;
      }
    } catch (err) {
      console.error("Error wiping Vercel Postgres:", err);
    }
  }

  // 2. Vercel KV
  if (provider.type === "vercel_kv") {
    try {
      const redis = getVercelKVClient();
      if (redis) await redis.del(REDIS_KEY);
    } catch (err) {
      console.error("Error wiping Vercel KV:", err);
    }
  }

  // 3. Vercel Blob
  if (provider.type === "vercel_blob") {
    await saveBlobInvoices([]);
  }

  // 4. Clear memory and file
  globalThis.__JSS_INVOICES_CACHE__ = [];
  writeToFile([]);

  return { success: true, message: "Database reset completely. 0 records remaining." };
}

/* =========================================================================
 * 8. SYSTEM SETTINGS & PREFILLED PROFILES API
 * ========================================================================= */

function getSettingsFilePath(): string {
  const tmpPath = path.join("/tmp", "jss_settings.json");
  const localPath = path.join(process.cwd(), "data", "settings.json");
  try {
    const dir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return localPath;
  } catch {
    return tmpPath;
  }
}

function readSettingsFromFile(): SystemSettings {
  const filePath = getSettingsFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      if (data && typeof data === "object") {
        return { ...DEFAULT_SYSTEM_SETTINGS, ...data };
      }
    }
  } catch (err) {
    console.warn("Could not read settings from file:", err);
  }
  return { ...DEFAULT_SYSTEM_SETTINGS };
}

function writeSettingsToFile(settings: SystemSettings): void {
  const filePath = getSettingsFilePath();
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(settings, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not write settings to file:", err);
  }
}

/**
 * READ SETTINGS: Fetch from Vercel KV / Redis, with cache and file fallback
 */
export async function getServerSettings(): Promise<SystemSettings> {
  const provider = getActiveStorageProvider();

  // A. Vercel KV / Upstash Redis
  if (provider.type === "vercel_kv") {
    try {
      const redis = getVercelKVClient();
      if (redis) {
        const stored = await redis.get<SystemSettings>(SETTINGS_KEY);
        if (stored && typeof stored === "object") {
          const merged: SystemSettings = {
            ...DEFAULT_SYSTEM_SETTINGS,
            ...stored,
          };
          globalThis.__JSS_SETTINGS_CACHE__ = merged;
          return merged;
        }
      }
    } catch (err) {
      console.error("Vercel KV settings read error:", err);
    }
  }

  // B. In-Memory Cache
  if (globalThis.__JSS_SETTINGS_CACHE__) {
    return globalThis.__JSS_SETTINGS_CACHE__;
  }

  // C. Local file fallback
  const fileSettings = readSettingsFromFile();
  globalThis.__JSS_SETTINGS_CACHE__ = fileSettings;
  return fileSettings;
}

/**
 * SAVE SETTINGS: Persist to Vercel KV / Redis, cache, and file
 */
export async function saveServerSettings(settings: SystemSettings): Promise<SystemSettings> {
  const provider = getActiveStorageProvider();
  const merged: SystemSettings = {
    ...DEFAULT_SYSTEM_SETTINGS,
    ...settings,
  };

  globalThis.__JSS_SETTINGS_CACHE__ = merged;

  // 1. Vercel KV
  if (provider.type === "vercel_kv") {
    try {
      const redis = getVercelKVClient();
      if (redis) await redis.set(SETTINGS_KEY, merged);
    } catch (err) {
      console.error("Vercel KV settings save error:", err);
    }
  }

  // 2. File
  writeSettingsToFile(merged);
  return merged;
}

/**
 * BUMP AUTH SESSION VERSION: Remote Logout from all devices
 */
export async function bumpAuthSessionVersion(): Promise<number> {
  const current = await getServerSettings();
  const newVersion = (current.authSessionVersion || 1) + 1;
  await saveServerSettings({
    ...current,
    authSessionVersion: newVersion,
  });
  return newVersion;
}

/**
 * GET AUTH SESSION VERSION
 */
export async function getAuthSessionVersion(): Promise<number> {
  const current = await getServerSettings();
  return current.authSessionVersion || 1;
}

/**
 * EXPORT FULL SYSTEM BACKUP: Invoices + Settings + Profiles
 */
export async function getFullSystemBackup(): Promise<{
  version: string;
  exportedAt: string;
  invoices: Invoice[];
  settings: SystemSettings;
}> {
  const invoices = await getServerInvoices();
  const settings = await getServerSettings();

  return {
    version: "2.0",
    exportedAt: new Date().toISOString(),
    invoices,
    settings,
  };
}

/**
 * RESTORE SYSTEM BACKUP: Resume from backup JSON data
 */
export async function restoreSystemBackup(
  backup: { invoices?: Invoice[]; settings?: Partial<SystemSettings> },
  mode: "merge" | "replace" = "merge"
): Promise<{ success: boolean; invoiceCount: number; message: string }> {
  const incomingInvoices = Array.isArray(backup.invoices) ? backup.invoices : [];
  const incomingSettings = backup.settings || {};

  let finalInvoices: Invoice[] = [];

  if (mode === "replace") {
    finalInvoices = deduplicateList(incomingInvoices);
  } else {
    // Merge
    const existing = await getServerInvoices();
    finalInvoices = deduplicateList([...incomingInvoices, ...existing]);
  }

  // Save invoices
  const provider = getActiveStorageProvider();
  globalThis.__JSS_INVOICES_CACHE__ = finalInvoices;

  if (provider.type === "vercel_kv") {
    try {
      const redis = getVercelKVClient();
      if (redis) await redis.set(REDIS_KEY, finalInvoices);
    } catch (err) {
      console.error("Failed to restore invoices to Vercel KV:", err);
    }
  }

  if (provider.type === "vercel_blob") {
    await saveBlobInvoices(finalInvoices);
  }

  writeToFile(finalInvoices);

  // Restore Settings
  const currentSettings = await getServerSettings();
  const updatedSettings: SystemSettings = {
    ...currentSettings,
    ...incomingSettings,
    companyProfiles: incomingSettings.companyProfiles || currentSettings.companyProfiles,
    productCatalog: incomingSettings.productCatalog || currentSettings.productCatalog,
    bankProfiles: incomingSettings.bankProfiles || currentSettings.bankProfiles,
    lastBackupAt: new Date().toISOString(),
  };

  await saveServerSettings(updatedSettings);

  return {
    success: true,
    invoiceCount: finalInvoices.length,
    message: `System successfully restored with ${finalInvoices.length} bills.`,
  };
}
