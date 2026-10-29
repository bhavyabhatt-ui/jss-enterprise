import fs from "fs";
import path from "path";
import { Invoice } from "@/types/invoice";
import { SAMPLE_INITIAL_INVOICE } from "@/lib/sample-data";
import { Redis } from "@upstash/redis";
import { MongoClient, Db } from "mongodb";

export { SAMPLE_INITIAL_INVOICE };

// Ensure Node DNS resolves Atlas SRV records reliably
if (typeof process !== "undefined") {
  try {
    const dns = require("dns");
    if (dns && typeof dns.setServers === "function") {
      dns.setServers(["8.8.8.8", "1.1.1.1"]);
    }
  } catch {}
}

const DEFAULT_MONGODB_URI =
  "mongodb+srv://bhattbhavya11_db_user:kfLukyPmsIfRkR7i@jss.yd5r8se.mongodb.net/?retryWrites=true&w=majority";

function getMongoUri(): string {
  return (process.env.MONGODB_URI || DEFAULT_MONGODB_URI).trim();
}

// Global in-memory cache to persist across warm serverless requests
declare global {
  var __JSS_INVOICES_CACHE__: Invoice[] | undefined;
  var __JSS_MONGO_CLIENT__: MongoClient | undefined;
}

const REDIS_KEY = "jss:invoices:v1";

/* =========================================================================
 * 1. STORAGE PROVIDER DETECTION
 * ========================================================================= */

export type StorageProviderType = "upstash" | "mongodb" | "file";

export function getActiveStorageProvider(): {
  type: StorageProviderType;
  isCloud: boolean;
  name: string;
} {
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (kvUrl && kvToken) {
    return {
      type: "upstash",
      isCloud: true,
      name: "Upstash Redis / Vercel KV",
    };
  }

  const mongoUri = getMongoUri();
  if (mongoUri) {
    return {
      type: "mongodb",
      isCloud: true,
      name: "MongoDB Atlas Cloud",
    };
  }

  return {
    type: "file",
    isCloud: false,
    name: "Local Server File System",
  };
}

/* =========================================================================
 * 2. UPSTASH / VERCEL KV ADAPTER
 * ========================================================================= */

function getUpstashRedisClient(): Redis | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  try {
    return new Redis({
      url: url.trim(),
      token: token.trim(),
    });
  } catch (err) {
    console.error("Failed to initialize Upstash Redis client:", err);
    return null;
  }
}

/* =========================================================================
 * 3. MONGODB ATLAS ADAPTER
 * ========================================================================= */

async function getMongoDB(): Promise<Db | null> {
  const uri = getMongoUri();
  if (!uri) return null;

  try {
    if (!globalThis.__JSS_MONGO_CLIENT__) {
      globalThis.__JSS_MONGO_CLIENT__ = new MongoClient(uri, {
        serverSelectionTimeoutMS: 8000,
        connectTimeoutMS: 10000,
      });
      await globalThis.__JSS_MONGO_CLIENT__.connect();
    }
    return globalThis.__JSS_MONGO_CLIENT__.db("jss_enterprise");
  } catch (err) {
    console.error("Failed to connect to MongoDB Atlas:", err);
    return null;
  }
}

/* =========================================================================
 * 4. LOCAL FILE SYSTEM ADAPTER
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
      if (Array.isArray(parsed) && parsed.length > 0) {
        return deduplicateList(parsed);
      }
    }
  } catch (err) {
    console.warn("Could not read invoices from file:", err);
  }
  return [SAMPLE_INITIAL_INVOICE];
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
 * 5. DEDUPLICATION HELPER
 * ========================================================================= */

function deduplicateList(invoices: Invoice[]): Invoice[] {
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
 * 6. CORE UNIFIED ASYNC STORAGE API
 * ========================================================================= */

/**
 * Get all invoices from the active cloud/server storage
 */
export async function getServerInvoices(): Promise<Invoice[]> {
  const provider = getActiveStorageProvider();

  // A. UPSTASH REDIS / VERCEL KV
  if (provider.type === "upstash") {
    try {
      const redis = getUpstashRedisClient();
      if (redis) {
        const raw = await redis.get<Invoice[]>(REDIS_KEY);
        if (Array.isArray(raw) && raw.length > 0) {
          const deduped = deduplicateList(raw);
          globalThis.__JSS_INVOICES_CACHE__ = deduped;
          return deduped;
        }
        // If empty in cloud, initialize with sample
        await redis.set(REDIS_KEY, [SAMPLE_INITIAL_INVOICE]);
        globalThis.__JSS_INVOICES_CACHE__ = [SAMPLE_INITIAL_INVOICE];
        return [SAMPLE_INITIAL_INVOICE];
      }
    } catch (err) {
      console.error("Upstash Redis read error, falling back to cache/file:", err);
    }
  }

  // B. MONGODB ATLAS
  if (provider.type === "mongodb") {
    try {
      const db = await getMongoDB();
      if (db) {
        const docs = await db
          .collection("invoices")
          .find({})
          .sort({ updatedAt: -1 })
          .toArray();

        if (docs && docs.length > 0) {
          const mapped: Invoice[] = docs.map((doc: any) => {
            const { _id, ...rest } = doc;
            return rest as Invoice;
          });
          const deduped = deduplicateList(mapped);
          globalThis.__JSS_INVOICES_CACHE__ = deduped;
          return deduped;
        }

        // Initialize with sample
        await db.collection("invoices").insertOne({ ...SAMPLE_INITIAL_INVOICE });
        globalThis.__JSS_INVOICES_CACHE__ = [SAMPLE_INITIAL_INVOICE];
        return [SAMPLE_INITIAL_INVOICE];
      }
    } catch (err) {
      console.error("MongoDB Atlas read error, falling back to cache/file:", err);
    }
  }

  // C. LOCAL FILE / MEMORY FALLBACK
  if (globalThis.__JSS_INVOICES_CACHE__ && globalThis.__JSS_INVOICES_CACHE__.length > 0) {
    return deduplicateList(globalThis.__JSS_INVOICES_CACHE__);
  }

  const fileData = readFromFile();
  globalThis.__JSS_INVOICES_CACHE__ = fileData;
  return fileData;
}

/**
 * Save / Replace entire list in active storage
 */
export async function saveServerInvoices(invoices: Invoice[]): Promise<void> {
  const deduped = deduplicateList(invoices);
  globalThis.__JSS_INVOICES_CACHE__ = deduped;
  const provider = getActiveStorageProvider();

  // A. UPSTASH REDIS / VERCEL KV
  if (provider.type === "upstash") {
    try {
      const redis = getUpstashRedisClient();
      if (redis) {
        await redis.set(REDIS_KEY, deduped);
        return;
      }
    } catch (err) {
      console.error("Upstash Redis write error:", err);
    }
  }

  // B. MONGODB ATLAS
  if (provider.type === "mongodb") {
    try {
      const db = await getMongoDB();
      if (db) {
        const col = db.collection("invoices");
        // Clear and replace with deduped array
        await col.deleteMany({});
        if (deduped.length > 0) {
          await col.insertMany(deduped.map((inv) => ({ ...inv })));
        }
        return;
      }
    } catch (err) {
      console.error("MongoDB Atlas write error:", err);
    }
  }

  // C. LOCAL FILE
  writeToFile(deduped);
}

/**
 * Get single invoice by ID
 */
export async function getServerInvoiceById(id: string): Promise<Invoice | null> {
  const list = await getServerInvoices();
  return list.find((item) => item.id === id) || null;
}

/**
 * Create or update single invoice
 */
export async function saveServerInvoice(invoice: Invoice): Promise<Invoice> {
  const list = await getServerInvoices();
  const invNo = invoice.invoiceInfo?.invoiceNo?.trim().toLowerCase();

  const existingIdx = list.findIndex(
    (item) =>
      item.id === invoice.id ||
      (invNo && item.invoiceInfo?.invoiceNo?.trim().toLowerCase() === invNo)
  );

  let updatedInvoice: Invoice;

  if (existingIdx >= 0) {
    updatedInvoice = {
      ...invoice,
      id: list[existingIdx].id,
      updatedAt: new Date().toISOString(),
    };
    list[existingIdx] = updatedInvoice;
  } else {
    updatedInvoice = {
      ...invoice,
      updatedAt: new Date().toISOString(),
    };
    list.unshift(updatedInvoice);
  }

  await saveServerInvoices(list);
  return updatedInvoice;
}

/**
 * Delete single invoice by ID
 */
export async function deleteServerInvoice(id: string): Promise<boolean> {
  const list = await getServerInvoices();
  const filtered = list.filter((item) => item.id !== id);
  if (filtered.length !== list.length) {
    await saveServerInvoices(filtered);
    return true;
  }
  return false;
}
