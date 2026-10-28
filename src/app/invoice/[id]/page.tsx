"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getInvoiceById } from "@/lib/storage";
import { exportToPDF, exportToImage, exportToWord, shareInvoiceToWhatsApp } from "@/lib/export";
import { Invoice } from "@/types/invoice";
import InvoicePreview from "@/components/InvoicePreview";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  FileImage,
  FileText,
  FileType,
  Printer,
  Loader2,
  Check,
  Share2,
} from "lucide-react";

type ExportType = "pdf" | "image" | "word" | "whatsapp" | null;

export default function InvoiceViewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [exporting, setExporting] = useState<ExportType>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const inv = getInvoiceById(id);
      if (!inv) router.push("/");
      else setInvoice(inv);
    }
  }, [id, router]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  async function handleExport(type: ExportType) {
    if (!invoice || !type) return;
    setExporting(type);
    const cleanNo = (invoice.invoiceInfo.invoiceNo || invoice.id).replace(/[/\\?%*:|"<>]/g, "-");
    const filename = `Invoice-${cleanNo}`;

    try {
      if (type === "pdf") {
        await exportToPDF("invoice-print-area", filename);
        showToast("PDF downloaded successfully!");
      } else if (type === "image") {
        await exportToImage("invoice-print-area", filename);
        showToast("PNG Image downloaded successfully!");
      } else if (type === "word") {
        await exportToWord(invoice);
        showToast("Word document (.docx) with header image downloaded!");
      } else if (type === "whatsapp") {
        await shareInvoiceToWhatsApp(invoice, "invoice-print-area");
        showToast("Opening WhatsApp with formatted invoice details...");
      }
    } catch (err: any) {
      console.error(err);
      alert(`Export failed: ${err?.message || "An unexpected error occurred"}`);
    } finally {
      setExporting(null);
    }
  }

  function handlePrint() {
    window.print();
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 pb-12">
      {/* ── TOP ACTION BAR (HIDDEN IN PRINT) ── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 no-print shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
          {/* Back & Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-xs font-semibold bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </button>
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-7 h-7 rounded-md overflow-hidden border border-slate-200 bg-white p-0.5">
                <img src="/logo.png" alt="JSS Enterprise" className="w-full h-full object-contain" />
              </div>
              <span className="font-extrabold text-slate-900 text-xs tracking-wide">JSS ENTERPRISE</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* WhatsApp Direct Share */}
            <button
              onClick={() => handleExport("whatsapp")}
              disabled={!!exporting}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3.5 py-1.5 rounded-lg text-xs transition-all shadow-xs disabled:opacity-50"
              title="Share invoice text and PDF directly to WhatsApp"
            >
              {exporting === "whatsapp" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Share2 className="w-3.5 h-3.5" />
              )}
              <span>Share WhatsApp</span>
            </button>

            {/* PDF Export */}
            <button
              onClick={() => handleExport("pdf")}
              disabled={!!exporting}
              className="flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
              title="Download clean A4 PDF file"
            >
              {exporting === "pdf" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-rose-600" />
              )}
              <span>PDF</span>
            </button>

            {/* Image Export */}
            <button
              onClick={() => handleExport("image")}
              disabled={!!exporting}
              className="flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
              title="Download PNG image"
            >
              {exporting === "image" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileImage className="w-3.5 h-3.5 text-blue-600" />
              )}
              <span>Image</span>
            </button>

            {/* Word Export */}
            <button
              onClick={() => handleExport("word")}
              disabled={!!exporting}
              className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
              title="Download Word (.docx) with top image"
            >
              {exporting === "word" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileType className="w-3.5 h-3.5 text-indigo-600" />
              )}
              <span>Word (.docx)</span>
            </button>

            {/* Print */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              title="Print Bill"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>

            {/* Edit */}
            <Link
              href={`/invoice/${id}/edit`}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-3.5 py-1.5 rounded-lg text-xs transition-all shadow-xs"
              title="Edit and Re-register invoice"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit</span>
            </Link>
          </div>
        </div>

        {/* Success Toast */}
        {toastMessage && (
          <div className="bg-emerald-50 border-t border-emerald-200 px-4 py-2 text-center text-xs font-medium text-emerald-800 flex items-center justify-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
        )}
      </header>

      {/* ── BILL PREVIEW CONTAINER ── */}
      <main className="max-w-5xl mx-auto px-2 sm:px-4 py-6">
        <InvoicePreview invoice={invoice} />
      </main>
    </div>
  );
}
