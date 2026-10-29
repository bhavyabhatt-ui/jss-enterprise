"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getInvoiceById, fetchInvoiceById, logoutAdmin } from "@/lib/storage";
import { exportToPDF, exportToImage, exportToWord, shareInvoiceToWhatsApp, printInvoice } from "@/lib/export";
import { Invoice } from "@/types/invoice";
import ResponsiveInvoiceViewer from "@/components/ResponsiveInvoiceViewer";
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
  LogOut,
} from "lucide-react";

type ExportType = "pdf" | "image" | "word" | "whatsapp" | "print" | null;

export default function InvoiceViewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [exporting, setExporting] = useState<ExportType>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      // 1. Instant optimistic load from local storage
      const local = getInvoiceById(id);
      if (local) setInvoice(local);

      // 2. Cross-device server fetch
      fetchInvoiceById(id).then((serverInv) => {
        if (serverInv) {
          setInvoice(serverInv);
        } else if (!local) {
          router.push("/");
        }
      });
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
        showToast("Word document (.docx) downloaded!");
      } else if (type === "whatsapp") {
        await shareInvoiceToWhatsApp(invoice, "invoice-print-area");
        showToast("Opening share dialog with attached PDF & bill details...");
      }
    } catch (err: any) {
      console.error(err);
      alert(`Export failed: ${err?.message || "An unexpected error occurred"}`);
    } finally {
      setExporting(null);
    }
  }

  async function handlePrint() {
    if (!invoice) return;
    setExporting("print");
    const cleanNo = (invoice.invoiceInfo.invoiceNo || invoice.id).replace(/[/\\?%*:|"<>]/g, "-");
    const filename = `Invoice-${cleanNo}`;
    try {
      await printInvoice("invoice-print-area", filename);
      showToast("Generated PDF ready & downloaded!");
    } catch (err: any) {
      console.error(err);
      alert(`Print failed: ${err?.message || "An unexpected error occurred"}`);
    } finally {
      setExporting(null);
    }
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
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3">
          {/* ──── MOBILE HEADER LAYOUT (sm:hidden) ──── */}
          <div className="sm:hidden space-y-2">
            {/* Row 1: Back, Invoice No, Edit */}
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => router.push("/")}
                className="flex items-center gap-1 text-slate-700 hover:text-slate-900 text-xs font-semibold bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
              </button>

              <div className="flex items-center gap-1.5 truncate px-1">
                <div className="w-6 h-6 rounded-md overflow-hidden border border-slate-200 bg-white p-0.5 shrink-0">
                  <img src="/logo.png" alt="JSS Enterprise" className="w-full h-full object-contain" />
                </div>
                <span className="font-extrabold text-slate-900 text-xs tracking-wide truncate">
                  {invoice.invoiceInfo.invoiceNo || "JSS ENTERPRISE"}
                </span>
              </div>

              <Link
                href={`/invoice/${id}/edit`}
                className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-2.5 py-1.5 rounded-lg text-xs transition-all shadow-xs shrink-0"
              >
                <Edit className="w-3 h-3" />
                <span>Edit</span>
              </Link>
            </div>

            {/* Row 2: ALL FILES BUTTONS IN ONE LINE (4 COLUMNS) */}
            <div className="grid grid-cols-4 gap-1.5 w-full">
              {/* PDF */}
              <button
                onClick={() => handleExport("pdf")}
                disabled={!!exporting}
                className="flex items-center justify-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                title="Download clean A4 PDF file"
              >
                {exporting === "pdf" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-rose-600" />
                )}
                <span>PDF</span>
              </button>

              {/* Print */}
              <button
                onClick={handlePrint}
                disabled={!!exporting}
                className="flex items-center justify-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                title="Print generated PDF"
              >
                {exporting === "print" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Printer className="w-3.5 h-3.5 text-indigo-600" />
                )}
                <span>Print</span>
              </button>

              {/* PNG */}
              <button
                onClick={() => handleExport("image")}
                disabled={!!exporting}
                className="flex items-center justify-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                title="Download PNG image"
              >
                {exporting === "image" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileImage className="w-3.5 h-3.5 text-blue-600" />
                )}
                <span>PNG</span>
              </button>

              {/* Word */}
              <button
                onClick={() => handleExport("word")}
                disabled={!!exporting}
                className="flex items-center justify-center gap-1 bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                title="Download Word (.docx) with top image"
              >
                {exporting === "word" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileType className="w-3.5 h-3.5 text-slate-600" />
                )}
                <span>Word</span>
              </button>
            </div>

            {/* Row 3: SHARE WHATSAPP ON WORD FILE SPACE (FULL WIDTH) */}
            <button
              onClick={() => handleExport("whatsapp")}
              disabled={!!exporting}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl text-xs transition-all shadow-xs disabled:opacity-50 active:scale-98"
              title="Share invoice text and PDF directly to WhatsApp"
            >
              {exporting === "whatsapp" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Share2 className="w-3.5 h-3.5" />
              )}
              <span>Share on WhatsApp (PDF &amp; Details)</span>
            </button>
          </div>

          {/* ──── DESKTOP HEADER LAYOUT (hidden sm:flex) ──── */}
          <div className="hidden sm:flex items-center justify-between gap-3">
            {/* Back & Logo */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/")}
                className="flex items-center gap-1.5 text-slate-700 hover:text-slate-900 text-xs font-semibold bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
              </button>

              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="w-7 h-7 rounded-md overflow-hidden border border-slate-200 bg-white p-0.5">
                  <img src="/logo.png" alt="JSS Enterprise" className="w-full h-full object-contain" />
                </div>
                <div>
                  <span className="font-extrabold text-slate-900 text-xs tracking-wide block leading-none">
                    {invoice.invoiceInfo.invoiceNo || "JSS ENTERPRISE"}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">JSS ENTERPRISE</span>
                </div>
              </div>
            </div>

            {/* Action Buttons in single line on desktop */}
            <div className="flex items-center gap-2">
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

              {/* Print with Generated PDF */}
              <button
                onClick={handlePrint}
                disabled={!!exporting}
                className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                title="Print generated PDF"
              >
                {exporting === "print" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Printer className="w-3.5 h-3.5 text-indigo-600" />
                )}
                <span>Print</span>
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
                className="flex items-center gap-1.5 bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                title="Download Word (.docx) with top image"
              >
                {exporting === "word" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileType className="w-3.5 h-3.5 text-slate-600" />
                )}
                <span>Word (.docx)</span>
              </button>

              {/* Edit */}
              <Link
                href={`/invoice/${id}/edit`}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition-all shadow-xs"
                title="Edit and Re-register invoice"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit</span>
              </Link>

              {/* Logout */}
              <button
                type="button"
                onClick={() => logoutAdmin()}
                title="Sign out of Admin"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
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

      {/* ── BILL PREVIEW CONTAINER (RESPONSIVE FIT-TO-SCREEN ON MOBILE, FIXED 800PX IN PRINT/PDF) ── */}
      <main className="max-w-6xl mx-auto px-2 sm:px-4 py-6">
        <ResponsiveInvoiceViewer invoice={invoice} />
      </main>
    </div>
  );
}
