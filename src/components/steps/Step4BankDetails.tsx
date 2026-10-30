"use client";

import { useEffect, useState } from "react";
import { BankDetails } from "@/types/invoice";
import { BankProfile } from "@/types/settings";
import { getStoredSettings, fetchSettings } from "@/lib/settings-storage";
import { Check, Landmark } from "lucide-react";

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
  const [profiles, setProfiles] = useState<BankProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");

  useEffect(() => {
    const s = getStoredSettings();
    if (s.bankProfiles && s.bankProfiles.length > 0) {
      setProfiles(s.bankProfiles);
      const def = s.bankProfiles.find((b) => b.isDefault) || s.bankProfiles[0];
      setSelectedProfileId(def.id);
    }

    fetchSettings().then((cloudSettings) => {
      if (cloudSettings.bankProfiles && cloudSettings.bankProfiles.length > 0) {
        setProfiles(cloudSettings.bankProfiles);
      }
    });
  }, []);

  const handleSelectBankProfile = (prof: BankProfile) => {
    setSelectedProfileId(prof.id);
    onChange({ ...prof.bankDetails });
    if (prof.termsAndConditions) {
      onTermsChange(prof.termsAndConditions);
    }
  };

  const update = (key: keyof BankDetails, value: string) => {
    onChange({ ...bankDetails, [key]: value });
  };

  return (
    <div className="p-6">
      {/* Title */}
      <div className="mb-5 pb-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Landmark className="w-5 h-5 text-amber-500" />
            <span>Step 4: Bank Payment Details &amp; Terms</span>
          </h3>
          <p className="text-slate-500 text-xs mt-0.5">
            Select a saved bank profile or configure specific account details for this bill
          </p>
        </div>
      </div>

      {/* ── SAVED BANK PROFILES SELECTOR ── */}
      {profiles.length > 0 && (
        <div className="mb-6 bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5">
          <label className="block text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-2">
            Choose Saved Bank Profile (Configurable in Settings Menu):
          </label>
          <div className="flex flex-wrap gap-2">
            {profiles.map((prof) => {
              const isSelected =
                prof.id === selectedProfileId ||
                prof.bankDetails.accountNo.trim() === bankDetails.accountNo.trim();
              return (
                <button
                  key={prof.id}
                  type="button"
                  onClick={() => handleSelectBankProfile(prof)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs ${
                    isSelected
                      ? "bg-amber-500 text-white shadow-xs"
                      : "bg-white text-slate-700 border border-slate-300 hover:border-amber-400"
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                  <span>{prof.profileName}</span>
                  {prof.isDefault && (
                    <span className="text-[10px] opacity-75 font-normal">(Default)</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

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
