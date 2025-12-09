import React, { useState, useEffect } from 'react';
import { Loader2, Wand2, Download, RefreshCcw, FileText, Presentation, LayoutTemplate, Image as ImageIcon, Moon, Sun } from 'lucide-react';
import { Slide, GenerationConfig, SlideContent, GenerationMode } from './types';
import { processFileToSlides, saveImageToPdf, saveImageToPptx, createEditablePresentation } from './services/pdfService';
import { generateInfographic, generateSlideContent } from './services/geminiService';
import { PageSelector } from './components/PageSelector';
import { StyleSelector } from './components/StyleSelector';

const App: React.FC = () => {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  // Generation Configuration State
  const [config, setConfig] = useState<GenerationConfig>({
    mode: 'infographic',
    language: '한국어 (Korean)',
    selectedStyleId: 'dynamic-glassmorphism',
    sizeOption: 'presentation-wide'
  });

  // Result State
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedSlideContent, setGeneratedSlideContent] = useState<SlideContent | null>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);

  // Dark Mode Effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // --- Handlers ---

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    try {
      const firstFile = files[0];

      // Case 1: PDF (Single File Limit)
      if (firstFile.type === 'application/pdf') {
        if (files.length > 1) {
          alert('PDF 파일은 한 번에 하나만 업로드할 수 있습니다.');
          setIsProcessing(false);
          e.target.value = '';
          return;
        }
        const extractedSlides = await processFileToSlides(firstFile);
        setSlides(extractedSlides);
      } 
      // Case 2: Images (Multiple up to 20)
      else if (firstFile.type.startsWith('image/')) {
        const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
        
        if (imageFiles.length === 0) {
           alert('지원되지 않는 파일 형식입니다.');
           setIsProcessing(false);
           return;
        }

        if (imageFiles.length > 20) {
          alert('이미지는 한 번에 최대 20장까지만 업로드 가능합니다. 첫 20장만 처리됩니다.');
          imageFiles.splice(20);
        }

        // Process all images
        const results = await Promise.all(imageFiles.map(file => processFileToSlides(file)));
        const allSlides = results.flat();
        
        // Re-index slides sequentially
        const reindexedSlides = allSlides.map((slide, idx) => ({
            ...slide,
            pageIndex: idx + 1
        }));

        setSlides(reindexedSlides);
      } else {
        alert('지원되지 않는 파일 형식입니다. PDF 또는 이미지 파일을 선택해주세요.');
      }

      setGeneratedImage(null);
      setGeneratedSlideContent(null);
    } catch (error) {
      console.error(error);
      alert('파일 처리에 실패했습니다. PDF나 이미지 파일을 확인해주세요.');
    } finally {
      setIsProcessing(false);
      // Reset input to allow same file selection again
      e.target.value = '';
    }
  };

  const toggleSlideSelection = (id: string) => {
    setSlides(prev => prev.map(slide => 
      slide.id === id ? { ...slide, selected: !slide.selected } : slide
    ));
  };

  const updateConfig = (newConfig: Partial<GenerationConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const handleGenerate = async (mode: GenerationMode) => {
    const selectedSlides = slides.filter(s => s.selected);
    if (selectedSlides.length === 0) {
        alert("최소 한 페이지 이상 선택해주세요.");
        return;
    }
    
    // Update config mode to reflect current action (affects preview rendering)
    setConfig(prev => ({ ...prev, mode: mode }));

    setIsGenerating(true);
    // Clear previous results based on mode, or clear both
    setGeneratedImage(null);
    setGeneratedSlideContent(null);

    try {
      if (mode === 'infographic') {
          const resultUrl = await generateInfographic(selectedSlides, config);
          if (resultUrl) {
            setGeneratedImage(resultUrl);
          } else {
            alert("이미지 생성에 실패했습니다.");
          }
      } else {
          // Presentation Mode
          const content = await generateSlideContent(selectedSlides, config);
          if (content) {
             setGeneratedSlideContent(content);
          } else {
             alert("슬라이드 내용 생성에 실패했습니다.");
          }
      }
    } catch (e) {
      console.error(e);
      alert("생성 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Header */}
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 z-20 shadow-sm relative">
         <div className="flex items-center gap-3">
             <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md">
                 <FileText className="w-5 h-5" />
             </div>
             <div className="hidden sm:block">
                <h1 className="font-bold text-xl tracking-tight leading-none text-slate-900 dark:text-white">
                  인포그래픽 <span className="text-blue-600 dark:text-blue-400">AI</span>
                </h1>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">Gemini 3.0 Pro Edition</p>
             </div>
         </div>

         {/* Center Logo - Typography Driven */}
         <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
             <span className="text-2xl md:text-3xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-400 dark:to-indigo-300 uppercase drop-shadow-sm whitespace-nowrap">
                 JJ CREATIVE 교육연구소
             </span>
         </div>

         <div className="flex items-center gap-4">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-4 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                System Ready
            </div>
         </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        
        {/* Left Column: Source (400px fixed) */}
        <aside className="w-[400px] shrink-0 h-full z-10 shadow-lg relative bg-white dark:bg-slate-900">
           <PageSelector 
              slides={slides} 
              onToggleSlide={toggleSlideSelection} 
              onFileUpload={handleFileUpload}
              isProcessing={isProcessing}
           />
        </aside>

        {/* Middle Column: Controls (350px fixed) */}
        <section className="w-[350px] shrink-0 h-full z-10 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
           <StyleSelector config={config} onUpdateConfig={updateConfig} />
        </section>

        {/* Right Column: Preview & Action (Fluid) */}
        <section className="flex-1 bg-slate-100 dark:bg-slate-950 flex flex-col h-full relative transition-colors">
           
           {/* Canvas Area */}
           <div className="flex-1 p-8 flex items-center justify-center overflow-auto">
              {isGenerating ? (
                  <div className="text-center p-12 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
                     <div className="relative w-20 h-20 mx-auto mb-6">
                        <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-700 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-blue-600 dark:border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                     </div>
                     <h2 className="text-2xl font-bold text-slate-800 dark:text-white animate-pulse mb-2">
                         {config.mode === 'infographic' ? '이미지 생성 중...' : '슬라이드 분석 중...'}
                     </h2>
                     <p className="text-sm text-slate-500 dark:text-slate-400">
                         {config.mode === 'infographic' ? 'Gemini 3.0 Pro가 디자인을 그리고 있습니다.' : 'Gemini 3.0 Pro가 내용을 구조화하고 있습니다.'}
                     </p>
                  </div>
              ) : (config.mode === 'infographic' && generatedImage) ? (
                  <div className="relative w-full h-full flex items-center justify-center group">
                      <img 
                        src={generatedImage} 
                        alt="Generated Infographic" 
                        className="max-w-full max-h-full object-contain shadow-2xl rounded-lg bg-white" 
                      />
                  </div>
              ) : (config.mode === 'presentation' && generatedSlideContent) ? (
                  <div className="bg-white aspect-video w-full max-w-4xl shadow-2xl rounded-lg p-12 flex flex-col justify-between border border-slate-200 text-slate-900">
                      {/* Live Preview of Slide Content */}
                      <div>
                          <h1 className="text-4xl font-bold text-slate-900 mb-2">{generatedSlideContent.title}</h1>
                          {generatedSlideContent.subtitle && (
                              <h2 className="text-xl text-slate-500 mb-8 font-medium">{generatedSlideContent.subtitle}</h2>
                          )}
                          <div className="space-y-4">
                              {generatedSlideContent.bodyPoints.map((point, i) => (
                                  <div key={i} className="flex gap-3 text-lg text-slate-700">
                                      <span className="text-blue-500 font-bold">•</span>
                                      <span>{point}</span>
                                  </div>
                              ))}
                          </div>
                      </div>
                      <div className="mt-8 bg-slate-50 p-4 rounded border border-slate-100">
                          <p className="text-sm text-slate-600 italic">"{generatedSlideContent.summary}"</p>
                      </div>
                      {generatedSlideContent.footer && (
                          <div className="text-center text-sm text-slate-400 mt-4 border-t pt-2">
                              {generatedSlideContent.footer}
                          </div>
                      )}
                  </div>
              ) : (
                  <div className="text-center text-slate-400 dark:text-slate-600">
                     <div className="w-24 h-24 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                        {config.mode === 'infographic' ? <ImageIcon className="w-10 h-10 opacity-30" /> : <LayoutTemplate className="w-10 h-10 opacity-30" />}
                     </div>
                     <p className="text-lg font-medium">슬라이드를 선택하고<br/>아래의 생성 버튼을 눌러주세요.</p>
                  </div>
              )}
           </div>

           {/* Bottom Action Bar */}
           <div className="h-24 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
              
              {/* Left: Download Options (Visible only when result exists) */}
              <div className="flex flex-col">
                  {(generatedImage || generatedSlideContent) ? (
                    <>
                         <span className="text-xs text-slate-400 font-medium mb-1">결과물 저장</span>
                         <div className="flex gap-3">
                            {config.mode === 'infographic' ? (
                                <>
                                    <button 
                                       onClick={() => generatedImage && saveImageToPdf(generatedImage, 'Infographic.pdf')}
                                       className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-sm transition-colors"
                                    >
                                       <Download className="w-4 h-4" /> PDF 저장
                                    </button>
                                    <button 
                                       onClick={() => generatedImage && saveImageToPptx(generatedImage, 'Infographic.pptx')}
                                       className="flex items-center gap-2 px-5 py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg font-bold text-sm transition-colors"
                                    >
                                       <Presentation className="w-4 h-4" /> PPTX (이미지)
                                    </button>
                                </>
                            ) : (
                                <button 
                                   onClick={() => generatedSlideContent && createEditablePresentation(generatedSlideContent, 'Slide.pptx')}
                                   className="flex items-center gap-2 px-6 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-bold text-sm transition-colors"
                                >
                                   <Presentation className="w-4 h-4" /> PPTX (편집 가능) 저장
                                </button>
                            )}
                         </div>
                    </>
                  ) : (
                      <div className="text-xs text-slate-400 dark:text-slate-600">
                          생성된 결과물이 여기에 표시됩니다.
                      </div>
                  )}
              </div>

              {/* Right: Dual Generate Buttons */}
              <div className="flex items-center gap-4">
                 
                 {/* Infographic Button */}
                 <button 
                    onClick={() => handleGenerate('infographic')}
                    disabled={isGenerating || slides.filter(s => s.selected).length === 0}
                    className={`
                       flex items-center gap-3 px-6 py-3.5 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all
                       ${isGenerating 
                         ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed shadow-none' 
                         : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700'}
                    `}
                 >
                    <ImageIcon className="w-5 h-5" />
                    인포그래픽 생성하기
                 </button>
                 
                 {/* PPT Slide Button */}
                 <button 
                    onClick={() => handleGenerate('presentation')}
                    disabled={isGenerating || slides.filter(s => s.selected).length === 0}
                    className={`
                       flex items-center gap-3 px-6 py-3.5 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all
                       ${isGenerating 
                         ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed shadow-none' 
                         : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700'}
                    `}
                 >
                    <LayoutTemplate className="w-5 h-5" />
                    PPT 슬라이드 생성 (Google Slide)
                 </button>
              </div>
           </div>
        </section>

      </main>
    </div>
  );
};

export default App;