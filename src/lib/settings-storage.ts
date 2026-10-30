import { SystemSettings, DEFAULT_SYSTEM_SETTINGS, CatalogProduct } from "@/types/settings";
import { InvoiceItem } from "@/types/invoice";
import { v4 as uuidv4 } from "uuid";

const SETTINGS_LOCAL_KEY = "jss_enterprise_settings";

/**
 * Synchronous read from localStorage with fallback
 */
export function getStoredSettings(): SystemSettings {
  if (typeof window === "undefined") return { ...DEFAULT_SYSTEM_SETTINGS };
  try {
    const raw = localStorage.getItem(SETTINGS_LOCAL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return { ...DEFAULT_SYSTEM_SETTINGS, ...parsed };
      }
    }
  } catch (err) {
    console.warn("Error reading settings from localStorage:", err);
  }
  return { ...DEFAULT_SYSTEM_SETTINGS };
}

/**
 * Fetch settings from cloud database & cache locally
 */
export async function fetchSettings(): Promise<SystemSettings> {
  try {
    const res = await fetch("/api/settings", { cache: "no-store" });
    if (res.ok) {
      const data: SystemSettings = await res.json();
      if (data && typeof data === "object") {
        const merged: SystemSettings = { ...DEFAULT_SYSTEM_SETTINGS, ...data };
        if (typeof window !== "undefined") {
          localStorage.setItem(SETTINGS_LOCAL_KEY, JSON.stringify(merged));
        }
        return merged;
      }
    }
  } catch (err) {
    console.warn("Failed to fetch settings from API, using local cache:", err);
  }
  return getStoredSettings();
}

/**
 * Save settings to cloud database & local cache
 */
export async function updateSettings(settings: SystemSettings): Promise<SystemSettings> {
  if (typeof window !== "undefined") {
    localStorage.setItem(SETTINGS_LOCAL_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent("settingsUpdated", { detail: settings }));
  }

  try {
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
      cache: "no-store",
    });

    if (res.ok) {
      const saved = await res.json();
      if (typeof window !== "undefined") {
        localStorage.setItem(SETTINGS_LOCAL_KEY, JSON.stringify(saved));
        window.dispatchEvent(new CustomEvent("settingsUpdated", { detail: saved }));
      }
      return saved;
    }
  } catch (err) {
    console.error("Failed to save settings to server:", err);
  }

  return settings;
}

/**
 * Download complete system backup JSON file
 */
export async function downloadFullSystemBackup(): Promise<void> {
  try {
    const res = await fetch("/api/settings/backup", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to generate backup on server");

    const backupData = await res.json();
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const dateStr = new Date().toISOString().split("T")[0];
    const a = document.createElement("a");
    a.href = url;
    a.download = `JSS-Enterprise-Full-Backup-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Backup download error:", err);
    throw err;
  }
}

/**
 * Restore system backup from uploaded JSON file
 */
export async function restoreSystemBackupFromFile(
  file: File,
  mode: "merge" | "replace" = "merge"
): Promise<{ success: boolean; invoiceCount: number; message: string }> {
  const text = await file.text();
  let backupData: any;

  try {
    backupData = JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON file. Please select a valid JSS Enterprise backup file.");
  }

  const res = await fetch("/api/settings/backup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ backup: backupData, mode }),
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to restore backup");
  }

  const result = await res.json();

  // Refresh local caches
  if (typeof window !== "undefined") {
    if (backupData.settings) {
      localStorage.setItem(SETTINGS_LOCAL_KEY, JSON.stringify(backupData.settings));
    }
  }

  return result;
}

/**
 * Automatically add any items not already in the product catalog
 * Uses only Product Name + HSN/SAC without any internal item codes.
 */
export async function syncNewItemsToCatalog(items: InvoiceItem[]): Promise<CatalogProduct[]> {
  const currentSettings = getStoredSettings();
  const catalog: CatalogProduct[] = [];
  const seen = new Set<string>();

  // Clean existing catalog of any duplicate descriptions
  for (const p of currentSettings.productCatalog || []) {
    const key = p.description.trim().toLowerCase();
    if (key && !seen.has(key)) {
      seen.add(key);
      catalog.push({
        id: p.id || uuidv4(),
        description: p.description.trim(),
        specifications: p.specifications?.trim() || "",
        hsnSac: p.hsnSac?.trim() || "",
        unit: p.unit || "Nos",
        rate: Number(p.rate) || 0,
      });
    }
  }

  let changed = false;

  for (const item of items) {
    const desc = item.description?.trim();
    if (!desc) continue;
    const key = desc.toLowerCase();

    if (!seen.has(key)) {
      seen.add(key);
      catalog.push({
        id: uuidv4(),
        description: desc,
        specifications: item.specifications?.trim() || "",
        hsnSac: item.hsnSac?.trim() || "",
        unit: item.unit || "Nos",
        rate: Number(item.rate) || 0,
      });
      changed = true;
    }
  }

  if (changed || catalog.length !== (currentSettings.productCatalog || []).length) {
    const updated = { ...currentSettings, productCatalog: catalog };
    await updateSettings(updated);
    return catalog;
  }

  return catalog;
}

export async function logoutAdminSession(allDevices: boolean = false): Promise<void> {
  try {
    await fetch(`/api/auth/logout${allDevices ? "?all=true" : ""}`, {
      method: "POST",
      cache: "no-store",
    });
  } catch (err) {
    console.warn("Logout request failed:", err);
  } finally {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }
}

