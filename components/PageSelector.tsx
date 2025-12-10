import React, { useState, useRef } from 'react';
import { Slide } from '../types';
import { CheckCircle2, FileUp, Lock, LogIn, CheckSquare, Square } from 'lucide-react';

interface PageSelectorProps {
  slides: Slide[];
  onToggleSlide: (id: string) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isProcessing: boolean;
  // Admin Login Props
  isLoggedIn: boolean;
  password: string;
  loginError: boolean;
  onPasswordChange: (value: string) => void;
  onLogin: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  // Select All/None Props
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export const PageSelector: React.FC<PageSelectorProps> = ({
  slides,
  onToggleSlide,
  onFileUpload,
  isProcessing,
  isLoggedIn,
  password,
  loginError,
  onPasswordChange,
  onLogin,
  onKeyPress,
  onSelectAll,
  onDeselectAll
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag and Drop Handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isProcessing && isLoggedIn) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (isProcessing || !isLoggedIn) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      // Create a synthetic event to pass to onFileUpload
      const dataTransfer = new DataTransfer();
      Array.from(files).forEach(file => dataTransfer.items.add(file));

      if (fileInputRef.current) {
        fileInputRef.current.files = dataTransfer.files;
        const event = {
          target: fileInputRef.current
        } as React.ChangeEvent<HTMLInputElement>;
        onFileUpload(event);
      }
    }
  };

  return (
    <div
      className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-colors"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      {isDragging && isLoggedIn && (
        <div className="absolute inset-0 z-50 bg-blue-500/20 dark:bg-blue-400/20 backdrop-blur-sm flex items-center justify-center border-4 border-dashed border-blue-500 dark:border-blue-400 rounded-lg m-2">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-2xl text-center">
            <FileUp className="w-16 h-16 text-blue-500 dark:text-blue-400 mx-auto mb-4 animate-bounce" />
            <p className="text-xl font-bold text-blue-700 dark:text-blue-300">파일을 여기에 놓으세요</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">PDF 또는 이미지 파일</p>
          </div>
        </div>
      )}

      {/* Admin Login Section */}
      {!isLoggedIn && (
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <Lock className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">관리자 접속</span>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              onKeyPress={onKeyPress}
              placeholder="••••••••"
              className={`w-full px-4 py-3 rounded-lg border text-sm mb-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-white
                ${loginError
                  ? 'border-red-400 focus:ring-red-500'
                  : 'border-slate-200 dark:border-slate-600 focus:ring-blue-500'}
                focus:outline-none focus:ring-2
              `}
            />
            {loginError && (
              <p className="text-xs text-red-500 mb-2">비밀번호가 올바르지 않습니다.</p>
            )}
            <button
              onClick={onLogin}
              className="w-full py-3 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              로그인
            </button>
          </div>
        </div>
      )}

      {/* Header / Upload - Only visible when logged in */}
      {isLoggedIn && (
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <label className={`
            flex items-center justify-center gap-2 w-full py-4 px-4 rounded-xl border-2 border-dashed
            transition-all cursor-pointer shadow-sm
            ${isProcessing
              ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-50'
              : isDragging
                ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-400 dark:border-blue-500 scale-[1.02]'
                : 'bg-blue-50 dark:bg-slate-800 border-blue-200 dark:border-slate-700 hover:bg-blue-100 dark:hover:bg-slate-700 hover:border-blue-300'}
          `}>
            <FileUp className={`w-6 h-6 ${isDragging ? 'text-blue-500 animate-bounce' : 'text-blue-600 dark:text-blue-400'}`} />
            <div className="flex flex-col items-start">
               <span className="font-bold text-blue-700 dark:text-blue-400 text-base">
                  {isProcessing ? '파일 분석 중...' : '파일 업로드'}
               </span>
               <span className="text-xs text-blue-500 dark:text-slate-400 font-medium mt-0.5">
                 PDF (1개) 또는 이미지 (최대 20장) · 끌어다 놓기 가능
               </span>
            </div>
            <input
              ref={fileInputRef}
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
               {slides.filter(s => s.selected).length} / {slides.length}
             </span>
          </div>

          {/* Select All / Deselect All Buttons */}
          {slides.length > 0 && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={onSelectAll}
                className={`flex-1 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all
                  ${slides.every(s => s.selected)
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-slate-700 hover:bg-blue-100 dark:hover:bg-slate-700'}
                `}
              >
                <CheckSquare className="w-4 h-4" />
                모두 선택
              </button>
              <button
                onClick={onDeselectAll}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                <Square className="w-4 h-4" />
                해제
              </button>
            </div>
          )}
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50/50 dark:bg-slate-950/50">
        {!isLoggedIn ? (
           <div className="text-center py-20 text-slate-400 dark:text-slate-600">
              <Lock className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">관리자로 로그인해주세요.</p>
           </div>
        ) : slides.length === 0 ? (
           <div className="text-center py-20 text-slate-400 dark:text-slate-600">
              <FileUp className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">위 버튼을 눌러<br/>파일을 업로드하세요.</p>
              <p className="text-xs mt-2 opacity-70">또는 파일을 끌어다 놓으세요</p>
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