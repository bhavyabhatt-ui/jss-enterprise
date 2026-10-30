"use client";

import { CompanyHeader, DEFAULT_COMPANY_HEADER } from "@/types/invoice";
import { Building2, Sparkles, MapPin, Phone, Mail, FileText, Hash, RotateCcw } from "lucide-react";

interface Props {
  data: CompanyHeader;
  onChange: (header: CompanyHeader) => void;
}

export default function Step0HeaderDetails({ data, onChange }: Props) {
  const header = data || DEFAULT_COMPANY_HEADER;

  const handleChange = (field: keyof CompanyHeader, value: string) => {
    onChange({
      ...header,
      [field]: value,
    });
  };

  const handleReset = () => {
    onChange({ ...DEFAULT_COMPANY_HEADER });
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80">
        <div>
          <h3 className="text-slate-900 font-bold text-base flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-500" />
            <span>Company Header &amp; Bill Details</span>
          </h3>
          <p className="text-slate-500 text-xs mt-0.5">
            Customize the official company header, address, GSTIN, and contact details for this invoice.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* ── LIVE HEADER PREVIEW BOX ── */}
      <div>
        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          Live Header Preview (Appears at top of Invoice &amp; PDF)
        </label>
        <div className="bg-[#1e2329] text-white p-4 rounded-xl border border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Left: Logo & Info */}
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-lg bg-white/10 p-1 border border-amber-400/30 shrink-0 flex items-center justify-center">
              <img src="/logo.png" alt="Company Logo" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <h4 className="font-extrabold text-[#f59e0b] text-sm sm:text-base tracking-wide uppercase leading-tight truncate">
                {header.companyName || "JSS ENTERPRISE"}
              </h4>
              <p className="text-slate-300 text-[10px] tracking-widest font-semibold uppercase mt-0.5 truncate">
                {header.tagline || "PRECISION | POWER | PROGRESS"}
              </p>
              <p className="text-slate-300 text-[11px] mt-1 leading-snug line-clamp-2">
                {header.address || "Company Address"}
              </p>
              <p className="text-[11px] text-slate-300 mt-0.5 flex flex-wrap gap-x-2">
                <span>
                  <strong className="text-[#f59e0b]">Mobile:</strong> {header.phone || "-"}
                </span>
                <span>|</span>
                <span>
                  <strong className="text-[#f59e0b]">Email:</strong> {header.email || "-"}
                </span>
              </p>
            </div>
          </div>

          {/* Right: Tax Invoice Title & GSTIN */}
          <div className="md:border-l md:border-slate-700/80 md:pl-5 shrink-0 flex flex-col items-start md:items-end w-full md:w-auto pt-2 md:pt-0 border-t border-slate-700/50 md:border-t-0">
            <h5 className="font-extrabold text-[#f59e0b] text-base sm:text-lg tracking-wider uppercase">
              {header.invoiceTitle || "TAX INVOICE"}
            </h5>
            <div className="mt-1 px-3 py-1 rounded-md border border-[#f59e0b]/80 bg-black/30 text-[11px] font-mono text-white font-bold tracking-wider">
              GSTIN: {header.gstin || "24LRHPS9541P1ZN"}
            </div>
            <span className="text-[10px] text-slate-400 mt-1">
              State Code: {header.stateCode || "24 (Gujarat)"}
            </span>
          </div>
        </div>
      </div>

      {/* ── EDITABLE FORM FIELDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Company Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Company Name</span>
          </label>
          <input
            type="text"
            value={header.companyName}
            onChange={(e) => handleChange("companyName", e.target.value)}
            placeholder="e.g. JSS ENTERPRISE"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs font-medium focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        {/* Tagline */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-slate-400" />
            <span>Tagline / Slogan</span>
          </label>
          <input
            type="text"
            value={header.tagline}
            onChange={(e) => handleChange("tagline", e.target.value)}
            placeholder="e.g. PRECISION | POWER | PROGRESS"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs font-medium focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        {/* Full Address */}
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>Registered Office / Factory Address</span>
          </label>
          <input
            type="text"
            value={header.address}
            onChange={(e) => handleChange("address", e.target.value)}
            placeholder="Pushpak Co-Op Hsg Soc., Kathwada Road, Ahmedabad - 382430"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs font-medium focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        {/* Phone / Mobile */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span>Contact Number / Mobile</span>
          </label>
          <input
            type="text"
            value={header.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="+91 8905605092"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs font-medium focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span>Official Email</span>
          </label>
          <input
            type="email"
            value={header.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="jssenterprise0411@gmail.com"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs font-medium focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        {/* Document Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Invoice Document Title</span>
          </label>
          <input
            type="text"
            value={header.invoiceTitle}
            onChange={(e) => handleChange("invoiceTitle", e.target.value)}
            placeholder="e.g. TAX INVOICE or BILL OF SUPPLY"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs font-medium focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        {/* GSTIN */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-slate-400" />
            <span>GSTIN Number</span>
          </label>
          <input
            type="text"
            value={header.gstin}
            onChange={(e) => handleChange("gstin", e.target.value)}
            placeholder="24LRHPS9541P1ZN"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs font-mono font-medium focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        {/* State Code */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>State &amp; State Code</span>
          </label>
          <input
            type="text"
            value={header.stateCode}
            onChange={(e) => handleChange("stateCode", e.target.value)}
            placeholder="24 (Gujarat)"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs font-medium focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
      </div>
    </div>
  );
}

