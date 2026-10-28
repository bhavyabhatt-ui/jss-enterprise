import { Invoice } from "@/types/invoice";

const STORAGE_KEY = "jss_enterprise_invoices";
const LEGACY_STORAGE_KEY = "invoiceiq_invoices";

export const SAMPLE_INITIAL_INVOICE: Invoice = {
  id: "jss-sample-0142",
  createdAt: "2026-10-17T10:30:00.000Z",
  updatedAt: "2026-10-17T10:30:00.000Z",
  invoiceInfo: {
    invoiceNo: "JSS/24-25/0142",
    invoiceDate: "17/10/2026",
    challanNo: "CH-2026-089",
    poDateNo: "PO/99821",
    placeOfSupply: "Gujarat (24)",
  },
  buyerDetails: {
    customerName: "M/s. Precision Tools Ltd.",
    address: "Plot No. 45, GIDC Industrial Estate",
    cityState: "Odhav, Ahmedabad - 382415",
    gstinPan: "24AAACP1234F1Z2",
    contactNo: "+91 98765 43210",
  },
  items: [
    {
      id: "item-1",
      description: "Heavy Duty CNC Router Machine (1325 Model)",
      specifications: "3.5kW Air Cooled Spindle with Vacuum Bed Setup",
      hsnSac: "84581100",
      qty: 1,
      unit: "Set",
      rate: 350000,
      amount: 350000,
    },
    {
      id: "item-2",
      description: "Weihong NK105 DSP CNC Controller Remote",
      specifications: "Handheld Pendant Controller with Cable Set",
      hsnSac: "85371000",
      qty: 1,
      unit: "Nos",
      rate: 22500,
      amount: 22500,
    },
    {
      id: "item-3",
      description: "High Precision Spindle Motor 4.5kW",
      specifications: "",
      hsnSac: "85015210",
      qty: 1,
      unit: "Nos",
      rate: 18000,
      amount: 18000,
    },
    {
      id: "item-4",
      description: "Industrial VFD Frequency Inverter Drive",
      specifications: "",
      hsnSac: "85044090",
      qty: 1,
      unit: "Nos",
      rate: 12500,
      amount: 12500,
    },
    {
      id: "item-5",
      description: "CNC Carbide Tooling Bits & Collet Set (ER20)",
      specifications: "",
      hsnSac: "82077090",
      qty: 2,
      unit: "Set",
      rate: 4500,
      amount: 9000,
    },
    {
      id: "item-6",
      description: "Machine On-site Installation & Technical Servicing",
      specifications: "",
      hsnSac: "998719",
      qty: 1,
      unit: "Serv",
      rate: 5000,
      amount: 5000,
    },
  ],
  bankDetails: {
    bankName: "UNION BANK OF INDIA",
    accountHolder: "JSS ENTERPRISE",
    accountNo: "50360 20100 10504",
    ifscCode: "UBIN0550361",
    branch: "ODHAV RING ROAD / Ahmedabad",
  },
  taxDetails: {
    cgst: 9,
    sgst: 9,
    igst: 0,
  },
  termsAndConditions:
    "1. Goods once sold will not be taken back or exchanged.\n2. Interest @ 18% p.a. will be charged if bill is not settled on due date.\n3. Warranty covers manufacturing defects as per OEM policy.\n4. Subject to Ahmedabad Jurisdiction only.",
  subTotal: 417000,
  cgstAmount: 37530,
  sgstAmount: 37530,
  igstAmount: 0,
  grandTotal: 492060,
  amountInWords: "Four Lakh Ninety Two Thousand Sixty Rupees Only",
};

export function getAllInvoices(): Invoice[] {
  if (typeof window === "undefined") return [];
  try {
    let data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      // Check legacy key
      const legacyData = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacyData) {
        data = legacyData;
        localStorage.setItem(STORAGE_KEY, legacyData);
      }
    }
    if (!data) {
      // Initialize with sample invoice matching user's exact bill!
      const initial = [SAMPLE_INITIAL_INVOICE];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [SAMPLE_INITIAL_INVOICE];
  } catch {
    return [SAMPLE_INITIAL_INVOICE];
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
    invoices.unshift(invoice);
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
