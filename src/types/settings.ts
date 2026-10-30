import { CompanyHeader, DEFAULT_COMPANY_HEADER, BankDetails } from "./invoice";

export interface CompanyProfile {
  id: string;
  profileName: string;
  isDefault: boolean;
  header: CompanyHeader;
}

export interface CatalogProduct {
  id: string;
  code: string; // e.g. "ITEM-001"
  description: string;
  specifications: string;
  hsnSac: string;
  unit: string;
  rate: number;
}

export interface BankProfile {
  id: string;
  profileName: string;
  isDefault: boolean;
  bankDetails: BankDetails;
  termsAndConditions: string;
}

export interface SystemSettings {
  companyProfiles: CompanyProfile[];
  productCatalog: CatalogProduct[];
  bankProfiles: BankProfile[];
  invoicePrefix: string;
  defaultPlaceOfSupply: string;
  authSessionVersion: number;
  lastBackupAt?: string;
}

export const DEFAULT_COMPANY_PROFILES: CompanyProfile[] = [
  {
    id: "profile-default",
    profileName: "JSS Enterprise - Primary HQ",
    isDefault: true,
    header: { ...DEFAULT_COMPANY_HEADER },
  },
];

export const DEFAULT_BANK_PROFILES: BankProfile[] = [
  {
    id: "bank-default",
    profileName: "Union Bank of India (Primary Current A/C)",
    isDefault: true,
    bankDetails: {
      bankName: "UNION BANK OF INDIA",
      accountHolder: "JSS ENTERPRISE",
      accountNo: "50360 20100 10504",
      ifscCode: "UBIN0550361",
      branch: "ODHAV RING ROAD / Ahmedabad",
    },
    termsAndConditions:
      "1. Goods once sold will not be taken back or exchanged.\n2. Interest @ 18% p.a. will be charged if bill is not settled on due date.\n3. Warranty covers manufacturing defects as per OEM policy.\n4. Subject to Ahmedabad Jurisdiction only.",
  },
];

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  companyProfiles: DEFAULT_COMPANY_PROFILES,
  productCatalog: [
    {
      id: "prod-1",
      code: "JSS-IND-100",
      description: "Industrial Machine Tool & Accessories",
      specifications: "Heavy duty alloy steel grade 304, high torque precision finish",
      hsnSac: "8466",
      unit: "Nos",
      rate: 15400,
    },
    {
      id: "prod-2",
      code: "JSS-SRV-200",
      description: "Technical Fabrication & Calibration Service",
      specifications: "On-site industrial calibration and maintenance work",
      hsnSac: "9987",
      unit: "Job",
      rate: 8500,
    },
  ],
  bankProfiles: DEFAULT_BANK_PROFILES,
  invoicePrefix: "JSS/24-25/",
  defaultPlaceOfSupply: "Gujarat (24)",
  authSessionVersion: 1,
};

