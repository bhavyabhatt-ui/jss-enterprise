"use client";

import { InvoiceItem, TaxDetails } from "@/types/invoice";
import { Plus, Trash2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

interface Props {
  items: InvoiceItem[];
  taxDetails: TaxDetails;
  subTotal: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  grandTotal: number;
  onItemsChange: (items: InvoiceItem[]) => void;
  onTaxChange: (cgst: number, sgst: number, igst: number) => void;
}

const UNITS = ["Nos", "Set", "Serv", "Kg", "Ltr", "Mtr", "Pcs", "Box", "Unit", "Pair", "Hours"];

export default function Step3Items({
  items,
  taxDetails,
  subTotal,
  cgstAmount,
  sgstAmount,
  igstAmount,
  grandTotal,
  onItemsChange,
  onTaxChange,
}: Props) {
  function updateItem(id: string, key: keyof InvoiceItem, value: string | number) {
    const updated = items.map((item) => {
      if (item.id !== id) return item;
      const newItem = { ...item, [key]: value };
      if (key === "qty" || key === "rate") {
        newItem.amount = (Number(newItem.qty) || 0) * (Number(newItem.rate) || 0);
      }
      return newItem;
    });
    onItemsChange(updated);
  }

  function addItem() {
    onItemsChange([
      ...items,
      {
        id: uuidv4(),
        description: "",
        specifications: "",
        hsnSac: "",
        qty: 1,
        unit: "Nos",
        rate: 0,
        amount: 0,
      },
    ]);
  }

  function removeItem(id: string) {
    if (items.length <= 1) return;
    onItemsChange(items.filter((item) => item.id !== id));
  }

  const inputClass =
    "w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all shadow-2xs";

  return (
    <div className="p-4 sm:p-6">
      {/* Title & Action */}
      <div className="mb-5 pb-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Step 3: Item Description &amp; Specifications</h3>
          <p className="text-slate-500 text-xs mt-0.5">Add products/services with HSN codes, quantity, rate, and tax calculation</p>
        </div>
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5" /> Add Product
        </button>
      </div>

      {/* Desktop Items Table */}
      <div className="hidden lg:block overflow-x-auto rounded-lg border border-slate-200 shadow-2xs mb-6">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
              <th className="px-3 py-2.5 text-center w-8">#</th>
              <th className="px-3 py-2.5 text-left min-w-[220px]">Product / Service Description &amp; Specifications</th>
              <th className="px-3 py-2.5 text-center w-28">HSN/SAC</th>
              <th className="px-3 py-2.5 text-center w-20">Qty</th>
              <th className="px-3 py-2.5 text-center w-24">Unit</th>
              <th className="px-3 py-2.5 text-right w-32">Rate (₹)</th>
              <th className="px-3 py-2.5 text-right w-32">Amount (₹)</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, idx) => (
              <tr key={item.id} className="hover:bg-slate-50/60">
                <td className="px-3 py-2.5 text-center text-slate-400 font-medium">{idx + 1}</td>
                <td className="px-3 py-2.5">
                  <input
                    className={`${inputClass} font-semibold mb-1`}
                    placeholder="Product name (e.g. Heavy Duty CNC Router Machine)"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, "description", e.target.value)}
                  />
                  <input
                    className={`${inputClass} text-slate-500`}
                    placeholder="Specifications (e.g. 3.5kW Air Cooled Spindle with Vacuum Bed Setup)"
                    value={item.specifications}
                    onChange={(e) => updateItem(item.id, "specifications", e.target.value)}
                  />
                </td>
                <td className="px-3 py-2.5 text-center">
                  <input
                    className={`${inputClass} text-center font-mono`}
                    placeholder="84581100"
                    value={item.hsnSac}
                    onChange={(e) => updateItem(item.id, "hsnSac", e.target.value)}
                  />
                </td>
                <td className="px-3 py-2.5 text-center">
                  <input
                    type="number"
                    min={0}
                    className={`${inputClass} text-center`}
                    value={item.qty}
                    onChange={(e) => updateItem(item.id, "qty", parseFloat(e.target.value) || 0)}
                  />
                </td>
                <td className="px-3 py-2.5 text-center">
                  <select
                    className={inputClass}
                    value={item.unit}
                    onChange={(e) => updateItem(item.id, "unit", e.target.value)}
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <input
                    type="number"
                    min={0}
                    step="any"
                    className={`${inputClass} text-right font-medium`}
                    value={item.rate}
                    onChange={(e) => updateItem(item.id, "rate", parseFloat(e.target.value) || 0)}
                  />
                </td>
                <td className="px-3 py-2.5 text-right">
                  <span className="font-bold text-slate-900 text-xs">
                    ₹ {Number(item.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length <= 1}
                    className="text-slate-400 hover:text-rose-600 disabled:opacity-20 transition-colors p-1"
                    title="Remove Item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Items Cards */}
      <div className="lg:hidden space-y-3 mb-6">
        {items.map((item, idx) => (
          <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-amber-700 font-bold text-xs uppercase tracking-wider">Item #{idx + 1}</span>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                disabled={items.length <= 1}
                className="text-slate-400 hover:text-rose-600 disabled:opacity-30 p-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Description</label>
              <input
                className={inputClass}
                placeholder="Product name..."
                value={item.description}
                onChange={(e) => updateItem(item.id, "description", e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Specifications</label>
              <input
                className={inputClass}
                placeholder="Sub-specs / details..."
                value={item.specifications}
                onChange={(e) => updateItem(item.id, "specifications", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 mb-1 block">HSN/SAC</label>
                <input
                  className={inputClass}
                  placeholder="HSN"
                  value={item.hsnSac}
                  onChange={(e) => updateItem(item.id, "hsnSac", e.target.value)}
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Unit</label>
                <select
                  className={inputClass}
                  value={item.unit}
                  onChange={(e) => updateItem(item.id, "unit", e.target.value)}
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Qty</label>
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={item.qty}
                  onChange={(e) => updateItem(item.id, "qty", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Rate (₹)</label>
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={item.rate}
                  onChange={(e) => updateItem(item.id, "rate", parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="pt-1 text-right text-xs font-bold text-slate-900 border-t border-slate-200">
              Item Total: ₹ {Number(item.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addItem}
          className="w-full py-2.5 border border-dashed border-amber-300 text-amber-700 bg-amber-50/50 rounded-lg text-xs font-semibold hover:bg-amber-50 transition-colors flex items-center justify-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Add Another Product
        </button>
      </div>

      {/* Taxes & Calculation Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tax Percentage Config */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <h4 className="text-slate-800 font-bold text-xs uppercase tracking-wider mb-3">GST Tax Rates (%)</h4>
          <div className="space-y-2.5">
            {[
              { label: "CGST Rate %", key: "cgst" as const, value: taxDetails.cgst },
              { label: "SGST Rate %", key: "sgst" as const, value: taxDetails.sgst },
              { label: "IGST Rate %", key: "igst" as const, value: taxDetails.igst },
            ].map((tax) => (
              <div key={tax.key} className="flex items-center justify-between gap-4">
                <label className="text-slate-700 text-xs font-medium">{tax.label}</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={tax.value}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      onTaxChange(
                        tax.key === "cgst" ? val : taxDetails.cgst,
                        tax.key === "sgst" ? val : taxDetails.sgst,
                        tax.key === "igst" ? val : taxDetails.igst
                      );
                    }}
                    className="w-20 px-2 py-1 bg-white border border-slate-300 rounded text-slate-900 text-xs text-center font-semibold focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-slate-500 text-xs">%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Calculated Totals Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
          <h4 className="text-slate-800 font-bold text-xs uppercase tracking-wider mb-2">Calculated Totals</h4>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="text-slate-600">Sub-Total (Excl. Tax):</span>
              <span className="font-semibold text-slate-800">
                ₹ {subTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="text-slate-600">CGST @ {taxDetails.cgst}%:</span>
              <span className="font-semibold text-slate-800">
                ₹ {cgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="text-slate-600">SGST @ {taxDetails.sgst}%:</span>
              <span className="font-semibold text-slate-800">
                ₹ {sgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="text-slate-600">IGST @ {taxDetails.igst}%:</span>
              <span className="font-semibold text-slate-800">
                ₹ {igstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between items-center pt-2 mt-1">
              <span className="font-extrabold text-slate-900 text-sm">GRAND TOTAL:</span>
              <span className="font-extrabold text-amber-600 text-base">
                ₹ {grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
