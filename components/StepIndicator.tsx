
import React from 'react';
import { Check } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
}

const steps = [
  { num: 1, label: '파일 업로드' },
  { num: 2, label: '페이지 선택' },
  { num: 3, label: '스타일 설정' },
  { num: 4, label: '결과 확인' },
];

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  return (
    <div className="w-full max-w-3xl mx-auto mb-8">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 -z-10" />
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 -z-10 transition-all duration-500"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />
        
        {steps.map((step) => {
          const isCompleted = currentStep > step.num;
          const isCurrent = currentStep === step.num;
          
          return (
            <div key={step.num} className="flex flex-col items-center bg-white px-2">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all duration-300
                  ${isCompleted ? 'bg-blue-600 border-blue-600 text-white' : 
                    isCurrent ? 'bg-white border-blue-600 text-blue-600' : 'bg-slate-100 border-slate-300 text-slate-400'}
                `}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : step.num}
              </div>
              <span className={`mt-2 text-xs font-medium ${isCurrent ? 'text-blue-700' : 'text-slate-500'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
