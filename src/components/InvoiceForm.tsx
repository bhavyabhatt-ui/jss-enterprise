"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { Invoice, InvoiceItem, Step, DEFAULT_COMPANY_HEADER } from "@/types/invoice";
import { saveInvoice, numberToWords, logoutAdmin } from "@/lib/storage";

// Step Components
import StepIndicator from "@/components/StepIndicator";
import Step0HeaderDetails from "@/components/steps/Step0HeaderDetails";
import Step1InvoiceInfo from "@/components/steps/Step1InvoiceInfo";
import Step2BuyerDetails from "@/components/steps/Step2BuyerDetails";
import Step3Items from "@/components/steps/Step3Items";
import Step4BankDetails from "@/components/steps/Step4BankDetails";
import Step5Summary from "@/components/steps/Step5Summary";
import { ArrowLeft, ArrowRight, Save, LogOut } from "lucide-react";

const defaultInvoice: Omit<Invoice, "id" | "createdAt" | "updatedAt"> = {
  header: { ...DEFAULT_COMPANY_HEADER },
  invoiceInfo: {
    invoiceNo: "",
    invoiceDate: new Date().toLocaleDateString("en-IN"),
    challanNo: "",
    poDateNo: "",
    placeOfSupply: "Gujarat (24)",
  },
  buyerDetails: {
    customerName: "",
    address: "",
    cityState: "",
    gstinPan: "",
    contactNo: "",
  },
  items: [
    {
      id: uuidv4(),
      description: "",
      specifications: "",
      hsnSac: "",
      qty: 1,
      unit: "Nos",
      rate: 0,
      amount: 0,
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
  subTotal: 0,
  cgstAmount: 0,
  sgstAmount: 0,
  igstAmount: 0,
  grandTotal: 0,
  amountInWords: "Zero Rupees Only",
};

interface InvoiceFormProps {
  initialData?: Invoice;
  mode: "new" | "edit";
}

export default function InvoiceForm({ initialData, mode }: InvoiceFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [invoiceId] = useState<string>(() => initialData?.id || uuidv4());
  const [isSaving, setIsSaving] = useState(false);
  const [data, setData] = useState<Omit<Invoice, "id" | "createdAt" | "updatedAt">>(
    initialData
      ? {
          header: initialData.header || { ...DEFAULT_COMPANY_HEADER },
          invoiceInfo: initialData.invoiceInfo,
          buyerDetails: initialData.buyerDetails,
          items: initialData.items,
          bankDetails: initialData.bankDetails,
          taxDetails: initialData.taxDetails,
          termsAndConditions: initialData.termsAndConditions,
          subTotal: initialData.subTotal,
          cgstAmount: initialData.cgstAmount,
          sgstAmount: initialData.sgstAmount,
          igstAmount: initialData.igstAmount,
          grandTotal: initialData.grandTotal,
          amountInWords: initialData.amountInWords,
        }
      : defaultInvoice
  );

  const recalculate = useCallback(
    (items: InvoiceItem[], cgst: number, sgst: number, igst: number) => {
      const subTotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      const cgstAmount = (subTotal * Number(cgst)) / 100;
      const sgstAmount = (subTotal * Number(sgst)) / 100;
      const igstAmount = (subTotal * Number(igst)) / 100;
      const grandTotal = subTotal + cgstAmount + sgstAmount + igstAmount;
      const amountInWords = numberToWords(grandTotal);
      return { subTotal, cgstAmount, sgstAmount, igstAmount, grandTotal, amountInWords };
    },
    []
  );

  const updateItems = useCallback(
    (items: InvoiceItem[]) => {
      const totals = recalculate(
        items,
        data.taxDetails.cgst,
        data.taxDetails.sgst,
        data.taxDetails.igst
      );
      setData((prev) => ({ ...prev, items, ...totals }));
    },
    [data.taxDetails, recalculate]
  );

  const updateTax = useCallback(
    (cgst: number, sgst: number, igst: number) => {
      const totals = recalculate(data.items, cgst, sgst, igst);
      setData((prev) => ({
        ...prev,
        taxDetails: { cgst, sgst, igst },
        ...totals,
      }));
    },
    [data.items, recalculate]
  );

  async function handleSave() {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const invoice: Invoice = {
        id: invoiceId,
        createdAt: initialData?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...data,
      };
      await saveInvoice(invoice);
      router.replace(`/invoice/${invoice.id}`);
    } catch (err) {
      console.error(err);
      setIsSaving(false);
    }
  }

  const stepLabels = [
    "Company Header",
    "Invoice Info",
    "Buyer Details",
    "Products & Tax",
    "Bank & Terms",
    "Preview & Save",
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* ── TOP HEADER BAR ── */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center gap-1.5 transition-colors bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </button>
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-7 h-7 rounded-md overflow-hidden border border-slate-200 bg-white p-0.5">
                <img src="/logo.png" alt="JSS Enterprise" className="w-full h-full object-contain" />
              </div>
              <span className="font-extrabold text-slate-900 text-xs tracking-wide">JSS ENTERPRISE</span>
            </div>
          </div>

          <h2 className="text-slate-900 font-bold text-sm sm:text-base">
            {mode === "new" ? "Create Tax Invoice" : "Edit Tax Invoice"}
          </h2>

          <div className="flex items-center gap-2">
            <div className="text-slate-500 text-xs font-semibold bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              Step {step} of 6
            </div>
            <button
              type="button"
              onClick={() => logoutAdmin()}
              title="Sign out of Admin"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ── FORM CONTAINER ── */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Step Indicator */}
        <StepIndicator currentStep={step} steps={stepLabels} />

        {/* Step Card Content */}
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden step-fade-in">
          {step === 1 && (
            <Step0HeaderDetails
              data={data.header}
              onChange={(header) => setData((p) => ({ ...p, header }))}
            />
          )}

          {step === 2 && (
            <Step1InvoiceInfo
              data={data.invoiceInfo}
              onChange={(invoiceInfo) => setData((p) => ({ ...p, invoiceInfo }))}
            />
          )}

          {step === 3 && (
            <Step2BuyerDetails
              data={data.buyerDetails}
              onChange={(buyerDetails) => setData((p) => ({ ...p, buyerDetails }))}
            />
          )}

          {step === 4 && (
            <Step3Items
              items={data.items}
              taxDetails={data.taxDetails}
              subTotal={data.subTotal}
              cgstAmount={data.cgstAmount}
              sgstAmount={data.sgstAmount}
              igstAmount={data.igstAmount}
              grandTotal={data.grandTotal}
              onItemsChange={updateItems}
              onTaxChange={updateTax}
            />
          )}

          {step === 5 && (
            <Step4BankDetails
              bankDetails={data.bankDetails}
              termsAndConditions={data.termsAndConditions}
              onChange={(bankDetails) => setData((p) => ({ ...p, bankDetails }))}
              onTermsChange={(termsAndConditions) =>
                setData((p) => ({ ...p, termsAndConditions }))
              }
            />
          )}

          {step === 6 && (
            <Step5Summary
              data={data}
              onSave={handleSave}
              mode={mode}
              isSaving={isSaving}
            />
          )}

          {/* Navigation Controls */}
          {step < 6 && (
            <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-200 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(1, s - 1) as Step)}
                disabled={step === 1}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Previous
              </button>

              <button
                type="button"
                onClick={() => setStep((s) => Math.min(6, s + 1) as Step)}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-all shadow-xs active:scale-98"
              >
                Next <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
