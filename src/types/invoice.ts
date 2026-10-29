export interface CompanyHeader {
  companyName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  invoiceTitle: string;
  gstin: string;
  stateCode: string;
}

export const DEFAULT_COMPANY_HEADER: CompanyHeader = {
  companyName: "JSS ENTERPRISE",
  tagline: "PRECISION | POWER | PROGRESS",
  address: "Pushpak (Kathwada) Co-Op Housing Society Ltd., Bhagirath Villa, Kathwada Road, Ahmedabad - 382430, Gujarat, India",
  phone: "+91 8905605092",
  email: "jssenterprise0411@gmail.com",
  invoiceTitle: "TAX INVOICE",
  gstin: "24LRHPS9541P1ZN",
  stateCode: "24 (Gujarat)",
};

export interface InvoiceItem {
  id: string;
  description: string;
  specifications: string;
  hsnSac: string;
  qty: number;
  unit: string;
  rate: number;
  amount: number;
}

export interface InvoiceInfo {
  invoiceNo: string;
  invoiceDate: string;
  challanNo: string;
  poDateNo: string;
  placeOfSupply: string;
}

export interface BuyerDetails {
  customerName: string;
  address: string;
  cityState: string;
  gstinPan: string;
  contactNo: string;
}

export interface BankDetails {
  bankName: string;
  accountHolder: string;
  accountNo: string;
  ifscCode: string;
  branch: string;
}

export interface TaxDetails {
  cgst: number;
  sgst: number;
  igst: number;
}

export interface Invoice {
  id: string;
  createdAt: string;
  updatedAt: string;
  header: CompanyHeader;
  invoiceInfo: InvoiceInfo;
  buyerDetails: BuyerDetails;
  items: InvoiceItem[];
  bankDetails: BankDetails;
  taxDetails: TaxDetails;
  termsAndConditions: string;
  subTotal: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  grandTotal: number;
  amountInWords: string;
}

export type Step = 1 | 2 | 3 | 4 | 5 | 6;
