"use client";

import { Check, Circle } from "lucide-react";
import { Step } from "@/types/invoice";

interface Props {
  currentStep: Step;
  steps: string[];
}

export default function StepIndicator({ currentStep, steps }: Props) {
  return (
    <div className="w-full bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs mb-6 overflow-x-auto">
      <div className="flex items-center justify-between min-w-[580px] max-w-3xl mx-auto px-4">
        {steps.map((label, idx) => {
          const stepNum = (idx + 1) as Step;
          const isCompleted = currentStep > stepNum;
          const isActive = currentStep === stepNum;

          return (
            <div key={idx} className="flex items-center flex-1 last:flex-none">
              {/* Step Icon & Label */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                    isCompleted
                      ? "bg-emerald-500 text-white shadow-xs"
                      : isActive
                      ? "bg-amber-500 text-white ring-4 ring-amber-100 shadow-xs"
                      : "bg-slate-100 text-slate-400 border border-slate-200"
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : stepNum}
                </div>
                <span
                  className={`text-[11px] mt-1.5 font-medium whitespace-nowrap ${
                    isActive
                      ? "text-amber-700 font-semibold"
                      : isCompleted
                      ? "text-emerald-700"
                      : "text-slate-400"
                  }`}
                >
                  {label}
                </span>
              </div>

              {/* Connecting Bar */}
              {idx < steps.length - 1 && (
                <div className="flex-1 mx-3 h-0.5 mb-5 bg-slate-200 overflow-hidden rounded-full">
                  <div
                    className={`h-full transition-all duration-300 ${
                      currentStep > stepNum ? "bg-emerald-500 w-full" : "w-0"
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
