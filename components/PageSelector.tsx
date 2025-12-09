import React from 'react';
import { Slide } from '../types';
import { CheckCircle2, FileUp } from 'lucide-react';

interface PageSelectorProps {
  slides: Slide[];
  onToggleSlide: (id: string) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isProcessing: boolean;
}

export const PageSelector: React.FC<PageSelectorProps> = ({ slides, onToggleSlide, onFileUpload, isProcessing }) => {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-colors">
      {/* Header / Upload */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <label className={`
          flex items-center justify-center gap-2 w-full py-4 px-4 rounded-xl border-2 border-dashed 
          transition-all cursor-pointer shadow-sm
          ${isProcessing 
            ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-50' 
            : 'bg-blue-50 dark:bg-slate-800 border-blue-200 dark:border-slate-700 hover:bg-blue-100 dark:hover:bg-slate-700 hover:border-blue-300'}
        `}>
          <FileUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <div className="flex flex-col items-start">
             <span className="font-bold text-blue-700 dark:text-blue-400 text-base">
                {isProcessing ? '파일 분석 중...' : '파일 업로드'}
             </span>
             <span className="text-xs text-blue-500 dark:text-slate-400 font-medium mt-0.5">
               PDF (1개) 또는 이미지 (최대 20장)
             </span>
          </div>
          <input 
            type="file" 
            className="hidden" 
            accept=".pdf,.ppt,.pptx,.doc,.docx,image/*"
            multiple 
            onChange={onFileUpload}
            disabled={isProcessing}
          />
        </label>
        
        <div className="mt-6 flex items-center justify-between">
           <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">슬라이드 목록</h2>
           <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-full font-medium">
             총 {slides.length}장 / {slides.filter(s => s.selected).length}장 선택
           </span>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50/50 dark:bg-slate-950/50">
        {slides.length === 0 ? (
           <div className="text-center py-20 text-slate-400 dark:text-slate-600">
              <FileUp className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">왼쪽 위 버튼을 눌러<br/>파일을 업로드하세요.</p>
           </div>
        ) : (
          slides.map((slide) => (
            <div 
              key={slide.id}
              onClick={() => onToggleSlide(slide.id)}
              className={`
                group relative flex flex-col gap-2 p-3 rounded-xl cursor-pointer border-2 transition-all duration-200
                ${slide.selected 
                  ? 'bg-white dark:bg-slate-800 border-blue-600 shadow-lg ring-1 ring-blue-600/10' 
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-600 hover:shadow-md'}
              `}
            >
              {/* Full Width Image Preview */}
              <div className="relative w-full aspect-video bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden shadow-inner">
                <img 
                  src={slide.originalImage} 
                  alt={`Page ${slide.pageIndex}`} 
                  className="w-full h-full object-contain bg-slate-200 dark:bg-slate-950"
                />
                
                {/* Page Number Badge */}
                <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-md">
                  Page {slide.pageIndex}
                </div>

                {/* Selection Overlay */}
                <div className={`absolute inset-0 transition-colors flex items-center justify-center
                   ${slide.selected ? 'bg-blue-600/10' : 'bg-transparent group-hover:bg-slate-900/5 dark:group-hover:bg-white/5'}
                `}>
                   {slide.selected && (
                      <div className="bg-blue-600 text-white p-2 rounded-full shadow-lg transform scale-110">
                         <CheckCircle2 className="w-6 h-6" />
                      </div>
                   )}
                </div>
              </div>
              
              <div className="flex items-center justify-between px-1">
                 <span className={`text-xs font-bold ${slide.selected ? 'text-blue-700 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    {slide.selected ? '분석 대상 포함' : '제외됨'}
                 </span>
                 {slide.selected && <span className="text-[10px] text-blue-500 dark:text-blue-400 font-medium">선택됨</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};