"use client";

import { useEffect, useRef, useState } from "react";
import InvoicePreview from "@/components/InvoicePreview";
import MobileInvoiceCardView from "@/components/MobileInvoiceCardView";
import { Invoice } from "@/types/invoice";
import {
  Smartphone,
  FileText,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
} from "lucide-react";

interface Props {
  invoice: Invoice;
}

export default function ResponsiveInvoiceViewer({ invoice }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Default to mobile view on small screens, official A4 sheet on desktop
  const [activeTab, setActiveTab] = useState<"mobile" | "a4">("mobile");
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(false);

  useEffect(() => {
    function checkScreen() {
      const isMobile = window.innerWidth < 768;
      setIsMobileScreen(isMobile);
      // Auto-set default based on screen size on initial mount
      if (!isMobile) {
        setActiveTab("a4");
        setZoomLevel(1);
      }
    }

    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  const handleZoomIn = () => setZoomLevel((z) => Math.min(1.5, Math.round((z + 0.15) * 100) / 100));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.45, Math.round((z - 0.15) * 100) / 100));
  const handleResetZoom = () => setZoomLevel(1);
  const handleFitWidth = () => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth - 16;
      const fitScale = Math.min(1, Math.max(0.4, containerWidth / 800));
      setZoomLevel(Math.round(fitScale * 100) / 100);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* ── MOBILE / DESKTOP VIEW TOGGLE (ON MOBILE SCREENS) ── */}
      <div className="w-full max-w-xl flex items-center justify-between mb-4 no-print">
        {isMobileScreen && (
          <div className="bg-slate-200/80 p-1 rounded-xl flex items-center gap-1 w-full shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab("mobile")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${activeTab === "mobile"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
                }`}
            >
              <Smartphone className="w-4 h-4 text-amber-500" />
              <span>📱 Mobile Card View</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("a4");
                handleFitWidth();
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${activeTab === "a4"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
                }`}
            >
              <FileText className="w-4 h-4 text-sky-600" />
              <span>📄 Official A4 Sheet</span>
            </button>
          </div>
        )}
      </div>

      {/* ── TAB CONTENT: MOBILE CARD VIEW ── */}
      {isMobileScreen && activeTab === "mobile" && (
        <div className="w-full">
          <MobileInvoiceCardView invoice={invoice} />
        </div>
      )}

      {/* ── TAB CONTENT: OFFICIAL A4 SHEET VIEW ── */}
      {(!isMobileScreen || activeTab === "a4") && (
        <div className="w-full flex flex-col items-center">
          {/* Zoom controls for A4 sheet view */}
          {isMobileScreen && (
            <div className="w-full max-w-xl flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs mb-3 text-xs no-print">
              <span className="font-semibold text-slate-600">
                Zoom: <strong className="text-slate-900">{Math.round(zoomLevel * 100)}%</strong>
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleFitWidth}
                  className="px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-slate-700"
                >
                  Fit
                </button>
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-slate-700"
                >
                  100%
                </button>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          <div
            ref={containerRef}
            className="w-full flex justify-center overflow-x-auto pb-6"
          >
            <div
              style={{
                width: "800px",
                transform: zoomLevel !== 1 ? `scale(${zoomLevel})` : undefined,
                transformOrigin: "top center",
                marginBottom: zoomLevel < 1 ? `-${Math.round((1 - zoomLevel) * 1150)}px` : undefined,
              }}
              className="shrink-0 transition-transform duration-150"
            >
              <InvoicePreview invoice={invoice} />
            </div>
          </div>
        </div>
      )}

      {/* ── HIDDEN / OFF-SCREEN ANCHOR FOR PDF/IMAGE/PRINT CAPTURE ── */}
      {/* If mobile card view is active, ensure #invoice-print-area remains rendered in DOM for capture */}
      {isMobileScreen && activeTab === "mobile" && (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            left: "-9999px",
            top: "0",
            width: "800px",
            pointerEvents: "none",
            zIndex: -9999,
          }}
        >
          <InvoicePreview invoice={invoice} />
        </div>
      )}
    </div>
  );
}
