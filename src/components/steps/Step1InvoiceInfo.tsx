"use client";

import { InvoiceInfo } from "@/types/invoice";
import { HEADER_IMAGE_BASE64 } from "@/lib/assets";

interface Props {
  data: InvoiceInfo;
  onChange: (data: InvoiceInfo) => void;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-slate-700 text-xs font-semibold mb-1.5">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all shadow-2xs"
      />
    </div>
  );
}

export default function Step1InvoiceInfo({ data, onChange }: Props) {
  const update = (key: keyof InvoiceInfo, value: string) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <div className="p-6">
      {/* Title */}
      <div className="mb-5 pb-4 border-b border-slate-100">
        <h3 className="text-base font-bold text-slate-900">Step 1: Invoice Information</h3>
        <p className="text-slate-500 text-xs mt-0.5">Specify basic billing number, date, and supply details</p>
      </div>

      {/* Bill Header Preview */}
      <div className="mb-6 rounded-xl overflow-hidden border border-slate-200 shadow-xs bg-[#1e2329]">
        <div className="bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600 border-b border-slate-200">
          Official Bill Header (Applied to All Invoices)
        </div>
        <img
          src={HEADER_IMAGE_BASE64}
          alt="JSS Enterprise Header Banner"
          className="w-full object-contain max-h-[140px]"
        />
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label="Invoice No"
          value={data.invoiceNo}
          onChange={(v) => update("invoiceNo", v)}
          placeholder="e.g. JSS/24-25/0142"
          required
        />
        <Field
          label="Invoice Date"
          value={data.invoiceDate}
          onChange={(v) => update("invoiceDate", v)}
          placeholder="e.g. 17/10/2026"
          required
        />
        <Field
          label="Challan No"
          value={data.challanNo}
          onChange={(v) => update("challanNo", v)}
          placeholder="e.g. CH-2026-089"
        />
        <Field
          label="P.O. Date / No"
          value={data.poDateNo}
          onChange={(v) => update("poDateNo", v)}
          placeholder="e.g. PO/99821"
        />
        <div className="sm:col-span-2">
          <Field
            label="Place of Supply"
            value={data.placeOfSupply}
            onChange={(v) => update("placeOfSupply", v)}
            placeholder="e.g. Gujarat (24)"
          />
        </div>
      </div>
    </div>
  );
}
