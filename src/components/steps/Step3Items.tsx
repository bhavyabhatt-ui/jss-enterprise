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

const UNITS = ["Nos", "Set", "Serv", "Kg", "Ltr", "Mtr", "Pcs", "Box", "Unit", "Pair"];

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
        newItem.amount = Number(newItem.qty) * Number(newItem.rate);
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
    if (items.length === 1) return;
    onItemsChange(items.filter((item) => item.id !== id));
  }

  const inputCls =
    "w-full px-2 py-1.5 bg-slate-700/50 border border-slate-600/30 rounded text-white placeholder-slate-500 text-xs focus:outline-none focus:border-yellow-400/70 focus:ring-1 focus:ring-yellow-400/20 transition-all";

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-yellow-400">Item Description & Specifications</h2>
          <p className="text-slate-400 text-sm mt-1">Add products/services with all details</p>
        </div>
        <button
          onClick={addItem}
          className="flex items-center gap-1.5 bg-yellow-400/10 hover:bg-yellow-400/20 border border-yellow-400/30 text-yellow-400 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
        >
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto rounded-xl border border-slate-700/50">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-700/60 text-slate-300">
              <th className="px-3 py-2.5 text-left font-semibold w-6">#</th>
              <th className="px-3 py-2.5 text-left font-semibold min-w-[200px]">Description & Specifications</th>
              <th className="px-3 py-2.5 text-left font-semibold w-24">HSN/SAC</th>
              <th className="px-3 py-2.5 text-center font-semibold w-16">Qty</th>
              <th className="px-3 py-2.5 text-center font-semibold w-20">Unit</th>
              <th className="px-3 py-2.5 text-right font-semibold w-28">Rate (₹)</th>
              <th className="px-3 py-2.5 text-right font-semibold w-28">Amount (₹)</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {items.map((item, idx) => (
              <tr key={item.id} className="hover:bg-slate-700/20">
                <td className="px-3 py-2 text-slate-400 font-medium">{idx + 1}</td>
                <td className="px-3 py-2">
                  <input
                    className={inputCls + " mb-1"}
                    placeholder="Product name..."
                    value={item.description}
                    onChange={(e) => updateItem(item.id, "description", e.target.value)}
                  />
                  <input
                    className={inputCls + " text-slate-400"}
                    placeholder="Specifications / sub-description..."
                    value={item.specifications}
                    onChange={(e) => updateItem(item.id, "specifications", e.target.value)}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    className={inputCls}
                    placeholder="84581100"
                    value={item.hsnSac}
                    onChange={(e) => updateItem(item.id, "hsnSac", e.target.value)}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min={0}
                    className={inputCls + " text-center"}
                    value={item.qty}
                    onChange={(e) => updateItem(item.id, "qty", parseFloat(e.target.value) || 0)}
                  />
                </td>
                <td className="px-3 py-2">
                  <select
                    className={inputCls}
                    value={item.unit}
                    onChange={(e) => updateItem(item.id, "unit", e.target.value)}
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u} className="bg-slate-800">
                        {u}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min={0}
                    className={inputCls + " text-right"}
                    value={item.rate}
                    onChange={(e) => updateItem(item.id, "rate", parseFloat(e.target.value) || 0)}
                  />
                </td>
                <td className="px-3 py-2">
                  <div className="text-right text-green-400 font-semibold">
                    ₹{item.amount.toLocaleString("en-IN")}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                    className="text-slate-600 hover:text-red-400 disabled:opacity-30 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {items.map((item, idx) => (
          <div key={item.id} className="bg-slate-700/30 rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-yellow-400 font-bold text-sm">Item {idx + 1}</span>
              <button
                onClick={() => removeItem(item.id)}
                disabled={items.length === 1}
                className="text-slate-500 hover:text-red-400 disabled:opacity-30"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2.5">
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Description</label>
                <input
                  className={inputCls}
                  placeholder="Product name..."
                  value={item.description}
                  onChange={(e) => updateItem(item.id, "description", e.target.value)}
                />
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Specifications</label>
                <input
                  className={inputCls}
                  placeholder="Specifications..."
                  value={item.specifications}
                  onChange={(e) => updateItem(item.id, "specifications", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">HSN/SAC</label>
                  <input
                    className={inputCls}
                    placeholder="HSN Code"
                    value={item.hsnSac}
                    onChange={(e) => updateItem(item.id, "hsnSac", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Unit</label>
                  <select
                    className={inputCls}
                    value={item.unit}
                    onChange={(e) => updateItem(item.id, "unit", e.target.value)}
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u} className="bg-slate-800">
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Qty</label>
                  <input
                    type="number"
                    min={0}
                    className={inputCls}
                    value={item.qty}
                    onChange={(e) => updateItem(item.id, "qty", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Rate (₹)</label>
                  <input
                    type="number"
                    min={0}
                    className={inputCls}
                    value={item.rate}
                    onChange={(e) => updateItem(item.id, "rate", parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div className="text-right text-green-400 font-bold text-sm">
                Amount: ₹{item.amount.toLocaleString("en-IN")}
              </div>
            </div>
          </div>
        ))}
        <button
          onClick={addItem}
          className="w-full py-3 border-2 border-dashed border-yellow-400/30 text-yellow-400 rounded-xl text-sm font-medium hover:bg-yellow-400/5 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Another Item
        </button>
      </div>

      {/* Tax & Totals */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tax Rates */}
        <div className="bg-slate-700/30 rounded-xl border border-slate-700/50 p-4">
          <h3 className="text-white font-semibold text-sm mb-4">Tax Configuration</h3>
          <div className="space-y-3">
            {[
              { label: "CGST %", key: "cgst" as const, value: taxDetails.cgst },
              { label: "SGST %", key: "sgst" as const, value: taxDetails.sgst },
              { label: "IGST %", key: "igst" as const, value: taxDetails.igst },
            ].map((tax) => (
              <div key={tax.key} className="flex items-center justify-between gap-4">
                <label className="text-slate-300 text-sm">{tax.label}</label>
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
                  className="w-20 px-2 py-1.5 bg-slate-700/50 border border-slate-600/50 rounded text-white text-sm text-center focus:outline-none focus:border-yellow-400/70"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Totals Summary */}
        <div className="bg-slate-700/30 rounded-xl border border-slate-700/50 p-4">
          <h3 className="text-white font-semibold text-sm mb-4">Totals</h3>
          <div className="space-y-2 text-sm">
            {[
              { label: "Sub-Total (Excl. Tax)", value: subTotal, color: "text-slate-300" },
              { label: `CGST @ ${taxDetails.cgst}%`, value: cgstAmount, color: "text-blue-400" },
              { label: `SGST @ ${taxDetails.sgst}%`, value: sgstAmount, color: "text-blue-400" },
              { label: `IGST @ ${taxDetails.igst}%`, value: igstAmount, color: "text-blue-400" },
            ].map((row, i) => (
              <div key={i} className="flex justify-between items-center py-1 border-b border-slate-700/30">
                <span className="text-slate-400">{row.label}</span>
                <span className={row.color}>₹{row.value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            ))}
            <div className="flex justify-between items-center py-2 bg-yellow-400/10 rounded-lg px-3 mt-2">
              <span className="text-yellow-400 font-bold">GRAND TOTAL</span>
              <span className="text-yellow-400 font-bold text-lg">
                ₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

