"use client";

import { BankDetails } from "@/types/invoice";

interface Props {
  bankDetails: BankDetails;
  termsAndConditions: string;
  onChange: (data: BankDetails) => void;
  onTermsChange: (terms: string) => void;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-slate-700 text-xs font-semibold mb-1.5">{label}</label>
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

export default function Step4BankDetails({
  bankDetails,
  termsAndConditions,
  onChange,
  onTermsChange,
}: Props) {
  const update = (key: keyof BankDetails, value: string) => {
    onChange({ ...bankDetails, [key]: value });
  };

  return (
    <div className="p-6">
      {/* Title */}
      <div className="mb-5 pb-4 border-b border-slate-100">
        <h3 className="text-base font-bold text-slate-900">Step 4: Bank Payment Details &amp; Terms</h3>
        <p className="text-slate-500 text-xs mt-0.5">Configure your bank account information and bill policy terms</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Field
          label="Bank Name"
          value={bankDetails.bankName}
          onChange={(v) => update("bankName", v)}
          placeholder="e.g. UNION BANK OF INDIA"
        />
        <Field
          label="Account Holder Name"
          value={bankDetails.accountHolder}
          onChange={(v) => update("accountHolder", v)}
          placeholder="e.g. JSS ENTERPRISE"
        />
        <Field
          label="Account Number"
          value={bankDetails.accountNo}
          onChange={(v) => update("accountNo", v)}
          placeholder="e.g. 50360 20100 10504"
        />
        <Field
          label="IFSC Code"
          value={bankDetails.ifscCode}
          onChange={(v) => update("ifscCode", v)}
          placeholder="e.g. UBIN0550361"
        />
        <div className="sm:col-span-2">
          <Field
            label="Branch"
            value={bankDetails.branch}
            onChange={(v) => update("branch", v)}
            placeholder="e.g. ODHAV RING ROAD / Ahmedabad"
          />
        </div>
      </div>

      {/* Terms & Conditions */}
      <div>
        <label className="block text-slate-700 text-xs font-semibold mb-1.5">
          Terms &amp; Conditions
        </label>
        <textarea
          value={termsAndConditions}
          onChange={(e) => onTermsChange(e.target.value)}
          rows={5}
          placeholder="Enter terms and conditions (one per line)..."
          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all resize-none shadow-2xs leading-relaxed"
        />
        <p className="text-slate-400 text-[11px] mt-1">Each line is formatted as a numbered condition on the invoice.</p>
      </div>
    </div>
  );
}
