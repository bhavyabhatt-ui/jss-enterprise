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
  const cls =
    "w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-yellow-400/70 focus:ring-1 focus:ring-yellow-400/20 transition-all";
  return (
    <div>
      <label className="block text-slate-300 text-sm font-medium mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className={cls + " resize-none"}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cls}
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
      <div className="mb-6">
        <h2 className="text-xl font-bold text-yellow-400">Billed To / Buyer Details</h2>
        <p className="text-slate-400 text-sm mt-1">Enter the buyer&apos;s information</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Field
            label="Customer Name"
            value={data.customerName}
            onChange={(v) => update("customerName", v)}
            placeholder="M/s. Precision Tools Ltd."
            required
          />
        </div>
        <div className="sm:col-span-2">
          <Field
            label="Address"
            value={data.address}
            onChange={(v) => update("address", v)}
            placeholder="Plot No. 45, GIDC Industrial Estate"
            textarea
          />
        </div>
        <Field
          label="City / State"
          value={data.cityState}
          onChange={(v) => update("cityState", v)}
          placeholder="Odhav, Ahmedabad - 382415"
        />
        <Field
          label="GSTIN / PAN"
          value={data.gstinPan}
          onChange={(v) => update("gstinPan", v)}
          placeholder="24AAACP1234F1Z2"
        />
        <div className="sm:col-span-2">
          <Field
            label="Contact No"
            value={data.contactNo}
            onChange={(v) => update("contactNo", v)}
            placeholder="+91 98765 43210"
          />
        </div>
      </div>
    </div>
  );
}

