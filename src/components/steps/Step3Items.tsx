"use client";

import { useState, useEffect, useCallback } from "react";
import { InvoiceItem, TaxDetails } from "@/types/invoice";
import { Plus, Trash2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { getAllInvoices, getInvoiceRecommendations } from "@/lib/storage";
import { getStoredSettings, fetchSettings } from "@/lib/settings-storage";

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

export type ItemTemplate = {
  code?: string;
  description: string;
  specifications: string;
  hsnSac: string;
  unit: string;
  rate: number;
};

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
  const [itemRecommendations, setItemRecommendations] = useState<ItemTemplate[]>([]);

  const loadTemplates = useCallback(() => {
    const historical = getAllInvoices();
    const { items: recItems } = getInvoiceRecommendations(historical);

    const s = getStoredSettings();
    const catalogItems: ItemTemplate[] = (s.productCatalog || []).map((p) => ({
      code: p.code,
      description: p.description,
      specifications: p.specifications,
      hsnSac: p.hsnSac,
      unit: p.unit,
      rate: p.rate,
    }));

    // Catalog items first, then historical
    const combined: ItemTemplate[] = [...catalogItems];
    recItems.forEach((rec) => {
      if (!combined.some((c) => c.description.toLowerCase() === rec.description.toLowerCase())) {
        combined.push({ ...rec, code: "" });
      }
    });

    setItemRecommendations(combined);

    fetchSettings().then((cloudSettings) => {
      if (cloudSettings.productCatalog && cloudSettings.productCatalog.length > 0) {
        const cloudItems: ItemTemplate[] = cloudSettings.productCatalog.map((p) => ({
          code: p.code,
          description: p.description,
          specifications: p.specifications,
          hsnSac: p.hsnSac,
          unit: p.unit,
          rate: p.rate,
        }));
        const reMerged: ItemTemplate[] = [...cloudItems];
        combined.forEach((item) => {
          if (!reMerged.some((m) => m.description.toLowerCase() === item.description.toLowerCase())) {
            reMerged.push(item);
          }
        });
        setItemRecommendations(reMerged);
      }
    });
  }, []);

  useEffect(() => {
    loadTemplates();

    const handleSettingsUpdate = () => {
      loadTemplates();
    };

    window.addEventListener("settingsUpdated", handleSettingsUpdate);
    window.addEventListener("storage", handleSettingsUpdate);
    window.addEventListener("focus", handleSettingsUpdate);

    return () => {
      window.removeEventListener("settingsUpdated", handleSettingsUpdate);
      window.removeEventListener("storage", handleSettingsUpdate);
      window.removeEventListener("focus", handleSettingsUpdate);
    };
  }, [loadTemplates]);

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

  function selectProduct(id: string, rec: ItemTemplate) {
    const updated = items.map((item) => {
      if (item.id !== id) return item;
      const qty = item.qty || 1;
      return {
        ...item,
        description: rec.description,
        specifications: rec.specifications || "",
        hsnSac: rec.hsnSac || "",
        unit: rec.unit || item.unit || "Nos",
        rate: rec.rate || 0,
        amount: qty * (rec.rate || 0),
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
      <div className="mb-5 pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">Step 3: Item Description &amp; Specifications</h3>
          <p className="text-slate-500 text-xs mt-0.5">
            Type any product name to see suggestions from your catalog. New products are automatically saved to your catalog.
          </p>
        </div>
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1.5 bg-amber-500 text-white hover:bg-amber-600 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-2xs self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" /> Add Product
        </button>
      </div>

      {/* Desktop Items Table */}
      <div className="hidden lg:block rounded-lg border border-slate-200 shadow-2xs mb-6 overflow-visible">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
              <th className="px-3 py-2.5 text-center w-8">#</th>
              <th className="px-3 py-2.5 text-left min-w-[280px]">Product / Service Description &amp; Specifications</th>
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
              const q = (item.description || "").trim().toLowerCase();
              const matches = q
                ? itemRecommendations.filter(
                    (r) =>
                      r.description.toLowerCase().includes(q) ||
                      (r.code && r.code.toLowerCase().includes(q))
                  )
                : [];

              return (
                <tr key={item.id} className="hover:bg-slate-50/50 align-top">
                  <td className="px-3 py-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                  <td className="px-3 py-2 relative">
                    {/* Description Input */}
                    <input
                      type="text"
                      value={item.description}
                      onFocus={() => setActiveItemId(item.id)}
                      onBlur={() => setTimeout(() => setActiveItemId((curr) => (curr === item.id ? null : curr)), 200)}
                      onChange={(e) => {
                        updateItem(item.id, "description", e.target.value);
                        setActiveItemId(item.id);
                      }}
                      placeholder="Type product name (e.g. JEANS, T SHIRT)..."
                      className={`${inputClass} mb-1 font-semibold text-slate-900`}
                    />

                    {/* Specifications Input */}
                    <input
                      type="text"
                      value={item.specifications}
                      onChange={(e) => updateItem(item.id, "specifications", e.target.value)}
                      placeholder="Specifications / size / model (optional)"
                      className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-slate-600 placeholder-slate-400 text-[11px] focus:outline-none focus:border-amber-500"
                    />

                    {/* Clean Floating Suggestions Dropdown */}
                    {activeItemId === item.id && matches.length > 0 && (
                      <div className="absolute left-3 right-3 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100">
                        {matches.slice(0, 6).map((rec, rIdx) => (
                          <div
                            key={rIdx}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              selectProduct(item.id, rec);
                            }}
                            className="p-2.5 hover:bg-amber-50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="font-bold text-slate-900 truncate">
                                {rec.code && (
                                  <span className="text-amber-600 font-mono text-[11px] mr-1.5 font-bold">
                                    [{rec.code}]
                                  </span>
                                )}
                                {rec.description}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                                {rec.specifications ? `${rec.specifications} • ` : ""}HSN: {rec.hsnSac || "-"} • {rec.unit} • ₹{Number(rec.rate).toLocaleString("en-IN")}
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded shrink-0">
                              Select
                            </span>
                          </div>
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
                      className={`${inputClass} text-center font-medium`}
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
                  <td className="px-3 py-2 text-right font-bold text-slate-900 pt-3">
                    ₹{item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-2 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      disabled={items.length <= 1}
                      className="text-slate-400 hover:text-rose-600 disabled:opacity-20 transition-colors p-1"
                      title="Delete line item"
                    >
                      <Trash2 className="w-4 h-4" />
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
        {items.map((item, idx) => {
          const q = (item.description || "").trim().toLowerCase();
          const matches = q
            ? itemRecommendations.filter(
                (r) =>
                  r.description.toLowerCase().includes(q) ||
                  (r.code && r.code.toLowerCase().includes(q))
              )
            : [];

          return (
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

              <div className="relative">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Product Description</label>
                <input
                  type="text"
                  value={item.description}
                  onFocus={() => setActiveItemId(item.id)}
                  onBlur={() => setTimeout(() => setActiveItemId((curr) => (curr === item.id ? null : curr)), 200)}
                  onChange={(e) => {
                    updateItem(item.id, "description", e.target.value);
                    setActiveItemId(item.id);
                  }}
                  placeholder="Type product name..."
                  className={inputClass}
                />

                {/* Mobile Suggestions Dropdown */}
                {activeItemId === item.id && matches.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-100">
                    {matches.slice(0, 5).map((rec, rIdx) => (
                      <div
                        key={rIdx}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          selectProduct(item.id, rec);
                        }}
                        className="p-2.5 hover:bg-amber-50 cursor-pointer flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{rec.description}</div>
                          <div className="text-[10px] text-slate-500">
                            {rec.specifications ? `${rec.specifications} • ` : ""}₹{rec.rate} • HSN: {rec.hsnSac || "-"}
                          </div>
                        </div>
                        <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded">
                          Select
                        </span>
                      </div>
                    ))}
                  </div>
                )}
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
          );
        })}
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
