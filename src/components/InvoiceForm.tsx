"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { Invoice, InvoiceItem, Step } from "@/types/invoice";
import { saveInvoice, numberToWords } from "@/lib/storage";

// Step Components
import StepIndicator from "@/components/StepIndicator";
import Step1InvoiceInfo from "@/components/steps/Step1InvoiceInfo";
import Step2BuyerDetails from "@/components/steps/Step2BuyerDetails";
import Step3Items from "@/components/steps/Step3Items";
import Step4BankDetails from "@/components/steps/Step4BankDetails";
import Step5Summary from "@/components/steps/Step5Summary";

const defaultInvoice: Omit<Invoice, "id" | "createdAt" | "updatedAt"> = {
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
  amountInWords: "",
};

interface InvoiceFormProps {
  initialData?: Invoice;
  mode: "new" | "edit";
}

export default function InvoiceForm({ initialData, mode }: InvoiceFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState<Omit<Invoice, "id" | "createdAt" | "updatedAt">>(
    initialData
      ? {
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
      const subTotal = items.reduce((sum, item) => sum + item.amount, 0);
      const cgstAmount = (subTotal * cgst) / 100;
      const sgstAmount = (subTotal * sgst) / 100;
      const igstAmount = (subTotal * igst) / 100;
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

  function handleSave() {
    const invoice: Invoice = {
      id: initialData?.id || uuidv4(),
      createdAt: initialData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    };
    saveInvoice(invoice);
    router.push(`/invoice/${invoice.id}`);
  }

  const stepLabels = [
    "Invoice Info",
    "Buyer Details",
    "Items",
    "Bank Details",
    "Summary",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-900/90 backdrop-blur border-b border-slate-700/60 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="text-slate-400 hover:text-yellow-400 text-sm flex items-center gap-1.5 transition-colors font-medium bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700/50"
            >
              ← Dashboard
            </button>
            <div className="hidden sm:flex items-center gap-2.5 pl-2 border-l border-slate-700">
              <div className="w-8 h-8 rounded-lg overflow-hidden border border-yellow-500/40 bg-slate-950 p-0.5 shadow">
                <img
                  src="/logo.png"
                  alt="JSS Enterprise"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <p className="font-extrabold text-yellow-400 text-xs tracking-wider leading-none">JSS ENTERPRISE</p>
                <p className="text-slate-400 text-[9px] tracking-wider uppercase font-semibold">Billing System</p>
              </div>
            </div>
          </div>
          <h1 className="text-yellow-400 font-bold text-base sm:text-lg">
            {mode === "new" ? "Create Tax Invoice" : "Edit Tax Invoice"}
          </h1>
          <div className="text-slate-300 text-xs sm:text-sm font-semibold bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
            Step {step} of 5
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Step Indicator */}
        <StepIndicator currentStep={step} steps={stepLabels} />

        {/* Step Content */}
        <div className="mt-6 bg-slate-800/60 border border-slate-700/50 rounded-2xl backdrop-blur overflow-hidden">
          {step === 1 && (
            <Step1InvoiceInfo
              data={data.invoiceInfo}
              onChange={(invoiceInfo) => setData((p) => ({ ...p, invoiceInfo }))}
            />
          )}
          {step === 2 && (
            <Step2BuyerDetails
              data={data.buyerDetails}
              onChange={(buyerDetails) => setData((p) => ({ ...p, buyerDetails }))}
            />
          )}
          {step === 3 && (
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
          {step === 4 && (
            <Step4BankDetails
              bankDetails={data.bankDetails}
              termsAndConditions={data.termsAndConditions}
              onChange={(bankDetails) => setData((p) => ({ ...p, bankDetails }))}
              onTermsChange={(termsAndConditions) =>
                setData((p) => ({ ...p, termsAndConditions }))
              }
            />
          )}
          {step === 5 && (
            <Step5Summary
              data={data}
              onSave={handleSave}
              mode={mode}
            />
          )}

          {/* Navigation Buttons */}
          {step < 5 && (
            <div className="px-6 py-4 border-t border-slate-700/50 flex justify-between">
              <button
                onClick={() => setStep((s) => Math.max(1, s - 1) as Step)}
                disabled={step === 1}
                className="px-5 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm font-medium hover:bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                ← Previous
              </button>
              <button
                onClick={() => setStep((s) => Math.min(5, s + 1) as Step)}
                className="px-6 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-slate-900 text-sm font-semibold transition-all shadow-lg shadow-yellow-400/20"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

