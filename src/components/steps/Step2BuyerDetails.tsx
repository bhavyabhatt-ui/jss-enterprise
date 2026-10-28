"use client";

import { BuyerDetails } from "@/types/invoice";

interface Props {
  data: BuyerDetails;
  onChange: (data: BuyerDetails) => void;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  textarea?: boolean;
}) {
  const inputClass =
    "w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all shadow-2xs";

  return (
    <div>
      <label className="block text-slate-700 text-xs font-semibold mb-1.5">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className={`${inputClass} resize-none`}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputClass}
        />
      )}
    </div>
  );
}

export default function Step2BuyerDetails({ data, onChange }: Props) {
  const update = (key: keyof BuyerDetails, value: string) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <div className="p-6">
      {/* Title */}
      <div className="mb-5 pb-4 border-b border-slate-100">
        <h3 className="text-base font-bold text-slate-900">Step 2: Billed To / Buyer Details</h3>
        <p className="text-slate-500 text-xs mt-0.5">Enter the customer or purchasing company details</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Field
            label="Customer / Company Name"
            value={data.customerName}
            onChange={(v) => update("customerName", v)}
            placeholder="e.g. M/s. Precision Tools Ltd."
            required
          />
        </div>
        <div className="sm:col-span-2">
          <Field
            label="Address"
            value={data.address}
            onChange={(v) => update("address", v)}
            placeholder="e.g. Plot No. 45, GIDC Industrial Estate"
            textarea
          />
        </div>
        <Field
          label="City / State"
          value={data.cityState}
          onChange={(v) => update("cityState", v)}
          placeholder="e.g. Odhav, Ahmedabad - 382415"
        />
        <Field
          label="GSTIN / PAN"
          value={data.gstinPan}
          onChange={(v) => update("gstinPan", v)}
          placeholder="e.g. 24AAACP1234F1Z2"
        />
        <div className="sm:col-span-2">
          <Field
            label="Contact No (Used for direct WhatsApp sharing)"
            value={data.contactNo}
            onChange={(v) => update("contactNo", v)}
            placeholder="e.g. +91 98765 43210"
          />
        </div>
      </div>
    </div>
  );
}
