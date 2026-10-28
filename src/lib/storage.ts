import { Invoice } from "@/types/invoice";

const STORAGE_KEY = "invoiceiq_invoices";

export function getAllInvoices(): Invoice[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function getInvoiceById(id: string): Invoice | null {
  const invoices = getAllInvoices();
  return invoices.find((inv) => inv.id === id) || null;
}

export function saveInvoice(invoice: Invoice): void {
  const invoices = getAllInvoices();
  const existingIndex = invoices.findIndex((inv) => inv.id === invoice.id);
  if (existingIndex >= 0) {
    invoices[existingIndex] = { ...invoice, updatedAt: new Date().toISOString() };
  } else {
    invoices.push(invoice);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
}

export function deleteInvoice(id: string): void {
  const invoices = getAllInvoices().filter((inv) => inv.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
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
