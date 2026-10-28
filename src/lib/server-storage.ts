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

export function getServerInvoices(): Invoice[] {
  if (globalThis.__JSS_INVOICES_CACHE__ && globalThis.__JSS_INVOICES_CACHE__.length > 0) {
    return deduplicateList(globalThis.__JSS_INVOICES_CACHE__);
  }

  const filePath = getStorageFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const deduped = deduplicateList(parsed);
        globalThis.__JSS_INVOICES_CACHE__ = deduped;
        return deduped;
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
  const deduped = deduplicateList(invoices);
  globalThis.__JSS_INVOICES_CACHE__ = deduped;
  const filePath = getStorageFilePath();
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(deduped, null, 2), "utf-8");
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
  const invNo = invoice.invoiceInfo?.invoiceNo?.trim().toLowerCase();

  // Look for existing invoice by ID OR invoice number
  const existingIdx = list.findIndex(
    (item) =>
      item.id === invoice.id ||
      (invNo && item.invoiceInfo?.invoiceNo?.trim().toLowerCase() === invNo)
  );

  if (existingIdx >= 0) {
    // Preserve stable ID
    list[existingIdx] = {
      ...invoice,
      id: list[existingIdx].id,
      updatedAt: new Date().toISOString(),
    };
  } else {
    list.unshift({ ...invoice, updatedAt: new Date().toISOString() });
  }

  saveServerInvoices(list);
  return list[existingIdx >= 0 ? existingIdx : 0];
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
