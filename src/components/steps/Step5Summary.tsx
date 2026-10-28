"use client";

import { Invoice } from "@/types/invoice";
import InvoicePreview from "@/components/InvoicePreview";
import { Check, Save } from "lucide-react";

interface Props {
  data: Omit<Invoice, "id" | "createdAt" | "updatedAt">;
  onSave: () => void;
  mode: "new" | "edit";
}

export default function Step5Summary({ data, onSave, mode }: Props) {
  const previewInvoice: Invoice = {
    id: "preview-id",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...data,
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Title & Save Bar */}
      <div className="mb-6 pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50 p-4 rounded-xl border">
        <div>
          <h3 className="text-base font-bold text-slate-900">Step 5: Live Invoice Preview</h3>
          <p className="text-slate-500 text-xs mt-0.5">
            Review the complete invoice. Click &quot;Save Invoice&quot; to register and unlock PDF, Image, Word &amp; WhatsApp exports.
          </p>
        </div>
        <button
          type="button"
          onClick={onSave}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-lg text-xs transition-all shadow-sm active:scale-98 whitespace-nowrap"
        >
          <Save className="w-4 h-4" />
          <span>{mode === "new" ? "Save & Register Bill" : "Update & Save Bill"}</span>
        </button>
      </div>

      {/* Bill Preview */}
      <div className="bg-slate-100/60 p-2 sm:p-4 rounded-xl border border-slate-200 shadow-2xs overflow-x-auto">
        <div className="min-w-[800px] flex justify-start sm:justify-center">
          <InvoicePreview invoice={previewInvoice} />
        </div>
      </div>

      {/* Bottom Save Bar */}
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onSave}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2.5 rounded-lg text-xs transition-all shadow-sm active:scale-98"
        >
          <Check className="w-4 h-4" />
          <span>{mode === "new" ? "Confirm & Save Invoice" : "Confirm & Update Invoice"}</span>
        </button>
      </div>
    </div>
  );
}
