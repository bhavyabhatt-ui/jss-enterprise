"use client";

import { Invoice } from "@/types/invoice";
import ResponsiveInvoiceViewer from "@/components/ResponsiveInvoiceViewer";
import { Check, Save, Loader2 } from "lucide-react";

interface Props {
  data: Omit<Invoice, "id" | "createdAt" | "updatedAt">;
  onSave: () => void;
  mode: "new" | "edit";
  isSaving?: boolean;
}

export default function Step5Summary({ data, onSave, mode, isSaving }: Props) {
  const previewInvoice: Invoice = {
    id: "preview-id",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...data,
  };

  return (
    <div className="p-3 sm:p-6">
      {/* Title & Save Bar */}
      <div className="mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/70 p-3 sm:p-4 rounded-xl border">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900">Step 5: Live Invoice Preview</h3>
          <p className="text-slate-500 text-xs mt-0.5">
            Review the complete bill. Click below to save and unlock exports.
          </p>
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-lg text-xs transition-all shadow-sm active:scale-98 whitespace-nowrap"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{isSaving ? "Saving Bill..." : mode === "new" ? "Save & Register Bill" : "Update & Save Bill"}</span>
        </button>
      </div>

      {/* Responsive Bill Preview (Fit to Screen on Phone, Full on Desktop) */}
      <div className="bg-slate-100/70 p-2 sm:p-4 rounded-xl border border-slate-200 shadow-2xs mb-6">
        <ResponsiveInvoiceViewer invoice={previewInvoice} />
      </div>

      {/* Bottom Save Bar */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg text-xs transition-all shadow-sm active:scale-98"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          <span>{isSaving ? "Saving Bill..." : mode === "new" ? "Confirm & Save Invoice" : "Confirm & Update Invoice"}</span>
        </button>
      </div>
    </div>
  );
}
