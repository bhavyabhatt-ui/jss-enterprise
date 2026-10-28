"use client";

import { useRef } from "react";
import { Invoice } from "@/types/invoice";
import InvoicePreview from "@/components/InvoicePreview";
import { Save, Eye } from "lucide-react";

interface Props {
  data: Omit<Invoice, "id" | "createdAt" | "updatedAt">;
  onSave: () => void;
  mode: "new" | "edit";
}

export default function Step5Summary({ data, onSave, mode }: Props) {
  const previewRef = useRef<HTMLDivElement>(null);

  const fakeInvoice: Invoice = {
    id: "preview",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...data,
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
            <Eye className="w-5 h-5" /> Invoice Preview
          </h2>
          <p className="text-slate-400 text-sm mt-1">Review your invoice before saving</p>
        </div>
        <button
          onClick={onSave}
          className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-green-500/20"
        >
          <Save className="w-4 h-4" />
          {mode === "new" ? "Save Invoice" : "Update Invoice"}
        </button>
      </div>

      <div ref={previewRef} className="rounded-xl overflow-hidden border border-slate-700/50">
        <InvoicePreview invoice={fakeInvoice} />
      </div>
    </div>
  );
}
