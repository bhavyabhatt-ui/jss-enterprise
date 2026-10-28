"use client";

import { useEffect, useRef, useState } from "react";
import InvoicePreview from "@/components/InvoicePreview";
import { Invoice } from "@/types/invoice";
import { ZoomIn, Maximize2 } from "lucide-react";

interface Props {
  invoice: Invoice;
}

export default function ResponsiveInvoiceViewer({ invoice }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [isFitToScreen, setIsFitToScreen] = useState(true);
  const [measuredHeight, setMeasuredHeight] = useState(1150);

  useEffect(() => {
    function updateDimensions() {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth;

      // Measure real unscaled height of invoice-print-area
      const printElement = document.getElementById("invoice-print-area");
      if (printElement) {
        setMeasuredHeight(printElement.scrollHeight || 1150);
      }

      if (containerWidth < 800 && isFitToScreen) {
        const newScale = Math.min(1, Math.max(0.3, (containerWidth - 4) / 800));
        setScale(newScale);
      } else {
        setScale(1);
      }
    }

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    const timer = setTimeout(updateDimensions, 100);

    return () => {
      window.removeEventListener("resize", updateDimensions);
      clearTimeout(timer);
    };
  }, [isFitToScreen, invoice]);

  return (
    <div className="w-full flex flex-col items-center">
      {/* Mobile View Toggle Bar */}
      <div className="w-full flex justify-between items-center mb-2 px-1 sm:hidden no-print">
        <span className="text-[11px] font-semibold text-slate-500">
          {isFitToScreen ? "Mobile Fit View (Full Page)" : "Zoomed 100% (Slide View)"}
        </span>
        <button
          type="button"
          onClick={() => setIsFitToScreen((prev) => !prev)}
          className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs transition-all"
        >
          {isFitToScreen ? (
            <>
              <ZoomIn className="w-3.5 h-3.5 text-amber-600" />
              <span>Zoom 100%</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5 text-amber-600" />
              <span>Fit Screen</span>
            </>
          )}
        </button>
      </div>

      {/* Scaling Container */}
      <div
        ref={containerRef}
        className={`w-full flex justify-center transition-all ${
          isFitToScreen && scale < 1 ? "overflow-hidden" : "overflow-x-auto pb-4"
        }`}
        style={
          scale < 1 && isFitToScreen
            ? {
                height: `${Math.ceil((measuredHeight + 10) * scale)}px`,
              }
            : undefined
        }
      >
        <div
          style={
            scale < 1 && isFitToScreen
              ? {
                  width: "800px",
                  transform: `scale(${scale})`,
                  transformOrigin: "top center",
                }
              : { width: "800px" }
          }
          className="shrink-0 transition-transform duration-200"
        >
          <InvoicePreview invoice={invoice} />
        </div>
      </div>
    </div>
  );
}
