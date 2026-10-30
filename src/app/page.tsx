"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { getAllInvoices, fetchInvoices, deleteInvoice, resetDatabase, logoutAdmin } from "@/lib/storage";
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
  Filter,
  ArrowUpDown,
  RefreshCw,
  AlertTriangle,
  Users,
  CheckCircle2,
  X,
  PieChart,
} from "lucide-react";

type SortOption = "date_desc" | "date_asc" | "amount_desc" | "amount_asc" | "inv_asc" | "name_asc";
type PeriodFilter = "all" | "this_month" | "last_month" | "this_year";

export default function DashboardPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date_desc");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [storageInfo, setStorageInfo] = useState<{ isCloud: boolean; name: string } | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const isFetchingRef = useRef(false);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Live real-time fetch from MongoDB Atlas
  const liveSyncFromDB = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const freshList = await fetchInvoices();
      if (Array.isArray(freshList)) {
        setInvoices((prev) => {
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

    // 3. Immediate sync from MongoDB Atlas
    liveSyncFromDB();

    // 4. Automatic LIVE polling every 2.5 seconds (zero refresh required across devices)
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

  // Helper date parser
  const parseInvoiceDate = (inv: Invoice): Date => {
    if (inv.createdAt) {
      const d = new Date(inv.createdAt);
      if (!isNaN(d.getTime())) return d;
    }
    const raw = inv.invoiceInfo?.invoiceDate || "";
    // Handle DD/MM/YYYY or YYYY-MM-DD
    const parts = raw.split(/[-/]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      }
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    return new Date(0);
  };

  // Filtered and Sorted Invoices
  const filteredAndSorted = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 1. Filter by Search Query
    let result = invoices.filter((inv) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      const invNo = inv.invoiceInfo?.invoiceNo?.toLowerCase() || "";
      const customer = inv.buyerDetails?.customerName?.toLowerCase() || "";
      const phone = inv.buyerDetails?.contactNo || "";
      const city = inv.buyerDetails?.cityState?.toLowerCase() || "";
      const gstin = inv.buyerDetails?.gstinPan?.toLowerCase() || "";
      return (
        invNo.includes(q) ||
        customer.includes(q) ||
        phone.includes(q) ||
        city.includes(q) ||
        gstin.includes(q)
      );
    });

    // 2. Filter by Time Period
    if (periodFilter !== "all") {
      result = result.filter((inv) => {
        const d = parseInvoiceDate(inv);
        if (isNaN(d.getTime())) return true;
        const m = d.getMonth();
        const y = d.getFullYear();

        if (periodFilter === "this_month") {
          return m === currentMonth && y === currentYear;
        }
        if (periodFilter === "last_month") {
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          return m === lastMonth && y === lastMonthYear;
        }
        if (periodFilter === "this_year") {
          // Indian Financial Year: April 1 to March 31
          const startYear = currentMonth >= 3 ? currentYear : currentYear - 1;
          const fyStart = new Date(startYear, 3, 1);
          const fyEnd = new Date(startYear + 1, 2, 31, 23, 59, 59);
          return d >= fyStart && d <= fyEnd;
        }
        return true;
      });
    }

    // 3. Sort
    result.sort((a, b) => {
      const dateA = parseInvoiceDate(a).getTime();
      const dateB = parseInvoiceDate(b).getTime();
      const amountA = Number(a.grandTotal) || 0;
      const amountB = Number(b.grandTotal) || 0;
      const noA = (a.invoiceInfo?.invoiceNo || "").toLowerCase();
      const noB = (b.invoiceInfo?.invoiceNo || "").toLowerCase();
      const nameA = (a.buyerDetails?.customerName || "").toLowerCase();
      const nameB = (b.buyerDetails?.customerName || "").toLowerCase();

      switch (sortBy) {
        case "date_desc":
          return dateB - dateA;
        case "date_asc":
          return dateA - dateB;
        case "amount_desc":
          return amountB - amountA;
        case "amount_asc":
          return amountA - amountB;
        case "inv_asc":
          return noA.localeCompare(noB, undefined, { numeric: true });
        case "name_asc":
          return nameA.localeCompare(nameB);
        default:
          return dateB - dateA;
      }
    });

    return result;
  }, [invoices, search, sortBy, periodFilter]);

  // Analytics Computations
  const analytics = useMemo(() => {
    let totalRevenue = 0;
    let taxableTotal = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;
    const customerMap: Record<string, { count: number; total: number; gstin?: string }> = {};

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    let thisMonthCount = 0;
    let thisMonthRevenue = 0;

    for (const inv of invoices) {
      const gTotal = Number(inv.grandTotal) || 0;
      const sub = Number(inv.subTotal) || 0;
      const cgst = Number(inv.cgstAmount) || 0;
      const sgst = Number(inv.sgstAmount) || 0;
      const igst = Number(inv.igstAmount) || 0;

      totalRevenue += gTotal;
      taxableTotal += sub;
      cgstTotal += cgst;
      sgstTotal += sgst;
      igstTotal += igst;

      const custName = inv.buyerDetails?.customerName?.trim() || "Unspecified Buyer";
      if (!customerMap[custName]) {
        customerMap[custName] = { count: 0, total: 0, gstin: inv.buyerDetails?.gstinPan };
      }
      customerMap[custName].count += 1;
      customerMap[custName].total += gTotal;

      const d = parseInvoiceDate(inv);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        thisMonthCount += 1;
        thisMonthRevenue += gTotal;
      }
    }

    const totalTax = cgstTotal + sgstTotal + igstTotal;
    const avgValue = invoices.length > 0 ? Math.round(totalRevenue / invoices.length) : 0;

    // Top 5 Customers by revenue
    const topCustomers = Object.entries(customerMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return {
      totalRevenue,
      taxableTotal,
      totalTax,
      cgstTotal,
      sgstTotal,
      igstTotal,
      avgValue,
      thisMonthCount,
      thisMonthRevenue,
      topCustomers,
    };
  }, [invoices]);

  // Handle Permanent Delete
  async function handleDelete(id: string, invoiceNo: string) {
    if (confirm(`Are you sure you want to permanently delete invoice ${invoiceNo || id} from database?`)) {
      setDeletingId(id);
      // Instant optimistic UI update
      setInvoices((prev) =>
        prev.filter((inv) => inv.id !== id && inv.invoiceInfo?.invoiceNo !== invoiceNo)
      );
      try {
        await deleteInvoice(id);
        showToast(`Invoice ${invoiceNo || id} deleted permanently.`);
      } catch (err) {
        console.error("Delete error:", err);
        showToast("Error deleting invoice from database.", "error");
      } finally {
        setDeletingId(null);
        const freshList = await fetchInvoices();
        setInvoices(freshList);
      }
    }
  }

  // Handle Complete Database Reset
  async function handleResetDatabase() {
    setIsResetting(true);
    try {
      const ok = await resetDatabase();
      if (ok) {
        setInvoices([]);
        setShowResetModal(false);
        showToast("Database has been completely wiped. 0 records remaining.");
      } else {
        showToast("Failed to reset database on server.", "error");
      }
    } catch (err) {
      console.error("Reset error:", err);
      showToast("Error resetting database.", "error");
    } finally {
      setIsResetting(false);
      // Fresh sync
      liveSyncFromDB();
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* ── TOAST NOTIFICATION ── */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all ${
            toastMessage.type === "success"
              ? "bg-emerald-600 text-white border-emerald-700 shadow-emerald-500/20"
              : "bg-rose-600 text-white border-rose-700 shadow-rose-500/20"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 hover:opacity-75 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── RESET DATABASE CONFIRMATION MODAL ── */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-100">
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mb-4 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-slate-900 font-extrabold text-lg text-center">
              Reset Entire Database?
            </h3>
            <p className="text-slate-600 text-xs sm:text-sm text-center mt-2 leading-relaxed">
              This will <strong>permanently delete ALL bills and invoices</strong> from the MongoDB
              Atlas Cloud Database. No sample data will be restored. You will start with an empty, clean database (0 bills).
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                disabled={isResetting}
                className="flex-1 py-2.5 px-4 border border-slate-300 text-slate-700 font-semibold rounded-lg text-xs hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetDatabase}
                disabled={isResetting}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2 shadow-sm shadow-rose-600/30"
              >
                {isResetting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Wiping Database...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Yes, Wipe Everything</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOP NAVIGATION ── */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-xs">
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

              {/* Reset Database Button */}
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                title="Wipe database completely"
                className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 sm:px-3 py-2 rounded-lg text-xs font-semibold transition-colors shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset DB</span>
              </button>

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

          <div className="flex items-center gap-2">
            <button
              onClick={() => liveSyncFromDB()}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-amber-600 text-[11px] font-medium"
              title="Force sync now"
            >
              <RefreshCw className="w-3 h-3" />
              <span className="hidden sm:inline">Sync Now</span>
            </button>
            <span className="text-[11px] text-slate-400 font-medium hidden md:inline">
              Auto-Updates Real Time across all devices
            </span>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ── 1. PRIMARY ANALYTICS METRICS ── */}
        <div>
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="text-slate-900 font-extrabold text-sm sm:text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <span>Financial Overview &amp; Analytics</span>
            </h2>
            <span className="text-slate-400 text-xs">
              Based on {invoices.length} {invoices.length === 1 ? "bill" : "bills"}
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3.5 sm:gap-4">
            {/* Total Invoices */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                  Total Bills
                </span>
                <div className="p-1.5 rounded-lg border bg-blue-50 text-blue-700 border-blue-100">
                  <FileStack className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="font-extrabold text-lg sm:text-xl text-slate-900">{invoices.length}</p>
              <p className="text-slate-400 text-[10px] mt-0.5">Created across devices</p>
            </div>

            {/* Total Revenue */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                  Total Revenue
                </span>
                <div className="p-1.5 rounded-lg border bg-emerald-50 text-emerald-700 border-emerald-100">
                  <IndianRupee className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="font-extrabold text-lg sm:text-xl text-emerald-600 truncate">
                ₹{analytics.totalRevenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </p>
              <p className="text-slate-400 text-[10px] mt-0.5">Gross Invoiced Total</p>
            </div>

            {/* Net Taxable Revenue */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                  Taxable Value
                </span>
                <div className="p-1.5 rounded-lg border bg-indigo-50 text-indigo-700 border-indigo-100">
                  <PieChart className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="font-extrabold text-lg sm:text-xl text-indigo-600 truncate">
                ₹{analytics.taxableTotal.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </p>
              <p className="text-slate-400 text-[10px] mt-0.5">Excluding GST taxes</p>
            </div>

            {/* Total GST Collected */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                  GST Tax Total
                </span>
                <div className="p-1.5 rounded-lg border bg-amber-50 text-amber-700 border-amber-100">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="font-extrabold text-lg sm:text-xl text-amber-600 truncate">
                ₹{analytics.totalTax.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </p>
              <p className="text-slate-400 text-[10px] mt-0.5">CGST + SGST + IGST</p>
            </div>

            {/* This Month */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                  This Month
                </span>
                <div className="p-1.5 rounded-lg border bg-purple-50 text-purple-700 border-purple-100">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="font-extrabold text-lg sm:text-xl text-purple-700">
                {analytics.thisMonthCount} <span className="text-xs font-normal text-slate-500">bills</span>
              </p>
              <p className="text-slate-400 text-[10px] mt-0.5 truncate">
                ₹{analytics.thisMonthRevenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </p>
            </div>

            {/* Average Bill Value */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                  Average Value
                </span>
                <div className="p-1.5 rounded-lg border bg-teal-50 text-teal-700 border-teal-100">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="font-extrabold text-lg sm:text-xl text-teal-700 truncate">
                ₹{analytics.avgValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </p>
              <p className="text-slate-400 text-[10px] mt-0.5">Per invoice average</p>
            </div>
          </div>
        </div>

        {/* ── 2. SECONDARY INSIGHTS: TAX BREAKDOWN & TOP CUSTOMERS ── */}
        {invoices.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* GST Summary Card */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-indigo-500" />
                  <span>GST Tax Breakdown</span>
                </h3>
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                  Total ₹{analytics.totalTax.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Central GST (CGST)</span>
                  <span className="font-bold text-slate-800">
                    ₹{analytics.cgstTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full"
                    style={{
                      width: analytics.totalTax ? `${(analytics.cgstTotal / analytics.totalTax) * 100}%` : "0%",
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500">State GST (SGST)</span>
                  <span className="font-bold text-slate-800">
                    ₹{analytics.sgstTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{
                      width: analytics.totalTax ? `${(analytics.sgstTotal / analytics.totalTax) * 100}%` : "0%",
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500">Integrated GST (IGST)</span>
                  <span className="font-bold text-slate-800">
                    ₹{analytics.igstTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full"
                    style={{
                      width: analytics.totalTax ? `${(analytics.igstTotal / analytics.totalTax) * 100}%` : "0%",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Top 5 Buyers Card */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-500" />
                  <span>Top Buyers &amp; Customers</span>
                </h3>
                <span className="text-slate-400 text-xs">Ranked by revenue contribution</span>
              </div>

              {analytics.topCustomers.length === 0 ? (
                <p className="text-slate-400 text-xs py-4">No customer data available yet.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {analytics.topCustomers.map((cust, idx) => {
                    const percent = analytics.totalRevenue
                      ? ((cust.total / analytics.totalRevenue) * 100).toFixed(1)
                      : "0";
                    return (
                      <div key={idx} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div className="truncate">
                            <p className="font-semibold text-slate-900 text-xs truncate">
                              {cust.name}
                            </p>
                            {cust.gstin && (
                              <p className="text-slate-400 text-[10px] font-mono truncate">
                                GST: {cust.gstin}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="font-extrabold text-slate-900 text-xs">
                            ₹{cust.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-slate-400 text-[10px]">
                            {cust.count} {cust.count === 1 ? "bill" : "bills"} ({percent}%)
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 3. INVOICE LIST PANEL WITH SEARCH, SORT, AND FILTERS ── */}
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
          {/* Header Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-slate-900 font-bold text-base flex items-center gap-2">
                <span>Invoices &amp; Bills</span>
                <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                  {filteredAndSorted.length}
                </span>
              </h2>
              <p className="text-slate-500 text-xs">
                Manage, view, export, and share your bills live across all devices
              </p>
            </div>

            {/* Controls: Search, Sort By, Filter By */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              {/* Search Box */}
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search invoice, customer, GST..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all shadow-2xs"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Period Filter Dropdown */}
              <div className="relative">
                <select
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e.target.value as PeriodFilter)}
                  className="appearance-none bg-white border border-slate-300 text-slate-700 text-xs rounded-lg pl-8 pr-8 py-2 font-medium focus:outline-none focus:border-amber-500 cursor-pointer shadow-2xs hover:bg-slate-50 transition-colors"
                >
                  <option value="all">All Dates</option>
                  <option value="this_month">This Month</option>
                  <option value="last_month">Last Month</option>
                  <option value="this_year">This Financial Year</option>
                </select>
                <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>

              {/* Sort By Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="appearance-none bg-white border border-slate-300 text-slate-700 text-xs rounded-lg pl-8 pr-8 py-2 font-medium focus:outline-none focus:border-amber-500 cursor-pointer shadow-2xs hover:bg-slate-50 transition-colors"
                >
                  <option value="date_desc">Date: Newest First</option>
                  <option value="date_asc">Date: Oldest First</option>
                  <option value="amount_desc">Amount: High to Low</option>
                  <option value="amount_asc">Amount: Low to High</option>
                  <option value="inv_asc">Invoice No (A to Z)</option>
                  <option value="name_asc">Customer Name (A to Z)</option>
                </select>
                <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Table (Desktop) & Cards (Mobile) */}
          {filteredAndSorted.length === 0 ? (
            <div className="py-16 text-center px-4">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-slate-800 font-bold text-base">No Invoices Found</h3>
              <p className="text-slate-500 text-xs mt-1 mb-5 max-w-sm mx-auto">
                {search || periodFilter !== "all"
                  ? "No bills matched your active filters. Try clearing filters or searching another keyword."
                  : "You haven't generated any bills yet. Click below to create your first invoice."}
              </p>
              {search || periodFilter !== "all" ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setPeriodFilter("all");
                  }}
                  className="inline-flex items-center gap-1.5 text-amber-600 hover:text-amber-700 text-xs font-semibold border border-amber-300 bg-amber-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
              ) : (
                <Link
                  href="/invoice/new"
                  className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-4 py-2 rounded-lg text-xs shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" /> Create New Bill
                </Link>
              )}
            </div>
          ) : (
            <div>
              {/* ── MOBILE CARDS VIEW ── */}
              <div className="block md:hidden divide-y divide-slate-100">
                {filteredAndSorted.map((inv) => (
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
                      <span className="text-[11px] text-slate-500 font-medium">
                        {inv.invoiceInfo?.invoiceDate}
                      </span>
                    </div>

                    <div className="mb-2.5">
                      <p className="font-semibold text-slate-900 text-xs">
                        {inv.buyerDetails?.customerName || "Customer"}
                      </p>
                      <p className="text-slate-400 text-[11px] truncate">
                        {inv.buyerDetails?.cityState || inv.buyerDetails?.address}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                          Total Amount
                        </span>
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
                      <th className="px-4 py-3 text-right">Taxable Amount</th>
                      <th className="px-4 py-3 text-right">Grand Total</th>
                      <th className="px-4 sm:px-6 py-3 text-center w-36">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAndSorted.map((inv) => (
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
                          <p className="font-semibold text-slate-900">
                            {inv.buyerDetails?.customerName || "Customer"}
                          </p>
                          <p className="text-slate-400 text-[11px] truncate max-w-xs">
                            {inv.buyerDetails?.cityState || inv.buyerDetails?.address}
                          </p>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3.5 text-slate-600 font-medium">
                          {inv.invoiceInfo?.invoiceDate}
                        </td>

                        {/* Taxable Amount */}
                        <td className="px-4 py-3.5 text-right font-medium text-slate-600">
                          ₹ {Number(inv.subTotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>

                        {/* Grand Total */}
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
