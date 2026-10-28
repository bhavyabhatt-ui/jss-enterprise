"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAllInvoices, deleteInvoice } from "@/lib/storage";
import { Invoice } from "@/types/invoice";
import {
  Plus, FileText, Trash2, Edit, Eye, Search,
  TrendingUp, IndianRupee, FileStack, Calendar
} from "lucide-react";

export default function DashboardPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setInvoices(getAllInvoices());
  }, []);

  const filtered = invoices.filter(
    (inv) =>
      inv.invoiceInfo.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
      inv.buyerDetails.customerName.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const thisMonth = invoices.filter((inv) => {
    const d = new Date(inv.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  function handleDelete(id: string) {
    setDeletingId(id);
    setTimeout(() => {
      deleteInvoice(id);
      setInvoices(getAllInvoices());
      setDeletingId(null);
    }, 300);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Top Nav */}
      <nav className="bg-slate-900/80 backdrop-blur border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-slate-900" />
              </div>
              <div>
                <p className="font-bold text-yellow-400 text-sm leading-none">JSS ENTERPRISE</p>
                <p className="text-slate-400 text-xs">Invoice Management System</p>
              </div>
            </div>
            <Link
              href="/invoice/new"
              className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-semibold px-4 py-2 rounded-lg text-sm transition-all shadow-lg shadow-yellow-400/20"
            >
              <Plus className="w-4 h-4" />
              <span>New Invoice</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              icon: FileStack,
              label: "Total Invoices",
              value: invoices.length,
              color: "from-blue-500 to-blue-700",
              textColor: "text-blue-400",
            },
            {
              icon: IndianRupee,
              label: "Total Revenue",
              value: `₹${totalRevenue.toLocaleString("en-IN")}`,
              color: "from-green-500 to-green-700",
              textColor: "text-green-400",
            },
            {
              icon: Calendar,
              label: "This Month",
              value: thisMonth.length,
              color: "from-purple-500 to-purple-700",
              textColor: "text-purple-400",
            },
            {
              icon: TrendingUp,
              label: "Avg Invoice",
              value: invoices.length
                ? `₹${Math.round(totalRevenue / invoices.length).toLocaleString("en-IN")}`
                : "₹0",
              color: "from-orange-500 to-orange-700",
              textColor: "text-orange-400",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 backdrop-blur"
            >
              <div className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${stat.color} mb-3`}>
                <stat.icon className="w-4 h-4 text-white" />
              </div>
              <p className="text-slate-400 text-xs mb-1">{stat.label}</p>
              <p className={`font-bold text-lg ${stat.textColor}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Search & List */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl backdrop-blur overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-700/50 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <h2 className="text-white font-semibold text-lg">All Invoices</h2>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search invoice or customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 text-sm focus:outline-none focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="py-20 text-center">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg font-medium">No invoices yet</p>
              <p className="text-slate-500 text-sm mb-6">Create your first invoice to get started</p>
              <Link
                href="/invoice/new"
                className="inline-flex items-center gap-2 bg-yellow-400 text-slate-900 font-semibold px-6 py-2.5 rounded-lg text-sm"
              >
                <Plus className="w-4 h-4" /> Create Invoice
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left text-slate-400 text-xs font-medium px-4 sm:px-6 py-3 uppercase tracking-wider">Invoice No</th>
                    <th className="text-left text-slate-400 text-xs font-medium px-4 py-3 uppercase tracking-wider hidden sm:table-cell">Customer</th>
                    <th className="text-left text-slate-400 text-xs font-medium px-4 py-3 uppercase tracking-wider hidden md:table-cell">Date</th>
                    <th className="text-right text-slate-400 text-xs font-medium px-4 py-3 uppercase tracking-wider">Amount</th>
                    <th className="text-center text-slate-400 text-xs font-medium px-4 sm:px-6 py-3 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {filtered.map((inv) => (
                    <tr
                      key={inv.id}
                      className={`hover:bg-slate-700/30 transition-all duration-200 ${
                        deletingId === inv.id ? "opacity-0 scale-95" : "opacity-100"
                      }`}
                    >
                      <td className="px-4 sm:px-6 py-4">
                        <span className="text-yellow-400 font-medium text-sm">{inv.invoiceInfo.invoiceNo}</span>
                      </td>
                      <td className="px-4 py-4 hidden sm:table-cell">
                        <span className="text-white text-sm">{inv.buyerDetails.customerName}</span>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <span className="text-slate-400 text-sm">{inv.invoiceInfo.invoiceDate}</span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="text-green-400 font-semibold text-sm">
                          ₹{inv.grandTotal.toLocaleString("en-IN")}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/invoice/${inv.id}`}
                            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/invoice/${inv.id}/edit`}
                            className="p-1.5 text-slate-400 hover:text-yellow-400 hover:bg-yellow-400/10 rounded-lg transition-all"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(inv.id)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                            title="Delete"
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
          )}
        </div>
      </div>
    </div>
  );
}
