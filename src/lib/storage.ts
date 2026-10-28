import { Invoice } from "@/types/invoice";
import { SAMPLE_INITIAL_INVOICE } from "@/lib/sample-data";

const STORAGE_KEY = "jss_enterprise_invoices";

export { SAMPLE_INITIAL_INVOICE };

function deduplicateInvoices(invoices: Invoice[]): Invoice[] {
  const seenIds = new Set<string>();
  const seenNos = new Set<string>();
  const result: Invoice[] = [];

  for (const inv of invoices) {
    if (!inv || !inv.id) continue;
    const invNo = inv.invoiceInfo?.invoiceNo?.trim().toLowerCase();

    if (seenIds.has(inv.id)) continue;
    if (invNo && seenNos.has(invNo)) continue;

    seenIds.add(inv.id);
    if (invNo) seenNos.add(invNo);
    result.push(inv);
  }

  return result;
}

/**
 * Fetch all invoices from Server API, fallback to localStorage
 */
export async function fetchInvoices(): Promise<Invoice[]> {
  try {
    const res = await fetch("/api/invoices", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const deduped = deduplicateInvoices(data);
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(deduped));
        }
        return deduped;
      }
    }
  } catch (err) {
    console.warn("Server API fetch failed, using local cache:", err);
  }

  return getAllInvoices();
}

/**
 * Fetch a specific invoice from Server API, fallback to localStorage
 */
export async function fetchInvoiceById(id: string): Promise<Invoice | null> {
  try {
    const res = await fetch(`/api/invoices/${id}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data && data.id) {
        const local = getAllInvoices();
        const idx = local.findIndex((inv) => inv.id === id);
        if (idx >= 0) {
          local[idx] = data;
        } else {
          local.unshift(data);
        }
        const deduped = deduplicateInvoices(local);
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(deduped));
        }
        return data;
      }
    }
  } catch (err) {
    console.warn(`Server API fetch for invoice ${id} failed, using local cache:`, err);
  }

  return getInvoiceById(id);
}

/**
 * Save invoice to both Server API and localStorage with deduplication
 */
export async function saveInvoice(invoice: Invoice): Promise<Invoice> {
  const invNo = invoice.invoiceInfo?.invoiceNo?.trim().toLowerCase();

  // 1. Immediately update localStorage
  if (typeof window !== "undefined") {
    const invoices = getAllInvoices();
    const existingIndex = invoices.findIndex(
      (inv) =>
        inv.id === invoice.id ||
        (invNo && inv.invoiceInfo?.invoiceNo?.trim().toLowerCase() === invNo)
    );

    if (existingIndex >= 0) {
      invoices[existingIndex] = {
        ...invoice,
        id: invoices[existingIndex].id,
        updatedAt: new Date().toISOString(),
      };
    } else {
      invoices.unshift({ ...invoice, updatedAt: new Date().toISOString() });
    }

    const deduped = deduplicateInvoices(invoices);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(deduped));
  }

  // 2. Persist to Server Database / API
  try {
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invoice),
    });
    if (res.ok) {
      const saved = await res.json();
      return saved;
    }
  } catch (err) {
    console.error("Failed to save invoice to server:", err);
  }

  return invoice;
}

/**
 * Delete invoice from both Server API and localStorage
 */
export async function deleteInvoice(id: string): Promise<void> {
  if (typeof window !== "undefined") {
    const invoices = getAllInvoices().filter((inv) => inv.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
  }

  try {
    await fetch(`/api/invoices/${id}`, { method: "DELETE" });
  } catch (err) {
    console.error(`Failed to delete invoice ${id} on server:`, err);
  }
}

/**
 * Local cache read with deduplication
 */
export function getAllInvoices(): Invoice[] {
  if (typeof window === "undefined") return [SAMPLE_INITIAL_INVOICE];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      const initial = [SAMPLE_INITIAL_INVOICE];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const deduped = deduplicateInvoices(parsed);
      return deduped;
    }
    return [SAMPLE_INITIAL_INVOICE];
  } catch {
    return [SAMPLE_INITIAL_INVOICE];
  }
}

export function getInvoiceById(id: string): Invoice | null {
  const invoices = getAllInvoices();
  return invoices.find((inv) => inv.id === id) || null;
}

export function numberToWords(amount: number): string {
  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
  ];

  function convertHundreds(n: number): string {
    if (n === 0) return "";
    if (n < 20) return ones[n] + " ";
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "") + " ";
    return ones[Math.floor(n / 100)] + " Hundred " + convertHundreds(n % 100);
  }

  function convertToWords(n: number): string {
    if (n === 0) return "Zero";
    let result = "";
    if (n >= 10000000) {
      result += convertHundreds(Math.floor(n / 10000000)) + "Crore ";
      n %= 10000000;
    }
    if (n >= 100000) {
      result += convertHundreds(Math.floor(n / 100000)) + "Lakh ";
      n %= 100000;
    }
    if (n >= 1000) {
      result += convertHundreds(Math.floor(n / 1000)) + "Thousand ";
      n %= 1000;
    }
    result += convertHundreds(n);
    return result.trim();
  }

  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  let words = convertToWords(rupees) + " Rupees";
  if (paise > 0) {
    words += " and " + convertToWords(paise) + " Paise";
  }
  words += " Only";
  return words;
}
