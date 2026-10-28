import fs from "fs";
import path from "path";
import { Invoice } from "@/types/invoice";
import { SAMPLE_INITIAL_INVOICE } from "@/lib/sample-data";

export { SAMPLE_INITIAL_INVOICE };

// Global in-memory cache to persist across warm serverless requests
declare global {
  var __JSS_INVOICES_CACHE__: Invoice[] | undefined;
}

function getStorageFilePath(): string {
  // In serverless environments, /tmp is writable
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

export function getServerInvoices(): Invoice[] {
  if (globalThis.__JSS_INVOICES_CACHE__ && globalThis.__JSS_INVOICES_CACHE__.length > 0) {
    return globalThis.__JSS_INVOICES_CACHE__;
  }

  const filePath = getStorageFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        globalThis.__JSS_INVOICES_CACHE__ = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Could not read invoices from file, initializing default:", err);
  }

  // Default seed
  const initial = [SAMPLE_INITIAL_INVOICE];
  saveServerInvoices(initial);
  return initial;
}

export function saveServerInvoices(invoices: Invoice[]): void {
  globalThis.__JSS_INVOICES_CACHE__ = invoices;
  const filePath = getStorageFilePath();
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(invoices, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not write invoices to file (using memory cache):", err);
  }
}

export function getServerInvoiceById(id: string): Invoice | null {
  const list = getServerInvoices();
  return list.find((item) => item.id === id) || null;
}

export function saveServerInvoice(invoice: Invoice): Invoice {
  const list = getServerInvoices();
  const existingIdx = list.findIndex((item) => item.id === invoice.id);
  if (existingIdx >= 0) {
    list[existingIdx] = { ...invoice, updatedAt: new Date().toISOString() };
  } else {
    list.unshift({ ...invoice, updatedAt: new Date().toISOString() });
  }
  saveServerInvoices(list);
  return invoice;
}

export function deleteServerInvoice(id: string): boolean {
  const list = getServerInvoices();
  const filtered = list.filter((item) => item.id !== id);
  if (filtered.length !== list.length) {
    saveServerInvoices(filtered);
    return true;
  }
  return false;
}
