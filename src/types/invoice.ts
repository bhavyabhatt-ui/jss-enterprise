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

export type Step = 1 | 2 | 3 | 4 | 5;
