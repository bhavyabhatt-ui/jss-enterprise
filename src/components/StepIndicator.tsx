"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { Step } from "@/types/invoice";

interface Props {
  currentStep: Step;
  steps: string[];
}

export default function StepIndicator({ currentStep, steps }: Props) {
  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex items-center min-w-max mx-auto px-2">
        {steps.map((label, idx) => {
          const stepNum = (idx + 1) as Step;
          const isCompleted = currentStep > stepNum;
          const isActive = currentStep === stepNum;

          return (
            <div key={idx} className="flex items-center">
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                    isCompleted
                      ? "bg-green-500 text-white"
                      : isActive
                      ? "bg-yellow-400 text-slate-900 ring-4 ring-yellow-400/20"
                      : "bg-slate-700 text-slate-400 border border-slate-600"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <span>{stepNum}</span>
                  )}
                </div>
                <span
                  className={`text-xs mt-1.5 font-medium whitespace-nowrap ${
                    isActive
                      ? "text-yellow-400"
                      : isCompleted
                      ? "text-green-400"
                      : "text-slate-500"
                  }`}
                >
                  {label}
                </span>
              </div>

              {/* Connector line */}
              {idx < steps.length - 1 && (
                <div
                  className={`w-12 sm:w-16 md:w-20 h-0.5 mx-2 mb-5 transition-all duration-500 ${
                    currentStep > stepNum ? "bg-green-500" : "bg-slate-700"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
