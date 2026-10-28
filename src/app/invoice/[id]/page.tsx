"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getInvoiceById } from "@/lib/storage";
import { exportToPDF, exportToImage, exportToWord } from "@/lib/export";
import { Invoice } from "@/types/invoice";
import InvoicePreview from "@/components/InvoicePreview";
import Link from "next/link";
import {
  ArrowLeft, Edit, Download, FileImage, FileText, FileType,
  Loader2
} from "lucide-react";

type ExportType = "pdf" | "image" | "word" | null;

export default function InvoiceViewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [exporting, setExporting] = useState<ExportType>(null);

  useEffect(() => {
    if (id) {
      const inv = getInvoiceById(id);
      if (!inv) router.push("/");
      else setInvoice(inv);
    }
  }, [id, router]);

  async function handleExport(type: ExportType) {
    if (!invoice || !type) return;
    setExporting(type);
    const filename = `Invoice-${invoice.invoiceInfo.invoiceNo || invoice.id}`;
    try {
      if (type === "pdf") await exportToPDF("invoice-print-area", filename);
      else if (type === "image") await exportToImage("invoice-print-area", filename);
      else if (type === "word") await exportToWord(invoice);
    } catch (err) {
      console.error(err);
    }
    setExporting(null);
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
      </div>
    );
  }

  const exportButtons = [
    { type: "pdf" as const, icon: FileText, label: "PDF", color: "bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20" },
    { type: "image" as const, icon: FileImage, label: "Image", color: "bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20" },
    { type: "word" as const, icon: FileType, label: "Word", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/20" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Top Bar */}
      <div className="bg-slate-900/90 backdrop-blur border-b border-slate-700/60 sticky top-0 z-40 no-print">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-1.5 text-slate-400 hover:text-yellow-400 text-sm transition-colors font-medium bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700/50"
            >
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </button>
            <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
              <div className="w-8 h-8 rounded-lg overflow-hidden border border-yellow-500/40 bg-slate-950 p-0.5 shadow">
                <img
                  src="/logo.png"
                  alt="JSS Enterprise"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-extrabold text-yellow-400 text-sm tracking-wider">JSS ENTERPRISE</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {exportButtons.map(({ type, icon: Icon, label, color }) => (
              <button
                key={type}
                onClick={() => handleExport(type)}
                disabled={!!exporting}
                className={`flex items-center gap-1.5 border px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${color} disabled:opacity-50`}
              >
                {exporting === type ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
                {label}
              </button>
            ))}
            <Link
              href={`/invoice/${id}/edit`}
              className="flex items-center gap-1.5 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-semibold px-4 py-1.5 rounded-lg text-sm transition-all"
            >
              <Edit className="w-3.5 h-3.5" /> Edit
            </Link>
          </div>
        </div>
      </div>

      {/* Invoice */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/40 border border-slate-700/30">
          <InvoicePreview invoice={invoice} />
        </div>
      </div>
    </div>
  );
}

