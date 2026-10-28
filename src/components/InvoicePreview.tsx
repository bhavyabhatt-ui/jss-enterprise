"use client";

import { Invoice } from "@/types/invoice";
import { HEADER_IMAGE_BASE64 } from "@/lib/assets";

interface Props {
  invoice: Invoice;
}

export default function InvoicePreview({ invoice }: Props) {
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

  return (
    <div
      id="invoice-print-area"
      className="invoice-bill-sheet bg-white text-slate-900 mx-auto p-5 sm:p-6 shadow-md rounded-xl border border-slate-200"
      style={{
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        fontSize: "12px",
        lineHeight: 1.4,
        color: "#0f172a",
        backgroundColor: "#ffffff",
      }}
    >
      {/* ── TOP HEADER BANNER ── */}
      <div className="rounded-xl overflow-hidden mb-3.5 shadow-xs border border-slate-800 bg-[#1e2329]">
        <img
          src={HEADER_IMAGE_BASE64}
          alt="JSS Enterprise Tax Invoice"
          className="w-full h-auto block object-contain"
          style={{ width: "800px", maxHeight: "165px" }}
        />
      </div>

      {/* ── INVOICE INFO & BUYER DETAILS (STRICT 2 COLUMNS ON ALL DEVICES) ── */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Left: Invoice Information */}
        <div className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-2xs">
          <div className="bg-[#243342] text-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider">
            <span>INVOICE INFORMATION</span>
          </div>
          <div className="p-2.5 text-xs divide-y divide-slate-100">
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 font-medium">Invoice No:</span>
              <span className="font-bold text-slate-900 text-right">{invoiceInfo.invoiceNo || "-"}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 font-medium">Invoice Date:</span>
              <span className="font-bold text-slate-900 text-right">{invoiceInfo.invoiceDate || "-"}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 font-medium">Challan No:</span>
              <span className="font-bold text-slate-900 text-right">{invoiceInfo.challanNo || "-"}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 font-medium">P.O. Date / No:</span>
              <span className="font-bold text-slate-900 text-right">{invoiceInfo.poDateNo || "-"}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 font-medium">Place of Supply:</span>
              <span className="font-bold text-slate-900 text-right">{invoiceInfo.placeOfSupply || "-"}</span>
            </div>
          </div>
        </div>

        {/* Right: Billed To / Buyer Details */}
        <div className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-2xs">
          <div className="bg-[#243342] text-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider">
            <span>BILLED TO / BUYER DETAILS</span>
          </div>
          <div className="p-2.5 text-xs divide-y divide-slate-100">
            <div className="flex justify-between items-start py-1">
              <span className="text-slate-500 font-medium whitespace-nowrap pr-2">Customer Name:</span>
              <span className="font-bold text-slate-900 text-right">{buyerDetails.customerName || "-"}</span>
            </div>
            <div className="flex justify-between items-start py-1">
              <span className="text-slate-500 font-medium whitespace-nowrap pr-2">Address:</span>
              <span className="font-bold text-slate-900 text-right text-[11px]">{buyerDetails.address || "-"}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 font-medium whitespace-nowrap pr-2">City / State:</span>
              <span className="font-bold text-slate-900 text-right">{buyerDetails.cityState || "-"}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 font-medium whitespace-nowrap pr-2">GSTIN / PAN:</span>
              <span className="font-bold text-slate-900 text-right">{buyerDetails.gstinPan || "-"}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 font-medium whitespace-nowrap pr-2">Contact No:</span>
              <span className="font-bold text-slate-900 text-right">{buyerDetails.contactNo || "-"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── ITEMS TABLE (FULL WIDTH TABLE) ── */}
      <div className="border border-slate-300 rounded-lg overflow-hidden mb-3 shadow-2xs">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-[#243342] text-white text-[11px]">
              <th className="py-2 px-2 text-center font-bold w-8">#</th>
              <th className="py-2 px-3 text-left font-bold">Item Description &amp; Specifications</th>
              <th className="py-2 px-2 text-center font-bold w-24">HSN/SAC</th>
              <th className="py-2 px-2 text-center font-bold w-14">Qty</th>
              <th className="py-2 px-2 text-center font-bold w-16">Unit</th>
              <th className="py-2 px-3 text-right font-bold w-28">Rate (₹)</th>
              <th className="py-2 px-3 text-right font-bold w-28">Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.map((item, idx) => (
              <tr
                key={item.id}
                className={idx % 2 === 1 ? "bg-slate-50/70" : "bg-white"}
              >
                <td className="py-2 px-2 text-center text-slate-500 font-medium">{idx + 1}</td>
                <td className="py-2 px-3 text-left">
                  <div className="font-bold text-slate-900">{item.description || "-"}</div>
                  {item.specifications && (
                    <div className="text-slate-500 text-[11px] mt-0.5">{item.specifications}</div>
                  )}
                </td>
                <td className="py-2 px-2 text-center text-slate-600 font-mono text-[11px]">{item.hsnSac || "-"}</td>
                <td className="py-2 px-2 text-center font-semibold text-slate-800">{item.qty}</td>
                <td className="py-2 px-2 text-center text-slate-600 font-medium">{item.unit}</td>
                <td className="py-2 px-3 text-right text-slate-700 font-medium">{formatCurrency(Number(item.rate))}</td>
                <td className="py-2 px-3 text-right font-bold text-slate-900">{formatCurrency(Number(item.amount))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── BANK DETAILS & TOTALS (STRICT 2 COLUMNS ON ALL DEVICES) ── */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Left: Bank Payment Details */}
        <div className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-2xs">
          <div className="bg-[#243342] text-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider">
            <span>BANK PAYMENT DETAILS</span>
          </div>
          <div className="p-2.5 text-xs divide-y divide-slate-100">
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 font-medium">Bank Name:</span>
              <span className="font-bold text-slate-900 text-right">{bankDetails.bankName || "-"}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 font-medium">Account Holder:</span>
              <span className="font-bold text-slate-900 text-right">{bankDetails.accountHolder || "-"}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 font-medium">Account No:</span>
              <span className="font-bold text-slate-900 font-mono text-right">{bankDetails.accountNo || "-"}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 font-medium">IFSC Code:</span>
              <span className="font-bold text-slate-900 font-mono text-right">{bankDetails.ifscCode || "-"}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 font-medium">Branch:</span>
              <span className="font-bold text-slate-900 text-right text-[11px]">{bankDetails.branch || "-"}</span>
            </div>
          </div>
        </div>

        {/* Right: Totals Box */}
        <div className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-2xs flex flex-col justify-between">
          <div className="p-2.5 text-xs divide-y divide-slate-100 flex-1">
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-600 font-medium">Sub-Total (Excl. Tax)</span>
              <span className="font-bold text-slate-900 text-right">₹ {formatCurrency(subTotal)}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-600 font-medium">CGST @ {taxDetails.cgst}%</span>
              <span className="font-bold text-slate-900 text-right">₹ {formatCurrency(cgstAmount)}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-600 font-medium">SGST @ {taxDetails.sgst}%</span>
              <span className="font-bold text-slate-900 text-right">₹ {formatCurrency(sgstAmount)}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-600 font-medium">IGST @ {taxDetails.igst}%</span>
              <span className="font-bold text-slate-900 text-right">₹ {formatCurrency(igstAmount)}</span>
            </div>
          </div>

          {/* Grand Total Bar */}
          <div className="bg-[#1b2631] px-4 py-2 flex items-center justify-between text-yellow-400">
            <span className="font-extrabold text-xs uppercase tracking-wider">GRAND TOTAL</span>
            <span className="font-extrabold text-base tracking-wide">
              ₹ {formatCurrency(grandTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* ── AMOUNT IN WORDS ── */}
      <div className="border border-slate-300 rounded-lg px-3.5 py-2 mb-3 bg-slate-50/70 text-xs flex items-center flex-wrap gap-1">
        <span className="font-bold text-slate-800">Amount in Words:</span>
        <span className="text-slate-900 font-medium italic">{amountInWords}</span>
      </div>

      {/* ── TERMS & CONDITIONS + SIGNATORY (STRICT 2 COLUMNS ON ALL DEVICES) ── */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        {/* Terms */}
        <div className="border border-slate-200 rounded-lg p-3 bg-white text-[10px] text-slate-600">
          <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider mb-1.5 pb-1 border-b border-slate-100">
            TERMS &amp; CONDITIONS
          </div>
          <ol className="space-y-1 list-none leading-relaxed">
            {termsAndConditions
              .split("\n")
              .filter(Boolean)
              .map((line, i) => (
                <li key={i}>{line}</li>
              ))}
          </ol>
        </div>

        {/* Signatory */}
        <div className="border border-slate-200 rounded-lg p-3 bg-white flex flex-col justify-between items-end text-right min-h-[95px]">
          <p className="font-bold text-slate-900 text-xs">For, JSS ENTERPRISE</p>
          <div className="w-full">
            <div className="w-44 border-t border-slate-400 ml-auto mb-1" />
            <p className="font-semibold text-slate-700 text-[11px]">Authorized Signatory</p>
          </div>
        </div>
      </div>
    </div>
  );
}
