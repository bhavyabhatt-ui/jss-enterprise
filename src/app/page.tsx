"use client";

import { useState, useEffect, useRef } from "react";
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
  LogOut,
  ShieldCheck,
} from "lucide-react";

export default function DashboardPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [storageInfo, setStorageInfo] = useState<{ isCloud: boolean; name: string } | null>(null);
  const isFetchingRef = useRef(false);

  // Live real-time fetch from MongoDB
  const liveSyncFromDB = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const freshList = await fetchInvoices();
      if (Array.isArray(freshList)) {
        setInvoices((prev) => {
          // Only trigger React re-render if data has actually changed
          if (
            prev.length !== freshList.length ||
            prev.map((i) => `${i.id}-${i.updatedAt}`).join(",") !==
              freshList.map((i) => `${i.id}-${i.updatedAt}`).join(",")
          ) {
            return freshList;
          }
          return prev;
        });
      }
    } catch (err) {
      console.warn("Live sync error:", err);
    } finally {
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    // 1. Instant optimistic load from local cache
    setInvoices(getAllInvoices());

    // 2. Fetch active storage status
    fetch("/api/storage/status")
      .then((res) => (res.ok ? res.json() : null))
      .then((info) => {
        if (info) setStorageInfo(info);
      })
      .catch(() => {});

    // 3. Immediate sync from MongoDB
    liveSyncFromDB();

    // 4. Automatic LIVE polling every 2.5 seconds (zero refresh required)
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && !document.hidden) {
        liveSyncFromDB();
      }
    }, 2500);

    // 5. Re-check instantly when window gains focus or tab becomes visible
    const handleVisibility = () => {
      if (typeof document !== "undefined" && !document.hidden) {
        liveSyncFromDB();
      }
    };

    window.addEventListener("focus", handleVisibility);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleVisibility);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const filtered = invoices.filter(
    (inv) =>
      inv.invoiceInfo?.invoiceNo?.toLowerCase().includes(search.toLowerCase()) ||
      inv.buyerDetails?.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      inv.buyerDetails?.contactNo?.includes(search)
  );

  const totalRevenue = invoices.reduce((sum, inv) => sum + (Number(inv.grandTotal) || 0), 0);
  const thisMonth = invoices.filter((inv) => {
    const d = new Date(inv.createdAt || inv.invoiceInfo?.invoiceDate);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  async function handleDelete(id: string, invoiceNo: string) {
    if (confirm(`Are you sure you want to permanently delete invoice ${invoiceNo || id}?`)) {
      setDeletingId(id);
      // Instant optimistic UI update
      setInvoices((prev) =>
        prev.filter((inv) => inv.id !== id && inv.invoiceInfo?.invoiceNo !== invoiceNo)
      );
      try {
        await deleteInvoice(id);
      } catch (err) {
        console.error("Delete error:", err);
      } finally {
        setDeletingId(null);
        // Force fresh load directly from server database
        const freshList = await fetchInvoices();
        setInvoices(freshList);
      }
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

            {/* Right Action Controls: Create Bill, Admin Logout */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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

      {/* ── LIVE REAL-TIME STATUS SUB-BAR ── */}
      <div className="bg-slate-100 border-b border-slate-200/60 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-slate-600 gap-2">
          <div className="flex items-center gap-2 overflow-hidden truncate">
            {/* Live Pulser Badge */}
            <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Live Synced ({storageInfo?.name || "MongoDB Atlas Cloud"})</span>
            </span>

            <span className="hidden sm:inline text-slate-400">|</span>
            <span className="hidden sm:inline-flex items-center gap-1 text-slate-500 text-[11px]">
              <ShieldCheck className="w-3 h-3 text-amber-500" />
              <span>Admin: <strong>adminjss</strong></span>
            </span>
          </div>

          <span className="text-[11px] text-slate-400 font-medium">
            Auto-Updates Real Time across all devices
          </span>
        </div>
      </div>

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
              <p className="text-slate-500 text-xs">Manage, view, export, and share your bills across all devices</p>
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
                        {inv.invoiceInfo?.invoiceNo || "INV-DRAFT"}
                      </Link>
                      <span className="text-[11px] text-slate-500 font-medium">{inv.invoiceInfo?.invoiceDate}</span>
                    </div>

                    <div className="mb-2.5">
                      <p className="font-semibold text-slate-900 text-xs">{inv.buyerDetails?.customerName || "Customer"}</p>
                      <p className="text-slate-400 text-[11px] truncate">{inv.buyerDetails?.cityState || inv.buyerDetails?.address}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Amount</span>
                        <span className="font-bold text-slate-900 text-sm">
                          ₹ {Number(inv.grandTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
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
                          title="Share on WhatsApp with Details"
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
                          onClick={() => handleDelete(inv.id, inv.invoiceInfo?.invoiceNo)}
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
                            <span>{inv.invoiceInfo?.invoiceNo || "INV-DRAFT"}</span>
                          </Link>
                        </td>

                        {/* Customer */}
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-slate-900">{inv.buyerDetails?.customerName || "Customer"}</p>
                          <p className="text-slate-400 text-[11px] truncate max-w-xs">{inv.buyerDetails?.cityState || inv.buyerDetails?.address}</p>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3.5 text-slate-600 font-medium">
                          {inv.invoiceInfo?.invoiceDate}
                        </td>

                        {/* Amount */}
                        <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                          ₹ {Number(inv.grandTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
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
                              title="Share on WhatsApp with Details"
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
                              onClick={() => handleDelete(inv.id, inv.invoiceInfo?.invoiceNo)}
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
