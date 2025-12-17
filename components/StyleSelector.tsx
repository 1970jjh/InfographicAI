
import React, { useRef, useState } from 'react';
import { INFOGRAPHIC_STYLES, SIZE_OPTIONS, COLOR_OPTIONS } from '../data/styles';
import { GenerationConfig, InfographicStyle } from '../types';
import { Upload, Check, ChevronDown, Info, X, FileText } from 'lucide-react';

interface StyleSelectorProps {
  config: GenerationConfig;
  onUpdateConfig: (newConfig: Partial<GenerationConfig>) => void;
}

const LANGUAGES = [
  '한국어 (Korean)',
  '영어 (English)',
  '한국어 + 영어 (Mixed)',
  '일본어 (Japanese)',
  '중국어 (Chinese)',
  '프랑스어 (French)',
  '스페인어 (Spanish)'
];

export const StyleSelector: React.FC<StyleSelectorProps> = ({ config, onUpdateConfig }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Modal State
  const [selectedPreviewStyle, setSelectedPreviewStyle] = useState<InfographicStyle | null>(null);

  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateConfig({ 
            selectedStyleId: 'custom',
            customStyleImage: reader.result as string 
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-white dark:bg-slate-900 transition-colors relative">
       <div className="p-5 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 z-10">
          <h2 className="font-bold text-slate-800 dark:text-slate-100 text-base uppercase tracking-wider">설정 (Configuration)</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
             스타일과 색상, 언어, 사이즈를 설정하세요.
          </p>
       </div>
       
       <div className="flex-1 overflow-y-auto p-5 space-y-8 pb-20">
          
          {/* Language & Size Row */}
          <div className="grid grid-cols-1 gap-6">
             {/* Language */}
             <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block">언어 (Language)</label>
                <div className="relative">
                   <select 
                     value={config.language}
                     onChange={(e) => onUpdateConfig({ language: e.target.value })}
                     className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-3 px-4 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                   >
                     {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                   </select>
                   <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
             </div>

             {/* Size */}
             <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block">사이즈 (Size)</label>
                <div className="grid grid-cols-2 gap-2">
                  {SIZE_OPTIONS.map((size) => (
                     <button
                       key={size.id}
                       onClick={() => onUpdateConfig({ sizeOption: size.id })}
                       className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all min-h-[70px]
                         ${config.sizeOption === size.id 
                           ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                           : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-750 hover:border-slate-300'}
                       `}
                     >
                       <span className="text-xs font-bold block mb-1">{size.label}</span>
                       <span className={`text-[10px] ${config.sizeOption === size.id ? 'text-blue-200' : 'text-slate-400'}`}>
                         {size.subLabel}
                       </span>
                     </button>
                  ))}
                </div>
             </div>

             {/* Color Tone */}
             <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block">색상 & 톤 (Color & Tone)</label>
                    <button 
                        onClick={() => onUpdateConfig({ selectedColor: undefined })}
                        className="text-[10px] text-slate-500 hover:text-blue-600 underline"
                    >
                        AI 자동 선택 (Reset)
                    </button>
                </div>
                <div className="grid grid-cols-8 gap-2">
                    {COLOR_OPTIONS.map((color) => (
                        <button
                            key={color.id}
                            onClick={() => onUpdateConfig({ 
                                // Toggle behavior: if already selected, deselect
                                selectedColor: config.selectedColor === color.name ? undefined : color.name 
                            })}
                            className={`
                                w-full aspect-square rounded-full shadow-sm transition-all relative flex items-center justify-center
                                ${color.class}
                                ${config.selectedColor === color.name 
                                    ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-slate-500 scale-110 z-10' 
                                    : 'hover:scale-110 hover:shadow-md'}
                            `}
                            title={color.name}
                        >
                            {config.selectedColor === color.name && (
                                <Check className={`w-3 h-3 ${['White', 'Yellow', 'Warm Tone'].includes(color.name) ? 'text-black' : 'text-white'}`} />
                            )}
                        </button>
                    ))}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                   {config.selectedColor ? `선택됨: ${config.selectedColor}` : '선택하지 않으면 AI가 자동으로 어울리는 색상을 결정합니다.'}
                </div>
             </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Style Section */}
          <div className="space-y-3">
               <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block">디자인 스타일 (Style)</label>
                  <div className="flex items-center gap-1 text-[10px]">
                     <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded font-bold">메인</span>
                     {config.subStyleId && (
                        <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded font-bold">+서브</span>
                     )}
                  </div>
               </div>

               {/* Style Selection Guide */}
               <div className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                  💡 스타일을 클릭하면 <strong>메인/서브</strong> 중 선택할 수 있어요
               </div>

               {/* Custom Upload Button */}
               <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`cursor-pointer border border-dashed rounded-xl p-4 flex items-center justify-center gap-2 transition-all mb-3
                    ${config.selectedStyleId === 'custom'
                      ? 'bg-blue-50 dark:bg-slate-800 border-blue-400 text-blue-700 dark:text-blue-400'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-750'}
                  `}
               >
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleCustomImageUpload} />
                  <Upload className="w-4 h-4" />
                  <span className="text-xs font-bold">
                     {config.selectedStyleId === 'custom' && config.customStyleImage ? '맞춤형 이미지 변경' : '맞춤형 스타일 업로드'}
                  </span>
               </div>

               {/* Style Grid */}
               <div className="grid grid-cols-2 gap-2.5">
                  {INFOGRAPHIC_STYLES.map((style) => {
                     const isMainStyle = config.selectedStyleId === style.id;
                     const isSubStyle = config.subStyleId === style.id;

                     return (
                       <div
                         key={style.id}
                         onClick={() => setSelectedPreviewStyle(style)}
                         className={`cursor-pointer rounded-xl p-3 border text-left transition-all relative group overflow-hidden
                           ${isMainStyle
                             ? 'bg-blue-50 dark:bg-slate-800 border-blue-500 ring-2 ring-blue-500'
                             : isSubStyle
                               ? 'bg-purple-50 dark:bg-slate-800 border-purple-500 ring-2 ring-purple-500'
                               : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'}
                         `}
                       >
                         {/* Mini Preview Image in Grid if available, dimmed */}
                         {style.previewImage && (
                            <div className="absolute inset-0 z-0 opacity-0 group-hover:opacity-10 transition-opacity">
                                <img src={style.previewImage} alt="" className="w-full h-full object-cover grayscale" />
                            </div>
                         )}

                         <div className="relative z-10">
                             <div className="font-bold text-xs text-slate-800 dark:text-slate-200 mb-1 pr-8">{style.name}</div>
                             <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight tracking-tight opacity-70 group-hover:opacity-100 transition-opacity">
                                  {style.description}
                             </div>
                         </div>

                         {/* Main Style Indicator */}
                         {isMainStyle && (
                            <div className="absolute top-2 right-2 text-white bg-blue-600 dark:bg-blue-500 rounded-full px-1.5 py-0.5 shadow-sm z-20 text-[9px] font-bold">
                               메인
                            </div>
                         )}

                         {/* Sub Style Indicator */}
                         {isSubStyle && (
                            <div className="absolute top-2 right-2 text-white bg-purple-600 dark:bg-purple-500 rounded-full px-1.5 py-0.5 shadow-sm z-20 text-[9px] font-bold">
                               서브
                            </div>
                         )}

                         {/* Info Icon hint */}
                         {!isMainStyle && !isSubStyle && (
                           <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                <Info className="w-3 h-3 text-slate-400" />
                           </div>
                         )}
                       </div>
                     );
                  })}
               </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Custom Instructions Section */}
          <div className="space-y-3">
               <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">중요 지침 (Custom Instructions)</label>
               </div>
               <div className="bg-amber-50/50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                  <textarea
                     value={config.customInstructions || ''}
                     onChange={(e) => onUpdateConfig({ customInstructions: e.target.value })}
                     placeholder="인포그래픽 생성 시 반영할 특별한 지침을 입력하세요.&#10;&#10;예시:&#10;- 통계 데이터를 강조해주세요&#10;- 아이콘을 많이 사용해주세요&#10;- 3단 레이아웃으로 구성해주세요&#10;- 핵심 키워드를 크게 표시해주세요"
                     className="w-full h-32 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                  />
                  <div className="text-[10px] text-amber-700 dark:text-amber-400 mt-2 flex items-start gap-1.5">
                     <Info className="w-3 h-3 shrink-0 mt-0.5" />
                     <span>입력한 지침은 AI가 인포그래픽을 생성할 때 우선적으로 반영됩니다.</span>
                  </div>
               </div>
          </div>
       </div>

       {/* Style Detail Modal - Enhanced & Larger */}
       {selectedPreviewStyle && (() => {
        const isCurrentMain = config.selectedStyleId === selectedPreviewStyle.id;
        const isCurrentSub = config.subStyleId === selectedPreviewStyle.id;

        return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={() => setSelectedPreviewStyle(null)}
            />

            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden relative z-10 animate-in fade-in zoom-in duration-300 flex flex-col">

                {/* Close Button */}
                <button
                    onClick={() => setSelectedPreviewStyle(null)}
                    className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white z-20 backdrop-blur-md transition-all"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Current Selection Badge */}
                {(isCurrentMain || isCurrentSub) && (
                    <div className="absolute top-4 left-4 z-20">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold text-white backdrop-blur-md ${isCurrentMain ? 'bg-blue-600' : 'bg-purple-600'}`}>
                            {isCurrentMain ? '현재 메인 스타일' : '현재 서브 스타일'}
                        </span>
                    </div>
                )}

                {/* Hero Image Section (Larger) */}
                <div className="relative h-64 sm:h-80 w-full shrink-0">
                    {selectedPreviewStyle.previewImage ? (
                        <img
                           src={selectedPreviewStyle.previewImage}
                           alt={selectedPreviewStyle.name}
                           className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            <span className="text-white text-opacity-50 font-bold text-4xl">{selectedPreviewStyle.name[0]}</span>
                        </div>
                    )}

                    {/* Gradient Overlay for Text Readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Title Overlay */}
                    <div className="absolute bottom-0 left-0 p-8 w-full">
                        <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-[10px] font-bold text-white mb-2 tracking-wider uppercase">
                            Infographic Style
                        </span>
                        <h3 className="text-3xl sm:text-4xl font-black text-white drop-shadow-lg tracking-tight">
                            {selectedPreviewStyle.name}
                        </h3>
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-8 overflow-y-auto">
                    <div className="prose dark:prose-invert max-w-none">
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-2">스타일 설명</h4>
                        <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
                            {selectedPreviewStyle.longDescription || selectedPreviewStyle.description}
                        </p>
                    </div>

                    {/* Example/Hint box */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 mb-6 flex gap-3">
                        <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                           <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Tip</span>
                           메인 스타일은 기본 디자인을, 서브 스타일은 추가 요소를 결정합니다. 두 스타일을 조합하면 더 독특한 결과물을 얻을 수 있어요!
                        </div>
                    </div>

                    {/* Action Buttons - Main/Sub Selection */}
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            {/* Main Style Button */}
                            <button
                                onClick={() => {
                                    if (isCurrentMain) {
                                        // 이미 메인이면 선택 해제 (기본값으로)
                                        onUpdateConfig({ selectedStyleId: 'brutalism', customStyleImage: undefined });
                                    } else {
                                        // 서브였다면 서브 해제하고 메인으로
                                        if (isCurrentSub) {
                                            onUpdateConfig({ subStyleId: undefined });
                                        }
                                        onUpdateConfig({ selectedStyleId: selectedPreviewStyle.id, customStyleImage: undefined });
                                    }
                                    setSelectedPreviewStyle(null);
                                }}
                                className={`py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all
                                    ${isCurrentMain
                                        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-2 border-blue-500'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg hover:-translate-y-0.5'}
                                `}
                            >
                                <Check className="w-5 h-5" />
                                {isCurrentMain ? '메인 선택 해제' : '메인 스타일로 선택'}
                            </button>

                            {/* Sub Style Button */}
                            <button
                                onClick={() => {
                                    if (isCurrentSub) {
                                        // 이미 서브면 선택 해제
                                        onUpdateConfig({ subStyleId: undefined });
                                    } else if (!isCurrentMain) {
                                        // 메인이 아닐 때만 서브로 설정 가능
                                        onUpdateConfig({ subStyleId: selectedPreviewStyle.id });
                                    }
                                    setSelectedPreviewStyle(null);
                                }}
                                disabled={isCurrentMain}
                                className={`py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all
                                    ${isCurrentMain
                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                        : isCurrentSub
                                            ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border-2 border-purple-500'
                                            : 'bg-purple-600 hover:bg-purple-700 text-white hover:shadow-lg hover:-translate-y-0.5'}
                                `}
                            >
                                <Check className="w-5 h-5" />
                                {isCurrentSub ? '서브 선택 해제' : '서브 스타일로 선택'}
                            </button>
                        </div>

                        {isCurrentMain && (
                            <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                                메인 스타일은 서브로 변경할 수 없습니다. 먼저 선택을 해제해주세요.
                            </p>
                        )}

                        <button
                             onClick={() => setSelectedPreviewStyle(null)}
                             className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl transition-colors text-sm"
                        >
                            닫기
                        </button>
                    </div>
                </div>
            </div>
        </div>
        );
       })()}
    </div>
  );
};
