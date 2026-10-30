"use client";

import { useState, useEffect } from "react";
import { InvoiceItem, TaxDetails } from "@/types/invoice";
import { Plus, Trash2, Sparkles } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { getAllInvoices, getInvoiceRecommendations } from "@/lib/storage";

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
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [itemRecommendations, setItemRecommendations] = useState<
    Array<{
      description: string;
      specifications: string;
      hsnSac: string;
      unit: string;
      rate: number;
    }>
  >([]);

  useEffect(() => {
    const historical = getAllInvoices();
    const { items: recItems } = getInvoiceRecommendations(historical);
    setItemRecommendations(recItems);
  }, []);

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

  function applyRecommendation(
    id: string,
    rec: {
      description: string;
      specifications: string;
      hsnSac: string;
      unit: string;
      rate: number;
    }
  ) {
    const updated = items.map((item) => {
      if (item.id !== id) return item;
      const qty = item.qty || 1;
      return {
        ...item,
        description: rec.description,
        specifications: rec.specifications || item.specifications,
        hsnSac: rec.hsnSac || item.hsnSac,
        unit: rec.unit || item.unit,
        rate: rec.rate || item.rate,
        amount: qty * (rec.rate || item.rate),
      };
    });
    onItemsChange(updated);
    setActiveItemId(null);
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
      <div className="mb-5 pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-900">Step 3: Item Description &amp; Specifications</h3>
          <p className="text-slate-500 text-xs mt-0.5">Add products/services with HSN codes, quantity, rate, and tax calculation</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {itemRecommendations.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>{itemRecommendations.length} item template(s)</span>
            </span>
          )}
          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" /> Add Product
          </button>
        </div>
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
            {items.map((item, idx) => {
              const matchingRecs = itemRecommendations.filter((r) =>
                r.description.toLowerCase().includes((item.description || "").toLowerCase())
              );

              return (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="px-3 py-2 text-center text-slate-400 font-medium">{idx + 1}</td>
                  <td className="px-3 py-2 relative">
                    <input
                      type="text"
                      value={item.description}
                      onFocus={() => setActiveItemId(item.id)}
                      onChange={(e) => {
                        updateItem(item.id, "description", e.target.value);
                        setActiveItemId(item.id);
                      }}
                      placeholder="Item name / description"
                      className={`${inputClass} mb-1 font-medium`}
                    />
                    <input
                      type="text"
                      value={item.specifications}
                      onChange={(e) => updateItem(item.id, "specifications", e.target.value)}
                      placeholder="Specifications / details (optional)"
                      className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-slate-600 placeholder-slate-400 text-[11px] focus:outline-none focus:border-amber-500"
                    />

                    {/* Autocomplete Popup */}
                    {activeItemId === item.id && matchingRecs.length > 0 && (
                      <div className="absolute left-3 right-3 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-100">
                        <div className="p-2 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                          <span>Suggestions from previous bills</span>
                          <button
                            type="button"
                            onClick={() => setActiveItemId(null)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            ✕
                          </button>
                        </div>
                        {matchingRecs.map((rec, rIdx) => (
                          <button
                            key={rIdx}
                            type="button"
                            onClick={() => applyRecommendation(item.id, rec)}
                            className="w-full text-left p-2.5 hover:bg-amber-50/70 transition-colors flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-xs text-slate-900 truncate">{rec.description}</p>
                              <p className="text-[10px] text-slate-400 truncate">
                                HSN: {rec.hsnSac || "-"} • {rec.unit} • ₹{Number(rec.rate).toLocaleString("en-IN")}
                              </p>
                            </div>
                            <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-semibold shrink-0">
                              Use Template
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={item.hsnSac}
                      onChange={(e) => updateItem(item.id, "hsnSac", e.target.value)}
                      placeholder="HSN/SAC"
                      className={`${inputClass} text-center font-mono`}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={1}
                      value={item.qty}
                      onChange={(e) => updateItem(item.id, "qty", parseFloat(e.target.value) || 0)}
                      className={`${inputClass} text-center`}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={item.unit}
                      onChange={(e) => updateItem(item.id, "unit", e.target.value)}
                      className={inputClass}
                    >
                      {UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={item.rate || ""}
                      onChange={(e) => updateItem(item.id, "rate", parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className={`${inputClass} text-right font-medium`}
                    />
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-slate-900">
                    ₹{item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-2 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      disabled={items.length <= 1}
                      className="text-slate-400 hover:text-rose-600 disabled:opacity-20 transition-colors p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Items Cards */}
      <div className="lg:hidden space-y-4 mb-6">
        {items.map((item, idx) => (
          <div key={item.id} className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="font-bold text-xs text-slate-700">Item #{idx + 1}</span>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                disabled={items.length <= 1}
                className="text-slate-400 hover:text-rose-600 disabled:opacity-20 transition-colors p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Description</label>
              <input
                type="text"
                value={item.description}
                onChange={(e) => updateItem(item.id, "description", e.target.value)}
                placeholder="Product / service name"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Specifications</label>
              <input
                type="text"
                value={item.specifications}
                onChange={(e) => updateItem(item.id, "specifications", e.target.value)}
                placeholder="Model, size, details"
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">HSN/SAC</label>
                <input
                  type="text"
                  value={item.hsnSac}
                  onChange={(e) => updateItem(item.id, "hsnSac", e.target.value)}
                  placeholder="84581100"
                  className={`${inputClass} font-mono`}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Unit</label>
                <select
                  value={item.unit}
                  onChange={(e) => updateItem(item.id, "unit", e.target.value)}
                  className={inputClass}
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Qty</label>
                <input
                  type="number"
                  min={1}
                  value={item.qty}
                  onChange={(e) => updateItem(item.id, "qty", parseFloat(e.target.value) || 0)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Rate (₹)</label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={item.rate || ""}
                  onChange={(e) => updateItem(item.id, "rate", parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className={inputClass}
                />
              </div>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Item Amount:</span>
              <span className="font-bold text-slate-900 text-sm">
                ₹{item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Tax Configuration & Total Summary */}
      <div className="bg-slate-50/80 rounded-xl p-4 sm:p-5 border border-slate-200 flex flex-col md:flex-row justify-between gap-6">
        {/* Tax Config */}
        <div className="space-y-3 max-w-sm">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">GST Tax Settings</h4>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">CGST (%)</label>
              <input
                type="number"
                min={0}
                max={28}
                step={0.5}
                value={taxDetails.cgst}
                onChange={(e) =>
                  onTaxChange(parseFloat(e.target.value) || 0, taxDetails.sgst, taxDetails.igst)
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">SGST (%)</label>
              <input
                type="number"
                min={0}
                max={28}
                step={0.5}
                value={taxDetails.sgst}
                onChange={(e) =>
                  onTaxChange(taxDetails.cgst, parseFloat(e.target.value) || 0, taxDetails.igst)
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">IGST (%)</label>
              <input
                type="number"
                min={0}
                max={28}
                step={0.5}
                value={taxDetails.igst}
                onChange={(e) =>
                  onTaxChange(taxDetails.cgst, taxDetails.sgst, parseFloat(e.target.value) || 0)
                }
                className={inputClass}
              />
            </div>
          </div>
          <p className="text-[10px] text-slate-400">
            For intra-state (Gujarat), use 9% CGST + 9% SGST. For inter-state, use 18% IGST.
          </p>
        </div>

        {/* Totals Summary */}
        <div className="w-full md:w-64 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Sub-Total (Taxable):</span>
            <span className="font-semibold">₹{subTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>
          {taxDetails.cgst > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>CGST ({taxDetails.cgst}%):</span>
              <span className="font-semibold">₹{cgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          {taxDetails.sgst > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>SGST ({taxDetails.sgst}%):</span>
              <span className="font-semibold">₹{sgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          {taxDetails.igst > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>IGST ({taxDetails.igst}%):</span>
              <span className="font-semibold">₹{igstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-slate-300 font-bold text-slate-900 text-sm">
            <span>Grand Total:</span>
            <span className="text-amber-600">₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
