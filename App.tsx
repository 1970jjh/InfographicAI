import React, { useState, useEffect } from 'react';
import { Download, FileText, Presentation, Image as ImageIcon, Moon, Sun, Plus, Layers, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Slide, GenerationConfig, BatchItem, BatchResult, BatchItemSource } from './types';
import { processFileToSlides, saveImageToPdf, saveImageToPptx } from './services/pdfService';
import { generateInfographic, generateFromWebContent, generateFromTextContent } from './services/geminiService';
import { fetchUrlContent, WebPageContent } from './services/webService';
import { PageSelector } from './components/PageSelector';
import { StyleSelector } from './components/StyleSelector';
import { BatchQueue } from './components/BatchQueue';

const ADMIN_PASSWORD = '6749467';

const App: React.FC = () => {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Admin Login State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsLoggedIn(true);
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  // Generation Configuration State
  const [config, setConfig] = useState<GenerationConfig>({
    mode: 'infographic',
    language: '한국어 (Korean)',
    selectedStyleId: 'dynamic-glassmorphism',
    sizeOption: 'presentation-wide'
  });

  // Result State
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Web Content State
  const [isUrlProcessing, setIsUrlProcessing] = useState(false);
  const [webContent, setWebContent] = useState<{
    title: string;
    content: string;
    url: string;
    type: 'webpage' | 'youtube';
    author?: string;
    thumbnail?: string;
  } | null>(null);

  // Text Content State
  const [textContent, setTextContent] = useState<string | null>(null);

  // Batch Generation State
  const [batchQueue, setBatchQueue] = useState<BatchItem[]>([]);
  const [batchResults, setBatchResults] = useState<BatchResult[]>([]);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [currentResultIndex, setCurrentResultIndex] = useState(0);

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
      const allFiles = Array.from(files);

      // Separate PDF and image files
      const pdfFiles = allFiles.filter(f => f.type === 'application/pdf');
      const imageFiles = allFiles.filter(f => f.type.startsWith('image/'));

      // Check for unsupported files
      const supportedCount = pdfFiles.length + imageFiles.length;
      if (supportedCount === 0) {
        alert('지원되지 않는 파일 형식입니다. PDF 또는 이미지 파일을 선택해주세요.');
        setIsProcessing(false);
        e.target.value = '';
        return;
      }

      // Limit new files to 30 per upload
      const totalFiles = [...pdfFiles, ...imageFiles];
      if (totalFiles.length > 30) {
        alert('파일은 한 번에 최대 30개까지만 업로드 가능합니다. 첫 30개만 처리됩니다.');
        totalFiles.splice(30);
      }

      // Process all files (PDFs and images together)
      const results = await Promise.all(totalFiles.map(file => processFileToSlides(file)));
      const newSlides = results.flat();

      // Append new slides to existing slides and re-index all sequentially
      setSlides(prev => {
        const combinedSlides = [...prev, ...newSlides];
        return combinedSlides.map((slide, idx) => ({
          ...slide,
          pageIndex: idx + 1
        }));
      });
      setGeneratedImage(null);

      // Show summary
      const existingCount = slides.length;
      if (existingCount > 0) {
        console.log(`추가 업로드: 기존 ${existingCount}페이지 + 새로운 ${newSlides.length}페이지`);
      } else if (pdfFiles.length > 0 && imageFiles.length > 0) {
        console.log(`업로드 완료: PDF ${pdfFiles.length}개, 이미지 ${imageFiles.length}개 → 총 ${newSlides.length}페이지`);
      }
    } catch (error) {
      console.error(error);
      alert('파일 처리에 실패했습니다. PDF나 이미지 파일을 확인해주세요.');
    } finally {
      setIsProcessing(false);
      // Reset input to allow same file selection again
      e.target.value = '';
    }
  };

  // URL Handler (supports both webpage and YouTube)
  const handleUrlSubmit = async (url: string) => {
    setIsUrlProcessing(true);
    setWebContent(null);
    setTextContent(null); // Clear text content when using URL

    try {
      const result = await fetchUrlContent(url);

      if (result.success && result.data) {
        setWebContent({
          title: result.data.title,
          content: result.data.content,
          url: result.data.url,
          type: result.data.type,
          author: result.data.author,
          thumbnail: result.data.thumbnail
        });
        // Clear slides when using URL mode
        setSlides([]);
        setGeneratedImage(null);
      } else {
        alert(result.error || 'URL 콘텐츠를 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('URL fetch error:', error);
      alert('URL 콘텐츠를 불러오는데 실패했습니다.');
    } finally {
      setIsUrlProcessing(false);
    }
  };

  // Text Content Handler
  const handleTextSubmit = (text: string) => {
    setTextContent(text);
    setWebContent(null); // Clear web content when using text
    setSlides([]); // Clear slides when using text mode
    setGeneratedImage(null);
  };

  const toggleSlideSelection = (id: string) => {
    setSlides(prev => prev.map(slide =>
      slide.id === id ? { ...slide, selected: !slide.selected } : slide
    ));
  };

  const selectAllSlides = () => {
    setSlides(prev => prev.map(slide => ({ ...slide, selected: true })));
  };

  const deselectAllSlides = () => {
    setSlides(prev => prev.map(slide => ({ ...slide, selected: false })));
  };

  const updateConfig = (newConfig: Partial<GenerationConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  // Infographic Generation Handler
  const handleGenerateInfographic = async () => {
    const selectedSlides = slides.filter(s => s.selected);

    // Check if we have either slides, web content, or text content
    if (selectedSlides.length === 0 && !webContent && !textContent) {
        alert("파일을 업로드하거나 웹페이지 URL 또는 텍스트를 입력해주세요.");
        return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      let resultUrl: string | null = null;

      if (webContent) {
        // Generate from web content
        resultUrl = await generateFromWebContent(webContent, config);
      } else if (textContent) {
        // Generate from text content
        resultUrl = await generateFromTextContent(textContent, config);
      } else {
        // Generate from slides
        resultUrl = await generateInfographic(selectedSlides, config);
      }

      if (resultUrl) {
        setGeneratedImage(resultUrl);
      } else {
        alert("이미지 생성에 실패했습니다.");
      }
    } catch (e) {
      console.error(e);
      alert("생성 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Batch Queue Handlers
  const addToBatchQueue = () => {
    const selectedSlides = slides.filter(s => s.selected);

    if (selectedSlides.length === 0 && !webContent && !textContent) {
      alert("파일을 업로드하거나 웹페이지 URL 또는 텍스트를 입력해주세요.");
      return;
    }

    let source: BatchItemSource;
    let label: string;

    if (webContent) {
      source = { type: 'web', content: webContent };
      label = webContent.type === 'youtube'
        ? `유튜브: ${webContent.title?.substring(0, 30) || 'Untitled'}...`
        : `웹페이지: ${webContent.title?.substring(0, 30) || 'Untitled'}...`;
    } else if (textContent) {
      source = { type: 'text', content: textContent };
      label = `텍스트: ${textContent.substring(0, 30)}...`;
    } else {
      source = {
        type: 'slides',
        slideIds: selectedSlides.map(s => s.id),
        thumbnails: selectedSlides.slice(0, 3).map(s => s.originalImage)
      };
      label = `슬라이드 ${selectedSlides.length}장 (p.${selectedSlides.map(s => s.pageIndex).join(', ')})`;
    }

    const newBatchItem: BatchItem = {
      id: `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source,
      config: { ...config },
      label,
      createdAt: Date.now()
    };

    setBatchQueue(prev => [...prev, newBatchItem]);

    // 선택 해제하여 다음 선택 준비
    deselectAllSlides();
    setWebContent(null);
    setTextContent(null);
  };

  const removeFromBatchQueue = (id: string) => {
    setBatchQueue(prev => prev.filter(item => item.id !== id));
  };

  const clearBatchQueue = () => {
    setBatchQueue([]);
  };

  // 배치 일괄 생성
  const handleBatchGenerate = async () => {
    if (batchQueue.length === 0) {
      alert("생성할 항목이 없습니다. 먼저 큐에 추가해주세요.");
      return;
    }

    setIsBatchGenerating(true);
    setBatchResults([]);
    setBatchProgress({ current: 0, total: batchQueue.length });
    setCurrentResultIndex(0);

    const results: BatchResult[] = [];

    for (let i = 0; i < batchQueue.length; i++) {
      const item = batchQueue[i];
      setBatchProgress({ current: i + 1, total: batchQueue.length });

      try {
        let resultUrl: string | null = null;

        if (item.source.type === 'web') {
          resultUrl = await generateFromWebContent(item.source.content, item.config);
        } else if (item.source.type === 'text') {
          resultUrl = await generateFromTextContent(item.source.content, item.config);
        } else {
          // slides
          const slidesToGenerate = slides.filter(s => item.source.slideIds.includes(s.id));
          if (slidesToGenerate.length > 0) {
            resultUrl = await generateInfographic(slidesToGenerate, item.config);
          }
        }

        if (resultUrl) {
          results.push({
            id: `result-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            batchItemId: item.id,
            imageUrl: resultUrl,
            label: item.label,
            createdAt: Date.now()
          });
        }
      } catch (e) {
        console.error(`배치 항목 ${i + 1} 생성 실패:`, e);
      }
    }

    setBatchResults(results);
    setBatchQueue([]);
    setIsBatchGenerating(false);

    if (results.length > 0) {
      setGeneratedImage(results[0].imageUrl);
    }
  };

  // 결과 이미지 네비게이션
  const navigateResults = (direction: 'prev' | 'next') => {
    if (batchResults.length === 0) return;

    let newIndex = currentResultIndex;
    if (direction === 'prev') {
      newIndex = currentResultIndex > 0 ? currentResultIndex - 1 : batchResults.length - 1;
    } else {
      newIndex = currentResultIndex < batchResults.length - 1 ? currentResultIndex + 1 : 0;
    }

    setCurrentResultIndex(newIndex);
    setGeneratedImage(batchResults[newIndex].imageUrl);
  };

  const selectResultByIndex = (index: number) => {
    if (index >= 0 && index < batchResults.length) {
      setCurrentResultIndex(index);
      setGeneratedImage(batchResults[index].imageUrl);
    }
  };

  const clearBatchResults = () => {
    setBatchResults([]);
    setCurrentResultIndex(0);
    setGeneratedImage(null);
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
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">Gemini 3.0 Pro</p>
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
              isLoggedIn={isLoggedIn}
              password={password}
              loginError={loginError}
              onPasswordChange={setPassword}
              onLogin={handleLogin}
              onKeyPress={handleKeyPress}
              onSelectAll={selectAllSlides}
              onDeselectAll={deselectAllSlides}
              onUrlSubmit={handleUrlSubmit}
              isUrlProcessing={isUrlProcessing}
              webContent={webContent}
              onTextSubmit={handleTextSubmit}
              textContent={textContent}
              onAddToBatch={addToBatchQueue}
              batchQueueLength={batchQueue.length}
           />
        </aside>

        {/* Middle Column: Controls (350px fixed) */}
        <section className="w-[350px] shrink-0 h-full z-10 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col">
           <div className="flex-1 overflow-y-auto">
             <StyleSelector config={config} onUpdateConfig={updateConfig} />
           </div>
           {/* Batch Queue Section */}
           {batchQueue.length > 0 && (
             <BatchQueue
               items={batchQueue}
               onRemoveItem={removeFromBatchQueue}
               onClearAll={clearBatchQueue}
             />
           )}
        </section>

        {/* Right Column: Preview & Action (Fluid) */}
        <section className="flex-1 bg-slate-100 dark:bg-slate-950 flex flex-col h-full relative transition-colors">

           {/* Canvas Area */}
           <div className="flex-1 p-8 flex items-center justify-center overflow-auto">
              {isGenerating || isBatchGenerating ? (
                  <div className="text-center p-12 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
                     <div className="relative w-20 h-20 mx-auto mb-6">
                        <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-700 rounded-full"></div>
                        <div className="absolute inset-0 border-4 rounded-full border-t-transparent animate-spin border-blue-600 dark:border-blue-500"></div>
                     </div>
                     <h2 className="text-2xl font-bold text-slate-800 dark:text-white animate-pulse mb-2">
                         {isBatchGenerating ? `배치 생성 중 (${batchProgress.current}/${batchProgress.total})` : '이미지 생성 중...'}
                     </h2>
                     <p className="text-sm text-slate-500 dark:text-slate-400">
                         {isBatchGenerating
                           ? `${batchProgress.current}번째 인포그래픽을 생성하고 있습니다.`
                           : 'Gemini 3.0 Pro가 디자인을 그리고 있습니다.'}
                     </p>
                     {isBatchGenerating && (
                       <div className="mt-4 w-64 mx-auto bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                         <div
                           className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                           style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                         />
                       </div>
                     )}
                  </div>
              ) : generatedImage ? (
                  <div className="relative w-full h-full flex items-center justify-center group">
                      {/* 배치 결과 네비게이션 */}
                      {batchResults.length > 1 && (
                        <>
                          <button
                            onClick={() => navigateResults('prev')}
                            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/90 dark:bg-slate-800/90 rounded-full shadow-lg hover:bg-white dark:hover:bg-slate-700 transition-all"
                          >
                            <ChevronLeft className="w-6 h-6 text-slate-700 dark:text-slate-200" />
                          </button>
                          <button
                            onClick={() => navigateResults('next')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/90 dark:bg-slate-800/90 rounded-full shadow-lg hover:bg-white dark:hover:bg-slate-700 transition-all"
                          >
                            <ChevronRight className="w-6 h-6 text-slate-700 dark:text-slate-200" />
                          </button>
                        </>
                      )}
                      <img
                        src={generatedImage}
                        alt="Generated Infographic"
                        className="max-w-full max-h-full object-contain shadow-2xl rounded-lg bg-white"
                      />
                      {/* 배치 결과 인디케이터 */}
                      {batchResults.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/90 dark:bg-slate-800/90 px-4 py-2 rounded-full shadow-lg">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            {currentResultIndex + 1} / {batchResults.length}
                          </span>
                          <button
                            onClick={clearBatchResults}
                            className="ml-2 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                            title="모든 결과 삭제"
                          >
                            <X className="w-4 h-4 text-slate-500" />
                          </button>
                        </div>
                      )}
                  </div>
              ) : (
                  <div className="text-center text-slate-400 dark:text-slate-600">
                     <div className="w-24 h-24 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <ImageIcon className="w-10 h-10 opacity-30" />
                     </div>
                     <p className="text-lg font-medium">슬라이드를 선택하고<br/>아래의 생성 버튼을 눌러주세요.</p>
                  </div>
              )}
           </div>

           {/* Bottom Action Bar */}
           <div className="h-24 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">

              {/* Left: Generate Buttons */}
              <div className="flex items-center gap-3">
                 {/* 단일 생성 버튼 */}
                 <button
                    onClick={handleGenerateInfographic}
                    disabled={isGenerating || isBatchGenerating || (slides.filter(s => s.selected).length === 0 && !webContent && !textContent)}
                    className={`
                       flex items-center gap-3 px-5 py-3 rounded-xl font-bold text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all
                       ${isGenerating || isBatchGenerating
                         ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed shadow-none'
                         : webContent?.type === 'youtube'
                           ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-700 hover:to-rose-700'
                           : webContent
                             ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700'
                             : textContent
                               ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700'
                               : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700'}
                    `}
                 >
                    <ImageIcon className="w-5 h-5" />
                    {webContent?.type === 'youtube'
                      ? '유튜브 생성'
                      : webContent
                        ? '웹페이지 생성'
                        : textContent
                          ? '텍스트 생성'
                          : '바로 생성'}
                 </button>

                 {/* 큐에 추가 버튼 */}
                 <button
                    onClick={addToBatchQueue}
                    disabled={isGenerating || isBatchGenerating || (slides.filter(s => s.selected).length === 0 && !webContent && !textContent)}
                    className={`
                       flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-base transition-all border-2
                       ${isGenerating || isBatchGenerating || (slides.filter(s => s.selected).length === 0 && !webContent && !textContent)
                         ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                         : 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/50'}
                    `}
                 >
                    <Plus className="w-5 h-5" />
                    큐에 추가
                    {batchQueue.length > 0 && (
                      <span className="ml-1 px-2 py-0.5 bg-amber-600 text-white text-xs rounded-full">
                        {batchQueue.length}
                      </span>
                    )}
                 </button>

                 {/* 배치 일괄 생성 버튼 */}
                 {batchQueue.length > 0 && (
                   <button
                      onClick={handleBatchGenerate}
                      disabled={isGenerating || isBatchGenerating}
                      className={`
                         flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all
                         ${isGenerating || isBatchGenerating
                           ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed shadow-none'
                           : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600'}
                      `}
                   >
                      <Layers className="w-5 h-5" />
                      {batchQueue.length}장 일괄 생성
                   </button>
                 )}
              </div>

              {/* Right: Download Options */}
              <div className="flex flex-col items-end">
                  {generatedImage ? (
                    <>
                         <span className="text-xs text-slate-400 font-medium mb-1">결과물 저장</span>
                         <div className="flex gap-3">
                            <button
                               onClick={() => generatedImage && saveImageToPdf(generatedImage, 'Infographic.pdf')}
                               className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-sm transition-colors"
                            >
                               <Download className="w-4 h-4" /> PDF
                            </button>
                            <button
                               onClick={() => generatedImage && saveImageToPptx(generatedImage, 'Infographic.pptx')}
                               className="flex items-center gap-2 px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg font-bold text-sm transition-colors"
                            >
                               <Presentation className="w-4 h-4" /> PPTX
                            </button>
                         </div>
                    </>
                  ) : (
                      <div className="text-xs text-slate-400 dark:text-slate-600">
                          생성된 결과물이 여기에 표시됩니다.
                      </div>
                  )}
              </div>
           </div>
        </section>

      </main>
    </div>
  );
};

export default App;
