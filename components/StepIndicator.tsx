
import React from 'react';
import { AppStep } from '../types';

interface StepIndicatorProps {
  currentStep: AppStep;
}

const steps = [
  { id: AppStep.CONFIG, label: 'Auth' },
  { id: AppStep.JSON_DEFINITION, label: 'Layout' },
  { id: AppStep.IMAGE_UPLOAD, label: 'Asset' },
  { id: AppStep.PREVIEW_DEPLOY, label: 'Launch' },
];

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  return (
    <div className="flex items-center justify-between mb-5 px-4 md:px-0">
      {steps.map((step, idx) => (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center flex-1">
            <div 
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                currentStep >= step.id 
                  ? 'bg-[#06C755] text-white ring-4 ring-[#06C755]/10 shadow-lg' 
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {currentStep > step.id ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                idx + 1
              )}
            </div>
            <span className={`mt-2 text-xs font-semibold uppercase tracking-wider ${
              currentStep === step.id ? 'text-[#06C755]' : 'text-slate-400'
            }`}>
              {step.label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div className={`h-0.5 flex-1 mx-2 transition-all duration-500 ${
              currentStep > step.id ? 'bg-[#06C755]' : 'bg-slate-200'
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default StepIndicator;
