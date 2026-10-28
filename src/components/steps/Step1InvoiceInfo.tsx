"use client";

import { InvoiceInfo } from "@/types/invoice";

interface Props {
  data: InvoiceInfo;
  onChange: (data: InvoiceInfo) => void;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-slate-300 text-sm font-medium mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-yellow-400/70 focus:ring-1 focus:ring-yellow-400/20 transition-all"
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
      <div className="mb-6">
        <h2 className="text-xl font-bold text-yellow-400">Invoice Information</h2>
        <p className="text-slate-400 text-sm mt-1">Enter the basic invoice details</p>
      </div>

      {/* Company Header Preview */}
      <div className="mb-6 rounded-xl overflow-hidden border border-slate-700/50">
        <img
          src="/header.png"
          alt="JSS Enterprise Header"
          className="w-full object-contain bg-slate-900"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label="Invoice No"
          value={data.invoiceNo}
          onChange={(v) => update("invoiceNo", v)}
          placeholder="JSS/24-25/0142"
          required
        />
        <Field
          label="Invoice Date"
          value={data.invoiceDate}
          onChange={(v) => update("invoiceDate", v)}
          placeholder="17/10/2026"
          required
        />
        <Field
          label="Challan No"
          value={data.challanNo}
          onChange={(v) => update("challanNo", v)}
          placeholder="CH-2026-089"
        />
        <Field
          label="P.O. Date / No"
          value={data.poDateNo}
          onChange={(v) => update("poDateNo", v)}
          placeholder="PO/99821"
        />
        <div className="sm:col-span-2">
          <Field
            label="Place of Supply"
            value={data.placeOfSupply}
            onChange={(v) => update("placeOfSupply", v)}
            placeholder="Gujarat (24)"
          />
        </div>
      </div>
    </div>
  );
}
