"use client";

import { useState } from "react";
import { Invoice, DEFAULT_COMPANY_HEADER } from "@/types/invoice";
import {
  Building2,
  Calendar,
  CreditCard,
  FileText,
  Phone,
  Mail,
  MapPin,
  Check,
  Copy,
  Receipt,
  FileCheck,
} from "lucide-react";

interface Props {
  invoice: Invoice;
}

export default function MobileInvoiceCardView({ invoice }: Props) {
  const [copiedBank, setCopiedBank] = useState(false);
  const [copiedInvoiceNo, setCopiedInvoiceNo] = useState(false);

  const header = invoice.header || DEFAULT_COMPANY_HEADER;
  const {
    invoiceInfo,
    buyerDetails,
    items,
    bankDetails,
    taxDetails,
    termsAndConditions,
    subTotal,
    cgstAmount,
    sgstAmount,
    igstAmount,
    grandTotal,
    amountInWords,
  } = invoice;

  const formatCurrency = (num: number) =>
    num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const copyBankInfo = () => {
    const text = `${header.companyName} - Bank Details\nBank: ${bankDetails.bankName}\nAccount Holder: ${bankDetails.accountHolder}\nA/C No: ${bankDetails.accountNo}\nIFSC: ${bankDetails.ifscCode}\nBranch: ${bankDetails.branch}`;
    navigator.clipboard.writeText(text);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2500);
  };

  const copyInvoiceNo = () => {
    navigator.clipboard.writeText(invoiceInfo.invoiceNo || "");
    setCopiedInvoiceNo(true);
    setTimeout(() => setCopiedInvoiceNo(false), 2500);
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-3.5 pb-6 text-slate-800">
      {/* ── 1. COMPANY BRANDING HEADER CARD ── */}
      <div className="bg-[#1e2329] text-white rounded-2xl p-4 shadow-md border border-slate-800 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-wide text-amber-400">{header.companyName}</span>
            </div>
            <p className="text-[10px] font-bold tracking-widest text-slate-300 mt-0.5 uppercase">
              {header.tagline}
            </p>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase tracking-wide">
            {header.invoiceTitle}
          </span>
        </div>

        <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
          {header.address}
        </p>

        {/* GSTIN & State Code Badge */}
        <div className="bg-[#242c35] border border-slate-700 rounded-lg p-2.5 mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-medium block">GSTIN</span>
            <span className="font-mono font-bold text-amber-400 text-[11px]">{header.gstin}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-medium block">State Code</span>
            <span className="font-semibold text-slate-200 text-[11px]">{header.stateCode}</span>
          </div>
        </div>

        {/* Quick Contact Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800 text-[11px]">
          <a
            href={`tel:${header.phone.replace(/\s+/g, "")}`}
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-800/80 hover:bg-slate-750 text-slate-200 border border-slate-700/60 active:scale-98 transition-all"
          >
            <Phone className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-medium truncate">{header.phone}</span>
          </a>
          <a
            href={`mailto:${header.email}`}
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-800/80 hover:bg-slate-750 text-slate-200 border border-slate-700/60 active:scale-98 transition-all truncate"
          >
            <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-medium truncate">{header.email}</span>
          </a>
        </div>
      </div>

      {/* ── 2. INVOICE META CARD ── */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">Invoice Information</span>
          </div>
          <button
            type="button"
            onClick={copyInvoiceNo}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200 transition-colors"
          >
            {copiedInvoiceNo ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            <span>{copiedInvoiceNo ? "Copied" : "Copy No"}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-500 font-medium block">Invoice No</span>
            <span className="font-bold text-slate-900 text-xs break-all">{invoiceInfo.invoiceNo || "-"}</span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-500 font-medium block">Invoice Date</span>
            <span className="font-bold text-slate-900 text-xs">{invoiceInfo.invoiceDate || "-"}</span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-500 font-medium block">Challan No</span>
            <span className="font-semibold text-slate-800 text-xs">{invoiceInfo.challanNo || "-"}</span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-500 font-medium block">P.O. Date / No</span>
            <span className="font-semibold text-slate-800 text-xs">{invoiceInfo.poDateNo || "-"}</span>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs px-1">
          <span className="text-slate-500 font-medium">Place of Supply:</span>
          <span className="font-bold text-slate-900">{invoiceInfo.placeOfSupply || "-"}</span>
        </div>
      </div>

      {/* ── 3. BUYER / CUSTOMER CARD ── */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100">
          <Building2 className="w-4 h-4 text-sky-600" />
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">Billed To / Buyer</span>
        </div>

        <h4 className="text-sm font-bold text-slate-900 mb-1">{buyerDetails.customerName || "-"}</h4>
        
        {buyerDetails.address && (
          <div className="flex items-start gap-1.5 text-xs text-slate-600 mb-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
            <span>{buyerDetails.address}{buyerDetails.cityState ? `, ${buyerDetails.cityState}` : ""}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
          <div>
            <span className="text-[10px] text-slate-500 font-medium block">GSTIN / PAN</span>
            <span className="font-mono font-bold text-slate-900 text-[11px]">{buyerDetails.gstinPan || "-"}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-medium block">Contact</span>
            {buyerDetails.contactNo ? (
              <a href={`tel:${buyerDetails.contactNo}`} className="font-semibold text-sky-600 hover:underline">
                {buyerDetails.contactNo}
              </a>
            ) : (
              <span className="text-slate-400">-</span>
            )}
          </div>
        </div>
      </div>

      {/* ── 4. ITEMS & SPECIFICATIONS ── */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Items &amp; Products ({items.length})
            </span>
          </div>
          <span className="text-[11px] font-semibold text-slate-500">
            Sub-Total: ₹ {formatCurrency(subTotal)}
          </span>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={item.id || index}
              className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-start gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs leading-snug">
                      {item.description || "Item"}
                    </h5>
                    {item.specifications && (
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        {item.specifications}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold text-xs text-slate-900 block">
                    ₹ {formatCurrency(Number(item.amount))}
                  </span>
                </div>
              </div>

              {/* Item Details Row */}
              <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-slate-200/60 text-[11px] text-slate-600">
                {item.hsnSac && (
                  <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 font-mono text-[10px] text-slate-700">
                    HSN: {item.hsnSac}
                  </span>
                )}
                <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  Qty: <strong className="text-slate-800">{item.qty} {item.unit}</strong>
                </span>
                <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  Rate: ₹ {formatCurrency(Number(item.rate))}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 5. BANK DETAILS CARD ── */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">Bank Payment Details</span>
          </div>
          <button
            type="button"
            onClick={copyBankInfo}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200 transition-colors"
          >
            {copiedBank ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            <span>{copiedBank ? "Copied" : "Copy Bank"}</span>
          </button>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center py-1 border-b border-slate-100">
            <span className="text-slate-500">Bank Name</span>
            <span className="font-bold text-slate-900">{bankDetails.bankName || "-"}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-100">
            <span className="text-slate-500">Account Holder</span>
            <span className="font-bold text-slate-900">{bankDetails.accountHolder || "-"}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-100">
            <span className="text-slate-500">Account No</span>
            <span className="font-mono font-bold text-slate-900">{bankDetails.accountNo || "-"}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-100">
            <span className="text-slate-500">IFSC Code</span>
            <span className="font-mono font-bold text-slate-900">{bankDetails.ifscCode || "-"}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-slate-500">Branch</span>
            <span className="font-semibold text-slate-800 text-[11px] text-right">{bankDetails.branch || "-"}</span>
          </div>
        </div>
      </div>

      {/* ── 6. TAX BREAKDOWN & GRAND TOTAL CARD ── */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 overflow-hidden">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide pb-2 mb-2 border-b border-slate-100">
          Payment Breakdown
        </h4>

        <div className="space-y-1.5 text-xs text-slate-600 mb-3">
          <div className="flex justify-between items-center py-0.5">
            <span>Sub-Total (Excl. Tax)</span>
            <span className="font-semibold text-slate-800">₹ {formatCurrency(subTotal)}</span>
          </div>
          <div className="flex justify-between items-center py-0.5">
            <span>CGST @ {taxDetails.cgst}%</span>
            <span className="font-semibold text-slate-800">₹ {formatCurrency(cgstAmount)}</span>
          </div>
          <div className="flex justify-between items-center py-0.5">
            <span>SGST @ {taxDetails.sgst}%</span>
            <span className="font-semibold text-slate-800">₹ {formatCurrency(sgstAmount)}</span>
          </div>
          <div className="flex justify-between items-center py-0.5">
            <span>IGST @ {taxDetails.igst}%</span>
            <span className="font-semibold text-slate-800">₹ {formatCurrency(igstAmount)}</span>
          </div>
        </div>

        {/* Grand Total Box */}
        <div className="bg-[#1b2631] text-white rounded-xl p-3.5 mb-3 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-amber-400 tracking-wider uppercase block">
              GRAND TOTAL
            </span>
            <span className="text-[11px] text-slate-300">All Taxes Included</span>
          </div>
          <div className="text-right">
            <span className="text-lg font-black text-amber-400 tracking-tight">
              ₹ {formatCurrency(grandTotal)}
            </span>
          </div>
        </div>

        {/* Amount in words */}
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px]">
          <span className="font-bold text-slate-700 block mb-0.5">Amount in Words:</span>
          <span className="text-slate-900 italic font-medium">{amountInWords}</span>
        </div>
      </div>

      {/* ── 7. TERMS & SIGNATORY ── */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 pb-2 mb-2 border-b border-slate-100">
          <FileCheck className="w-4 h-4 text-slate-600" />
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">Terms &amp; Signatory</span>
        </div>

        <div className="text-[11px] text-slate-600 space-y-1 mb-4 leading-relaxed bg-slate-50 p-2.5 rounded-xl">
          {termsAndConditions
            .split("\n")
            .filter(Boolean)
            .map((term, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <span className="text-slate-400 font-bold shrink-0">•</span>
                <span>{term}</span>
              </div>
            ))}
        </div>

        <div className="text-right pt-2 border-t border-slate-100">
          <p className="font-bold text-xs text-slate-900">For, JSS ENTERPRISE</p>
          <div className="w-36 border-t border-slate-400 ml-auto mt-7 mb-1" />
          <p className="font-semibold text-slate-600 text-[11px]">Authorized Signatory</p>
        </div>
      </div>
    </div>
  );
}

