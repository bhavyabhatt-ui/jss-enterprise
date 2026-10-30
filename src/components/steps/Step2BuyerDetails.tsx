"use client";

import { useState, useEffect } from "react";
import { BuyerDetails, Invoice } from "@/types/invoice";
import { getAllInvoices, getInvoiceRecommendations } from "@/lib/storage";
import { User, MapPin, Building, Phone, Sparkles } from "lucide-react";

interface Props {
  data: BuyerDetails;
  onChange: (data: BuyerDetails) => void;
}

export default function Step2BuyerDetails({ data, onChange }: Props) {
  const [customerSuggestions, setCustomerSuggestions] = useState<
    Array<{
      customerName: string;
      address: string;
      cityState: string;
      gstinPan: string;
      contactNo: string;
    }>
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const historicalInvoices = getAllInvoices();
    const { customers } = getInvoiceRecommendations(historicalInvoices);
    setCustomerSuggestions(customers);
  }, []);

  const update = (key: keyof BuyerDetails, value: string) => {
    onChange({ ...data, [key]: value });
  };

  const selectCustomer = (cust: {
    customerName: string;
    address: string;
    cityState: string;
    gstinPan: string;
    contactNo: string;
  }) => {
    onChange({
      customerName: cust.customerName,
      address: cust.address,
      cityState: cust.cityState,
      gstinPan: cust.gstinPan,
      contactNo: cust.contactNo,
    });
    setShowSuggestions(false);
  };

  const matchingCustomers = customerSuggestions.filter((c) =>
    c.customerName.toLowerCase().includes((data.customerName || "").toLowerCase())
  );

  const inputClass =
    "w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all shadow-2xs";

  return (
    <div className="p-4 sm:p-6">
      {/* Title */}
      <div className="mb-5 pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-900">Step 2: Billed To / Buyer Details</h3>
          <p className="text-slate-500 text-xs mt-0.5">Enter the customer or purchasing company details</p>
        </div>

        {customerSuggestions.length > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full self-start sm:self-auto">
            <Sparkles className="w-3 h-3 text-amber-600" />
            <span>{customerSuggestions.length} saved customer(s) available</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Customer Name with Autocomplete Recommendations */}
        <div className="sm:col-span-2 relative">
          <label className="block text-slate-700 text-xs font-semibold mb-1.5 flex items-center justify-between">
            <span>
              Customer / Company Name <span className="text-rose-500">*</span>
            </span>
            {customerSuggestions.length > 0 && (
              <span className="text-[10px] text-slate-400 font-normal">
                Type or select from past bills to auto-fill
              </span>
            )}
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={data.customerName}
              onFocus={() => setShowSuggestions(true)}
              onChange={(e) => {
                update("customerName", e.target.value);
                setShowSuggestions(true);
              }}
              placeholder="e.g. M/s. Precision Tools Ltd."
              className={inputClass}
            />
          </div>

          {/* Autocomplete Dropdown */}
          {showSuggestions && matchingCustomers.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-56 overflow-y-auto divide-y divide-slate-100">
              <div className="p-2 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Recommendations from past bills</span>
                <button
                  type="button"
                  onClick={() => setShowSuggestions(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              </div>
              {matchingCustomers.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectCustomer(c)}
                  className="w-full text-left p-3 hover:bg-amber-50/70 transition-colors flex items-start gap-2.5 group"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    {c.customerName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 group-hover:text-amber-700">
                      {c.customerName}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {c.cityState || c.address || "No address"} {c.contactNo ? `• ${c.contactNo}` : ""}
                    </p>
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-600 group-hover:bg-amber-200/60 group-hover:text-amber-800 px-2 py-0.5 rounded font-medium shrink-0">
                    Auto-Fill
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Address */}
        <div className="sm:col-span-2">
          <label className="block text-slate-700 text-xs font-semibold mb-1.5">Address</label>
          <textarea
            value={data.address}
            onChange={(e) => update("address", e.target.value)}
            placeholder="e.g. Plot No. 45, GIDC Industrial Estate"
            rows={2}
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* City / State */}
        <div>
          <label className="block text-slate-700 text-xs font-semibold mb-1.5">City / State</label>
          <input
            type="text"
            value={data.cityState}
            onChange={(e) => update("cityState", e.target.value)}
            placeholder="e.g. Odhav, Ahmedabad - 382415"
            className={inputClass}
          />
        </div>

        {/* GSTIN / PAN */}
        <div>
          <label className="block text-slate-700 text-xs font-semibold mb-1.5">GSTIN / PAN</label>
          <input
            type="text"
            value={data.gstinPan}
            onChange={(e) => update("gstinPan", e.target.value)}
            placeholder="e.g. 24AAACP1234F1Z2"
            className={`${inputClass} font-mono`}
          />
        </div>

        {/* Contact No */}
        <div className="sm:col-span-2">
          <label className="block text-slate-700 text-xs font-semibold mb-1.5">
            Contact No <span className="text-slate-400 text-[10px] font-normal">(Used for direct WhatsApp sharing)</span>
          </label>
          <input
            type="text"
            value={data.contactNo}
            onChange={(e) => update("contactNo", e.target.value)}
            placeholder="e.g. +91 98765 43210"
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
}
