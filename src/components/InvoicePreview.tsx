"use client";

import { Invoice } from "@/types/invoice";
import Image from "next/image";

interface Props {
  invoice: Invoice;
}

export default function InvoicePreview({ invoice }: Props) {
  const { invoiceInfo, buyerDetails, items, bankDetails, taxDetails,
          termsAndConditions, subTotal, cgstAmount, sgstAmount,
          igstAmount, grandTotal, amountInWords } = invoice;

  return (
    <div
      id="invoice-print-area"
      className="bg-white text-[#222] font-sans"
      style={{ fontFamily: "Arial, sans-serif", fontSize: "12px", lineHeight: 1.4 }}
    >
      {/* ── HEADER ── */}
      <div className="bg-[#1a1a2e] text-white">
        <img
          src="/header.png"
          alt="JSS Enterprise"
          style={{ width: "100%", display: "block", objectFit: "contain" }}
        />
      </div>

      {/* ── INVOICE INFO + BUYER DETAILS ── */}
      <div className="grid grid-cols-2 gap-0 border-b border-gray-200">
        {/* Invoice Info */}
        <div className="border-r border-gray-200 p-3">
          <div
            className="text-white text-xs font-bold uppercase px-2 py-1 mb-3"
            style={{ background: "#1a1a2e" }}
          >
            INVOICE INFORMATION
          </div>
          <table className="w-full text-xs">
            <tbody>
              {[
                ["Invoice No:", invoiceInfo.invoiceNo],
                ["Invoice Date:", invoiceInfo.invoiceDate],
                ["Challan No:", invoiceInfo.challanNo],
                ["P.O. Date / No:", invoiceInfo.poDateNo],
                ["Place of Supply:", invoiceInfo.placeOfSupply],
              ].map(([label, value]) => (
                <tr key={label} className="border-b border-gray-100">
                  <td className="py-1.5 pr-2 text-[#f5a623] font-medium w-1/2">{label}</td>
                  <td className="py-1.5 font-semibold text-right">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Buyer Details */}
        <div className="p-3">
          <div
            className="text-white text-xs font-bold uppercase px-2 py-1 mb-3"
            style={{ background: "#1a1a2e" }}
          >
            BILLED TO / BUYER DETAILS
          </div>
          <table className="w-full text-xs">
            <tbody>
              {[
                ["Customer Name:", buyerDetails.customerName],
                ["Address:", buyerDetails.address],
                ["City / State:", buyerDetails.cityState],
                ["GSTIN / PAN:", buyerDetails.gstinPan],
                ["Contact No:", buyerDetails.contactNo],
              ].map(([label, value]) => (
                <tr key={label} className="border-b border-gray-100">
                  <td className="py-1.5 pr-2 text-[#f5a623] font-medium w-5/12">{label}</td>
                  <td className="py-1.5 font-semibold text-right">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── ITEMS TABLE ── */}
      <div className="border-b border-gray-200">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr style={{ background: "#1a1a2e", color: "#fff" }}>
              <th className="py-2 px-2 text-center font-bold w-6">#</th>
              <th className="py-2 px-2 text-left font-bold">Item Description &amp; Specifications</th>
              <th className="py-2 px-2 text-center font-bold w-20">HSN/SAC</th>
              <th className="py-2 px-2 text-center font-bold w-10">Qty</th>
              <th className="py-2 px-2 text-center font-bold w-12">Unit</th>
              <th className="py-2 px-2 text-right font-bold w-24">Rate (₹)</th>
              <th className="py-2 px-2 text-right font-bold w-24">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr
                key={item.id}
                className="border-b border-gray-100"
                style={{ background: idx % 2 === 1 ? "#f9fafb" : "#fff" }}
              >
                <td className="py-2 px-2 text-center text-gray-500">{idx + 1}</td>
                <td className="py-2 px-2">
                  <div className="font-semibold text-gray-800">{item.description}</div>
                  {item.specifications && (
                    <div className="text-gray-500 text-[10px] mt-0.5">{item.specifications}</div>
                  )}
                </td>
                <td className="py-2 px-2 text-center text-gray-600">{item.hsnSac}</td>
                <td className="py-2 px-2 text-center">{item.qty}</td>
                <td className="py-2 px-2 text-center text-gray-600">{item.unit}</td>
                <td className="py-2 px-2 text-right">
                  {Number(item.rate).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2 px-2 text-right font-semibold">
                  {Number(item.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── BANK + TOTALS ── */}
      <div className="grid grid-cols-2 gap-0 border-b border-gray-200">
        {/* Bank Details */}
        <div className="border-r border-gray-200 p-3">
          <div
            className="text-white text-xs font-bold uppercase px-2 py-1 mb-3"
            style={{ background: "#1a1a2e" }}
          >
            BANK PAYMENT DETAILS
          </div>
          <table className="w-full text-xs">
            <tbody>
              {[
                ["Bank Name:", bankDetails.bankName],
                ["Account Holder:", bankDetails.accountHolder],
                ["Account No:", bankDetails.accountNo],
                ["IFSC Code:", bankDetails.ifscCode],
                ["Branch:", bankDetails.branch],
              ].map(([label, value]) => (
                <tr key={label} className="border-b border-gray-100">
                  <td className="py-1.5 pr-2 text-[#f5a623] font-medium w-5/12">{label}</td>
                  <td className="py-1.5 font-semibold">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="p-3">
          <table className="w-full text-xs">
            <tbody>
              {[
                ["Sub-Total (Excl. Tax)", subTotal, false],
                [`CGST @ ${taxDetails.cgst}%`, cgstAmount, false],
                [`SGST @ ${taxDetails.sgst}%`, sgstAmount, false],
                [`IGST @ ${taxDetails.igst}%`, igstAmount, false],
              ].map(([label, value]) => (
                <tr key={String(label)} className="border-b border-gray-100">
                  <td className="py-1.5 text-gray-600">{String(label)}</td>
                  <td className="py-1.5 text-right font-semibold">
                    ₹{Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Grand Total */}
          <div
            className="flex justify-between items-center px-3 py-2 mt-2"
            style={{ background: "#1a1a2e" }}
          >
            <span className="text-[#f5a623] font-bold text-sm uppercase tracking-wider">
              GRAND TOTAL
            </span>
            <span className="text-[#f5a623] font-bold text-base">
              ₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* ── AMOUNT IN WORDS ── */}
      <div className="border-b border-gray-200 px-4 py-2 bg-gray-50 text-xs">
        <span className="font-semibold text-gray-700">Amount in Words: </span>
        <span className="text-gray-800 italic">{amountInWords}</span>
      </div>

      {/* ── TERMS + SIGNATURE ── */}
      <div className="grid grid-cols-2 gap-0 mt-1">
        <div className="border-r border-gray-200 p-4">
          <div
            className="text-xs font-bold uppercase mb-2 px-1 py-0.5"
            style={{ background: "#f0f4f8", borderLeft: "3px solid #1a1a2e" }}
          >
            TERMS &amp; CONDITIONS
          </div>
          <ol className="text-[10px] text-gray-600 space-y-0.5 list-none">
            {termsAndConditions.split("\n").filter(Boolean).map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ol>
        </div>
        <div className="p-4 flex flex-col items-end justify-between">
          <div />
          <div className="text-right">
            <p className="text-gray-700 font-semibold text-sm">For, JSS ENTERPRISE</p>
            <div className="mt-8 mb-1 border-t border-gray-400 w-40 ml-auto" />
            <p className="text-gray-600 text-xs font-medium">Authorized Signatory</p>
          </div>
        </div>
      </div>
    </div>
  );
}
