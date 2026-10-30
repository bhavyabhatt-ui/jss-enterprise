import { Invoice, CompanyHeader, DEFAULT_COMPANY_HEADER } from "@/types/invoice";

const STORAGE_KEY = "jss_enterprise_invoices";

export function deduplicateInvoices(invoices: Invoice[]): Invoice[] {
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
 * READ ALL: Fetch all invoices directly from Server Database.
 */
export async function fetchInvoices(): Promise<Invoice[]> {
  try {
    const res = await fetch("/api/invoices", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const deduped = deduplicateInvoices(data);
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(deduped));
        }
        return deduped;
      }
    }
  } catch (err) {
    console.warn("Server API fetch failed, using local fallback:", err);
  }

  return getAllInvoices();
}

/**
 * READ ONE: Fetch a specific invoice from Server Database.
 */
export async function fetchInvoiceById(id: string): Promise<Invoice | null> {
  const cleanId = (id || "").trim();
  try {
    const res = await fetch(`/api/invoices/${encodeURIComponent(cleanId)}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data && data.id) {
        if (typeof window !== "undefined") {
          const local = getAllInvoices();
          const idx = local.findIndex((inv) => inv.id === data.id);
          if (idx >= 0) {
            local[idx] = data;
          } else {
            local.unshift(data);
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(deduplicateInvoices(local)));
        }
        return data;
      }
    }
  } catch (err) {
    console.warn(`Server API fetch for invoice ${cleanId} failed:`, err);
  }

  return getInvoiceById(cleanId);
}

/**
 * CREATE / UPDATE: Save invoice to Server Database and localStorage.
 */
export async function saveInvoice(invoice: Invoice): Promise<Invoice> {
  const invNo = invoice.invoiceInfo?.invoiceNo?.trim().toLowerCase();

  // 1. Optimistic UI update
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

  // 2. Persist directly to Vercel Cloud Server Database
  try {
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invoice),
      cache: "no-store",
    });

    if (res.ok) {
      const saved = await res.json();
      if (saved && saved.id) {
        if (typeof window !== "undefined") {
          const local = getAllInvoices();
          const idx = local.findIndex((inv) => inv.id === saved.id);
          if (idx >= 0) {
            local[idx] = saved;
          } else {
            local.unshift(saved);
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(deduplicateInvoices(local)));
        }
        return saved;
      }
    }
  } catch (err) {
    console.error("Failed to save invoice to server database:", err);
  }

  return invoice;
}

/**
 * DELETE: Remove invoice permanently from Database and localStorage.
 */
export async function deleteInvoice(id: string): Promise<boolean> {
  const cleanId = (id || "").trim();

  // 1. Immediately remove from local cache
  if (typeof window !== "undefined") {
    const invoices = getAllInvoices().filter(
      (inv) => inv.id !== cleanId && inv.invoiceInfo?.invoiceNo !== cleanId
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
  }

  // 2. Call DELETE endpoint on server
  try {
    const res = await fetch(`/api/invoices/${encodeURIComponent(cleanId)}`, {
      method: "DELETE",
      cache: "no-store",
    });
    if (res.ok) {
      const result = await res.json();
      return !!result.success;
    }
  } catch (err) {
    console.error(`Failed to delete invoice ${cleanId} on server:`, err);
  }
  return false;
}

/**
 * RESET DATABASE: Completely wipe all invoices
 */
export async function resetDatabase(): Promise<boolean> {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(STORAGE_KEY, "[]");
  }

  try {
    const res = await fetch("/api/invoices/reset", {
      method: "POST",
      cache: "no-store",
    });
    return res.ok;
  } catch (err) {
    console.error("Failed to reset database:", err);
    return false;
  }
}

/**
 * Local cache read - Returns empty array if none, never pre-seeded sample data
 */
export function getAllInvoices(): Invoice[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      return deduplicateInvoices(parsed);
    }
    return [];
  } catch {
    return [];
  }
}

export function getInvoiceById(id: string): Invoice | null {
  const cleanId = (id || "").trim();
  const invoices = getAllInvoices();
  return (
    invoices.find(
      (inv) => inv.id === cleanId || inv.invoiceInfo?.invoiceNo === cleanId
    ) || null
  );
}

/**
 * Extract smart recommendations from historical invoices
 * To make filling new bills fast and effortless
 */
export function getInvoiceRecommendations(invoices: Invoice[]) {
  const customerMap = new Map<string, {
    customerName: string;
    address: string;
    cityState: string;
    gstinPan: string;
    contactNo: string;
  }>();

  const itemMap = new Map<string, {
    description: string;
    specifications: string;
    hsnSac: string;
    unit: string;
    rate: number;
  }>();

  for (const inv of invoices) {
    // 1. Customer suggestions
    if (inv.buyerDetails?.customerName) {
      const name = inv.buyerDetails.customerName.trim();
      if (!customerMap.has(name.toLowerCase())) {
        customerMap.set(name.toLowerCase(), {
          customerName: name,
          address: inv.buyerDetails.address || "",
          cityState: inv.buyerDetails.cityState || "",
          gstinPan: inv.buyerDetails.gstinPan || "",
          contactNo: inv.buyerDetails.contactNo || "",
        });
      }
    }

    // 2. Item / Product suggestions
    if (Array.isArray(inv.items)) {
      for (const it of inv.items) {
        if (it?.description) {
          const desc = it.description.trim();
          if (!itemMap.has(desc.toLowerCase())) {
            itemMap.set(desc.toLowerCase(), {
              description: desc,
              specifications: it.specifications || "",
              hsnSac: it.hsnSac || "",
              unit: it.unit || "Nos",
              rate: Number(it.rate) || 0,
            });
          }
        }
      }
    }
  }

  return {
    customers: Array.from(customerMap.values()),
    items: Array.from(itemMap.values()),
  };
}

/**
 * Log out current admin session
 */
export async function logoutAdmin(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch (err) {
    console.error("Logout request failed:", err);
  }
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
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
