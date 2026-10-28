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
      <label className="block text-slate-300 text-sm font-medium mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-yellow-400/70 focus:ring-1 focus:ring-yellow-400/20 transition-all"
      />
    </div>
  );
}

export default function Step4BankDetails({ bankDetails, termsAndConditions, onChange, onTermsChange }: Props) {
  const update = (key: keyof BankDetails, value: string) => {
    onChange({ ...bankDetails, [key]: value });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-yellow-400">Bank Payment Details</h2>
        <p className="text-slate-400 text-sm mt-1">Bank account and payment information</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Field
          label="Bank Name"
          value={bankDetails.bankName}
          onChange={(v) => update("bankName", v)}
          placeholder="UNION BANK OF INDIA"
        />
        <Field
          label="Account Holder"
          value={bankDetails.accountHolder}
          onChange={(v) => update("accountHolder", v)}
          placeholder="JSS ENTERPRISE"
        />
        <Field
          label="Account No"
          value={bankDetails.accountNo}
          onChange={(v) => update("accountNo", v)}
          placeholder="50360 20100 10504"
        />
        <Field
          label="IFSC Code"
          value={bankDetails.ifscCode}
          onChange={(v) => update("ifscCode", v)}
          placeholder="UBIN0550361"
        />
        <div className="sm:col-span-2">
          <Field
            label="Branch"
            value={bankDetails.branch}
            onChange={(v) => update("branch", v)}
            placeholder="ODHAV RING ROAD / Ahmedabad"
          />
        </div>
      </div>

      {/* Terms & Conditions */}
      <div>
        <label className="block text-slate-300 text-sm font-medium mb-1.5">
          Terms &amp; Conditions
        </label>
        <textarea
          value={termsAndConditions}
          onChange={(e) => onTermsChange(e.target.value)}
          rows={5}
          placeholder="Enter terms and conditions..."
          className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-yellow-400/70 focus:ring-1 focus:ring-yellow-400/20 transition-all resize-none"
        />
        <p className="text-slate-500 text-xs mt-1">Each line will be shown as a numbered item on the invoice.</p>
      </div>
    </div>
  );
}

