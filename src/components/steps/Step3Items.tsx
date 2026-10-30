"use client";

import { useState, useEffect, useCallback } from "react";
import { InvoiceItem, TaxDetails } from "@/types/invoice";
import { Plus, Trash2, Sparkles, Package, Search, Check, X, ArrowRight } from "lucide-react";
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
  const [itemRecommendations, setItemRecommendations] = useState<ItemTemplate[]>([]);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [targetRowIdForModal, setTargetRowIdForModal] = useState<string | null>(null);
  const [catalogSearch, setCatalogSearch] = useState("");

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

    // Merge catalog items first, then historical
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

  function applyRecommendation(id: string, rec: ItemTemplate) {
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
  }

  function addCatalogItemAsNewRow(rec: ItemTemplate) {
    const newItem: InvoiceItem = {
      id: uuidv4(),
      description: rec.description,
      specifications: rec.specifications || "",
      hsnSac: rec.hsnSac || "",
      qty: 1,
      unit: rec.unit || "Nos",
      rate: rec.rate || 0,
      amount: 1 * (rec.rate || 0),
    };
    onItemsChange([...items, newItem]);
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

  const filteredCatalogForModal = itemRecommendations.filter((item) => {
    if (!catalogSearch) return true;
    const q = catalogSearch.toLowerCase();
    return (
      item.description.toLowerCase().includes(q) ||
      (item.code && item.code.toLowerCase().includes(q)) ||
      item.specifications.toLowerCase().includes(q) ||
      item.hsnSac.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 sm:p-6">
      {/* Title & Action */}
      <div className="mb-5 pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">Step 3: Item Description &amp; Specifications</h3>
          <p className="text-slate-500 text-xs mt-0.5">
            Add products or pick directly from your Master Product Catalog with automatic rates &amp; HSN
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {itemRecommendations.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setTargetRowIdForModal(items[0]?.id || null);
                setShowCatalogModal(true);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-lg transition-all shadow-2xs active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              <span>Browse Catalog ({itemRecommendations.length} items)</span>
            </button>
          )}
          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-1.5 bg-amber-500 text-white hover:bg-amber-600 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" /> Add Product Row
          </button>
        </div>
      </div>

      {/* Desktop Items Table */}
      <div className="hidden lg:block overflow-x-auto rounded-lg border border-slate-200 shadow-2xs mb-6">
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
              const matchingRecs = itemRecommendations.filter((r) => {
                if (!q) return false;
                return (
                  r.description.toLowerCase().includes(q) ||
                  (r.code && r.code.toLowerCase().includes(q)) ||
                  r.specifications.toLowerCase().includes(q)
                );
              });

              return (
                <tr key={item.id} className="hover:bg-slate-50/50 align-top">
                  <td className="px-3 py-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                  <td className="px-3 py-2.5">
                    {/* Quick Catalog Selector for this row */}
                    {itemRecommendations.length > 0 && (
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <select
                          value=""
                          onChange={(e) => {
                            const val = e.target.value;
                            const sel = itemRecommendations.find(
                              (r) => (r.code && r.code === val) || r.description === val
                            );
                            if (sel) applyRecommendation(item.id, sel);
                          }}
                          className="w-full text-[11px] bg-amber-50/70 hover:bg-amber-100/70 border border-amber-300 text-amber-900 rounded px-2 py-1 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors cursor-pointer"
                        >
                          <option value="">⚡ Quick fill row from Catalog...</option>
                          {itemRecommendations.map((rec, i) => (
                            <option key={i} value={rec.code || rec.description}>
                              {rec.code ? `[${rec.code}] ` : ""}{rec.description} (₹{rec.rate} • {rec.unit})
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            setTargetRowIdForModal(item.id);
                            setShowCatalogModal(true);
                          }}
                          title="Open product catalog browser"
                          className="text-[10px] bg-slate-100 hover:bg-amber-100 border border-slate-200 hover:border-amber-300 text-slate-700 hover:text-amber-900 px-2 py-1 rounded font-medium shrink-0 flex items-center gap-1 transition-colors"
                        >
                          <Package className="w-3 h-3 text-amber-600" />
                          <span>Browse</span>
                        </button>
                      </div>
                    )}

                    {/* Description Input */}
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, "description", e.target.value)}
                      placeholder="Product / service name or item code"
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

                    {/* Inline Auto-fill Recommendations (Immune to Table Overflow Clipping) */}
                    {matchingRecs.length > 0 && (
                      <div className="mt-2 p-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg shadow-2xs">
                        <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wide flex items-center gap-1 mb-1.5">
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          <span>Found in Catalog (Click to Auto-fill all fields):</span>
                        </div>
                        <div className="space-y-1">
                          {matchingRecs.slice(0, 4).map((rec, rIdx) => (
                            <button
                              key={rIdx}
                              type="button"
                              onClick={() => applyRecommendation(item.id, rec)}
                              className="w-full text-left p-1.5 bg-white hover:bg-amber-100/80 border border-amber-300 rounded text-slate-800 transition-all flex items-center justify-between gap-2 group shadow-2xs cursor-pointer"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1">
                                  {rec.code && (
                                    <span className="font-mono text-amber-700 font-bold text-[10px] bg-amber-100 px-1 rounded">
                                      {rec.code}
                                    </span>
                                  )}
                                  <span className="font-bold text-xs text-slate-900 truncate">
                                    {rec.description}
                                  </span>
                                  {rec.specifications && (
                                    <span className="text-[10px] text-slate-500 truncate">
                                      ({rec.specifications})
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                  HSN: {rec.hsnSac || "-"} • Unit: {rec.unit} • ₹{Number(rec.rate).toLocaleString("en-IN")}
                                </div>
                              </div>
                              <span className="shrink-0 bg-amber-500 group-hover:bg-amber-600 text-white font-bold text-[10px] px-2 py-1 rounded flex items-center gap-1">
                                <span>Apply</span>
                                <ArrowRight className="w-2.5 h-2.5" />
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <input
                      type="text"
                      value={item.hsnSac}
                      onChange={(e) => updateItem(item.id, "hsnSac", e.target.value)}
                      placeholder="HSN/SAC"
                      className={`${inputClass} text-center font-mono`}
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <input
                      type="number"
                      min={1}
                      value={item.qty}
                      onChange={(e) => updateItem(item.id, "qty", parseFloat(e.target.value) || 0)}
                      className={`${inputClass} text-center font-medium`}
                    />
                  </td>
                  <td className="px-3 py-2.5">
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
                  <td className="px-3 py-2.5">
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
                  <td className="px-3 py-2.5 text-right font-bold text-slate-900 pt-3">
                    ₹{item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-2 py-2.5 text-center">
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
          const matchingRecs = itemRecommendations.filter((r) => {
            if (!q) return false;
            return (
              r.description.toLowerCase().includes(q) ||
              (r.code && r.code.toLowerCase().includes(q)) ||
              r.specifications.toLowerCase().includes(q)
            );
          });

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

              {/* Mobile Quick Catalog Selector */}
              {itemRecommendations.length > 0 && (
                <div>
                  <label className="block text-[11px] font-semibold text-amber-800 mb-1">
                    ⚡ Auto-fill from Product Catalog
                  </label>
                  <select
                    value=""
                    onChange={(e) => {
                      const val = e.target.value;
                      const sel = itemRecommendations.find(
                        (r) => (r.code && r.code === val) || r.description === val
                      );
                      if (sel) applyRecommendation(item.id, sel);
                    }}
                    className="w-full text-xs bg-amber-50/80 border border-amber-300 text-amber-900 rounded-lg p-2 font-medium"
                  >
                    <option value="">Choose a product template...</option>
                    {itemRecommendations.map((rec, i) => (
                      <option key={i} value={rec.code || rec.description}>
                        {rec.code ? `[${rec.code}] ` : ""}{rec.description} (₹{rec.rate})
                      </option>
                    ))}
                  </select>
                </div>
              )}

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

              {/* Inline Suggestions on Mobile */}
              {matchingRecs.length > 0 && (
                <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg space-y-1.5">
                  <span className="text-[10px] font-bold text-amber-800 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    Matching Catalog Products:
                  </span>
                  {matchingRecs.slice(0, 3).map((rec, rIdx) => (
                    <button
                      key={rIdx}
                      type="button"
                      onClick={() => applyRecommendation(item.id, rec)}
                      className="w-full text-left p-1.5 bg-white border border-amber-300 rounded text-xs flex justify-between items-center"
                    >
                      <div>
                        <span className="font-bold text-slate-900">{rec.description}</span>
                        {rec.specifications && (
                          <span className="text-[10px] text-slate-500 ml-1">({rec.specifications})</span>
                        )}
                        <div className="text-[10px] text-slate-500">₹{rec.rate} • HSN: {rec.hsnSac || "-"}</div>
                      </div>
                      <span className="text-[10px] bg-amber-500 text-white font-bold px-2 py-0.5 rounded">
                        Fill
                      </span>
                    </button>
                  ))}
                </div>
              )}

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

      {/* ── FULL PRODUCT CATALOG MODAL ── */}
      {showCatalogModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Master Product Catalog &amp; Templates
                  </h3>
                  <p className="text-slate-500 text-xs">
                    Select a product to instantly prefill into the bill
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCatalogModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className="p-4 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Search products by code, name, size, or HSN..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Modal Products List */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5 flex-1 divide-y divide-slate-100">
              {filteredCatalogForModal.length === 0 ? (
                <div className="text-center py-10">
                  <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600">No matching products found</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Add products in Settings &gt; Product Catalog to use them anytime!
                  </p>
                </div>
              ) : (
                filteredCatalogForModal.map((product, idx) => (
                  <div
                    key={idx}
                    className="pt-2.5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl hover:bg-amber-50/40 border border-transparent hover:border-amber-200 transition-all"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {product.code && (
                          <span className="font-mono text-amber-700 font-bold text-xs bg-amber-100 px-2 py-0.5 rounded">
                            {product.code}
                          </span>
                        )}
                        <span className="font-bold text-sm text-slate-900">
                          {product.description}
                        </span>
                      </div>
                      {product.specifications && (
                        <p className="text-xs text-slate-600 mt-0.5 font-medium">
                          {product.specifications}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-x-3 text-[11px] text-slate-400 mt-1">
                        <span>HSN/SAC: <strong className="text-slate-600">{product.hsnSac || "-"}</strong></span>
                        <span>Unit: <strong className="text-slate-600">{product.unit}</strong></span>
                        <span>Default Rate: <strong className="text-amber-700">₹{Number(product.rate).toLocaleString("en-IN")}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      {targetRowIdForModal && (
                        <button
                          type="button"
                          onClick={() => {
                            applyRecommendation(targetRowIdForModal, product);
                            setShowCatalogModal(false);
                          }}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-2xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Use for Current Row</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          addCatalogItemAsNewRow(product);
                          setShowCatalogModal(false);
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add as New Row</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500 px-5">
              <span>Showing {filteredCatalogForModal.length} product(s)</span>
              <button
                type="button"
                onClick={() => setShowCatalogModal(false)}
                className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
