"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getAllInvoices, fetchInvoices, deleteInvoice, logoutAdmin } from "@/lib/storage";
import { Invoice } from "@/types/invoice";
import { shareInvoiceToWhatsApp } from "@/lib/export";
import {
  Plus,
  Trash2,
  Edit,
  Eye,
  Search,
  TrendingUp,
  IndianRupee,
  FileStack,
  Calendar,
  Share2,
  FileText,
  RefreshCw,
  LogOut,
  Cloud,
  HardDrive,
  ShieldCheck,
} from "lucide-react";

export default function DashboardPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [storageInfo, setStorageInfo] = useState<{ isCloud: boolean; name: string } | null>(null);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  const loadData = useCallback(async (manual = false) => {
    setIsSyncing(true);
    try {
      const serverData = await fetchInvoices();
      if (serverData && serverData.length > 0) {
        setInvoices(serverData);
      }
      if (manual) {
        setSyncToast("Synced with Cloud Database!");
        setTimeout(() => setSyncToast(null), 3000);
      }
    } catch {
      if (manual) {
        setSyncToast("Sync completed (offline data safe)");
        setTimeout(() => setSyncToast(null), 3000);
      }
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    // 1. Initial fast render from local cache
    setInvoices(getAllInvoices());
    // 2. Fetch from server
    loadData();

    // 3. Check active storage engine
    fetch("/api/storage/status")
      .then((res) => (res.ok ? res.json() : null))
      .then((info) => {
        if (info) setStorageInfo(info);
      })
      .catch(() => {});

    // 4. Auto re-sync when tab gains focus
    const handleFocus = () => loadData();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [loadData]);

  const filtered = invoices.filter(
    (inv) =>
      inv.invoiceInfo.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
      inv.buyerDetails.customerName.toLowerCase().includes(search.toLowerCase()) ||
      inv.buyerDetails.contactNo.includes(search)
  );

  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const thisMonth = invoices.filter((inv) => {
    const d = new Date(inv.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  async function handleDelete(id: string, invoiceNo: string) {
    if (confirm(`Are you sure you want to delete invoice ${invoiceNo || id}?`)) {
      setDeletingId(id);
      await deleteInvoice(id);
      const updated = await fetchInvoices();
      setInvoices(updated);
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* ── TOP NAVIGATION ── */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-50 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2">
            {/* Brand Logo & Name */}
            <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg overflow-hidden border border-slate-200 bg-white p-0.5 shadow-xs group-hover:border-amber-400 transition-colors shrink-0">
                <img
                  src="/logo.png"
                  alt="JSS Enterprise Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="shrink-0">
                <h1 className="font-extrabold text-slate-900 text-sm sm:text-base tracking-wide leading-none group-hover:text-amber-600 transition-colors whitespace-nowrap">
                  JSS ENTERPRISE
                </h1>
                <p className="text-slate-400 text-[9px] sm:text-[10px] tracking-wider sm:tracking-widest font-semibold mt-0.5 uppercase whitespace-nowrap">
                  Precision | Power | Progress
                </p>
              </div>
            </Link>

            {/* Right Action Controls: Sync, Create Bill, Admin Logout */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Sync Button */}
              <button
                type="button"
                onClick={() => loadData(true)}
                disabled={isSyncing}
                title="Sync across devices"
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isSyncing ? "animate-spin text-amber-600" : ""}`} />
                <span>{isSyncing ? "Syncing..." : "Sync"}</span>
              </button>

              {/* Create Bill Button */}
              <Link
                href="/invoice/new"
                className="inline-flex items-center gap-1.5 sm:gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm transition-all shadow-sm shadow-amber-500/20 active:scale-98 whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="whitespace-nowrap">Create Bill</span>
              </Link>

              {/* Admin Logout */}
              <button
                type="button"
                onClick={() => logoutAdmin()}
                title="Sign out of Admin"
                className="inline-flex items-center gap-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition-colors border border-transparent hover:border-rose-200 shrink-0"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline text-xs font-semibold">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── STORAGE STATUS SUB-BAR ── */}
      <div className="bg-slate-100 border-b border-slate-200/60 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-slate-600 gap-2">
          <div className="flex items-center gap-2 overflow-hidden truncate">
            {storageInfo?.isCloud ? (
              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">
                <Cloud className="w-3 h-3 text-emerald-600" />
                <span>Cloud Synced ({storageInfo.name})</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-slate-700 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">
                <HardDrive className="w-3 h-3 text-slate-500" />
                <span>Local Server Mode</span>
              </span>
            )}
            <span className="hidden sm:inline text-slate-400">|</span>
            <span className="hidden sm:inline-flex items-center gap-1 text-slate-500 text-[11px]">
              <ShieldCheck className="w-3 h-3 text-amber-500" />
              <span>Admin: <strong>adminjss</strong></span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => loadData(true)}
            className="sm:hidden text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 text-[11px] font-semibold"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin text-amber-600" : ""}`} />
            <span>{isSyncing ? "Syncing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Sync Toast Notification */}
      {syncToast && (
        <div className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2 text-center transition-all animate-fade-in shadow-xs flex items-center justify-center gap-2">
          <span>✓ {syncToast}</span>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              icon: FileStack,
              label: "Total Invoices",
              value: invoices.length,
              badgeBg: "bg-blue-50 text-blue-700 border-blue-100",
            },
            {
              icon: IndianRupee,
              label: "Total Revenue",
              value: `₹${totalRevenue.toLocaleString("en-IN")}`,
              badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-100",
            },
            {
              icon: Calendar,
              label: "This Month",
              value: thisMonth.length,
              badgeBg: "bg-purple-50 text-purple-700 border-purple-100",
            },
            {
              icon: TrendingUp,
              label: "Average Value",
              value: invoices.length
                ? `₹${Math.round(totalRevenue / invoices.length).toLocaleString("en-IN")}`
                : "₹0",
              badgeBg: "bg-amber-50 text-amber-700 border-amber-100",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white border border-slate-200/80 rounded-xl p-4.5 shadow-xs hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-500 text-xs font-medium uppercase tracking-wider">{stat.label}</span>
                <div className={`p-2 rounded-lg border ${stat.badgeBg}`}>
                  <stat.icon className="w-4 h-4" />
                </div>
              </div>
              <p className="font-bold text-xl text-slate-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Invoice List Panel */}
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
          {/* Header Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-col sm:flex-row gap-3.5 items-start sm:items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-slate-900 font-bold text-base">Invoices &amp; Bills</h2>
              <p className="text-slate-500 text-xs">Manage, view, export, and share your bills</p>
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search invoice, customer, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* Table (Desktop) & Cards (Mobile) */}
          {filtered.length === 0 ? (
            <div className="py-16 text-center px-4">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-slate-800 font-bold text-base">No Invoices Found</h3>
              <p className="text-slate-500 text-xs mt-1 mb-5 max-w-sm mx-auto">
                {search ? "No bills matched your search query. Try another keyword." : "You haven't generated any bills yet. Click below to create your first invoice."}
              </p>
              <Link
                href="/invoice/new"
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-4 py-2 rounded-lg text-xs shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" /> Create New Bill
              </Link>
            </div>
          ) : (
            <div>
              {/* ── MOBILE CARDS VIEW (NO HORIZONTAL SCROLL) ── */}
              <div className="block md:hidden divide-y divide-slate-100">
                {filtered.map((inv) => (
                  <div
                    key={inv.id}
                    className={`p-4 hover:bg-slate-50/80 transition-all ${
                      deletingId === inv.id ? "opacity-30 scale-98" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <Link
                        href={`/invoice/${inv.id}`}
                        className="font-bold text-amber-600 hover:text-amber-700 text-sm hover:underline"
                      >
                        {inv.invoiceInfo.invoiceNo || "INV-DRAFT"}
                      </Link>
                      <span className="text-[11px] text-slate-500 font-medium">{inv.invoiceInfo.invoiceDate}</span>
                    </div>

                    <div className="mb-2.5">
                      <p className="font-semibold text-slate-900 text-xs">{inv.buyerDetails.customerName || "Customer"}</p>
                      <p className="text-slate-400 text-[11px] truncate">{inv.buyerDetails.cityState || inv.buyerDetails.address}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Amount</span>
                        <span className="font-bold text-slate-900 text-sm">
                          ₹ {inv.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/invoice/${inv.id}`}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                        >
                          View
                        </Link>
                        <button
                          type="button"
                          onClick={() => shareInvoiceToWhatsApp(inv)}
                          className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                          title="Share on WhatsApp"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <Link
                          href={`/invoice/${inv.id}/edit`}
                          className="p-1.5 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-md transition-colors"
                          title="Edit Bill"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(inv.id, inv.invoiceInfo.invoiceNo)}
                          className="p-1.5 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors"
                          title="Delete Bill"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── DESKTOP TABLE VIEW ── */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="px-4 sm:px-6 py-3">Invoice No</th>
                      <th className="px-4 py-3">Customer / Buyer</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3 text-right">Grand Total</th>
                      <th className="px-4 sm:px-6 py-3 text-center w-36">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((inv) => (
                      <tr
                        key={inv.id}
                        className={`hover:bg-slate-50/80 transition-all ${
                          deletingId === inv.id ? "opacity-30 scale-98" : ""
                        }`}
                      >
                        {/* Invoice No */}
                        <td className="px-4 sm:px-6 py-3.5">
                          <Link
                            href={`/invoice/${inv.id}`}
                            className="font-bold text-amber-600 hover:text-amber-700 hover:underline inline-flex items-center gap-1.5"
                          >
                            <span>{inv.invoiceInfo.invoiceNo || "INV-DRAFT"}</span>
                          </Link>
                        </td>

                        {/* Customer */}
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-slate-900">{inv.buyerDetails.customerName || "Customer"}</p>
                          <p className="text-slate-400 text-[11px] truncate max-w-xs">{inv.buyerDetails.cityState || inv.buyerDetails.address}</p>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3.5 text-slate-600 font-medium">
                          {inv.invoiceInfo.invoiceDate}
                        </td>

                        {/* Amount */}
                        <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                          ₹ {inv.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>

                        {/* Actions */}
                        <td className="px-4 sm:px-6 py-3.5">
                          <div className="flex items-center justify-center gap-1">
                            {/* View */}
                            <Link
                              href={`/invoice/${inv.id}`}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                              title="View & Export Bill"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>

                            {/* WhatsApp */}
                            <button
                              onClick={() => shareInvoiceToWhatsApp(inv)}
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                              title="Share on WhatsApp"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>

                            {/* Edit */}
                            <Link
                              href={`/invoice/${inv.id}/edit`}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                              title="Edit Bill"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>

                            {/* Delete */}
                            <button
                              onClick={() => handleDelete(inv.id, inv.invoiceInfo.invoiceNo)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                              title="Delete Bill"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
