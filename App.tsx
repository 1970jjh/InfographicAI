import React, { useState, useEffect } from 'react';
import { Download, FileText, Presentation, Image as ImageIcon, Moon, Sun, Plus, Trash2, ChevronLeft, ChevronRight, Layers, Archive } from 'lucide-react';
import { Slide, GenerationConfig, InfographicQueueItem } from './types';
import {
  processFileToSlides,
  saveImageToPdf,
  saveImageToPptx,
  saveImageAsJpg,
  saveImageAsPng,
  saveMultipleImagesAsJpgZip,
  saveMultipleImagesAsPngZip,
  saveMultipleImagesToPdf,
  saveMultipleImagesToPptx
} from './services/pdfService';
import { generateInfographic, generateFromWebContent, generateFromTextContent } from './services/geminiService';
import { fetchUrlContent, WebPageContent } from './services/webService';
import { PageSelector } from './components/PageSelector';
import { StyleSelector } from './components/StyleSelector';

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

  // Queue State
  const [queue, setQueue] = useState<InfographicQueueItem[]>([]);
  const [activeQueueIndex, setActiveQueueIndex] = useState<number>(0);
  const [previewIndex, setPreviewIndex] = useState<number>(0);

  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<{ current: number; total: number } | null>(null);

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

  // Dark Mode Effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Get completed images from queue
  const completedImages = queue.filter(item => item.status === 'completed' && item.generatedImage).map(item => item.generatedImage!);

  // --- Queue Handlers ---

  // Add new queue item with current selection
  const addToQueue = () => {
    const selectedSlideData = slides.filter(s => s.selected);

    if (selectedSlideData.length === 0 && !webContent && !textContent) {
      alert("대기열에 추가할 콘텐츠를 선택해주세요.");
      return;
    }

    const newItem: InfographicQueueItem = {
      id: crypto.randomUUID(),
      name: `인포그래픽 ${queue.length + 1}`,
      selectedSlides: selectedSlideData, // Store actual slide data
      webContent: webContent || undefined,
      textContent: textContent || undefined,
      status: 'pending'
    };

    setQueue(prev => [...prev, newItem]);

    // Reset selections for next item
    setSlides(prev => prev.map(slide => ({ ...slide, selected: false })));
    setWebContent(null);
    setTextContent(null);
  };

  // Remove queue item
  const removeFromQueue = (id: string) => {
    setQueue(prev => {
      const newQueue = prev.filter(item => item.id !== id);
      // Adjust active index if needed
      if (activeQueueIndex >= newQueue.length && newQueue.length > 0) {
        setActiveQueueIndex(newQueue.length - 1);
      }
      return newQueue;
    });
  };

  // Select queue item for editing (show which slides were selected)
  const selectQueueItem = (index: number) => {
    const item = queue[index];
    if (!item) return;

    setActiveQueueIndex(index);

    // Restore the selection state for this queue item
    const selectedIds = item.selectedSlides.map(s => s.id);
    setSlides(prev => prev.map(slide => ({
      ...slide,
      selected: selectedIds.includes(slide.id)
    })));
    setWebContent(item.webContent || null);
    setTextContent(item.textContent || null);
  };

  // Update current queue item with new selection
  const updateCurrentQueueItem = () => {
    if (queue.length === 0) return;

    const selectedSlideData = slides.filter(s => s.selected);

    setQueue(prev => prev.map((item, idx) =>
      idx === activeQueueIndex
        ? {
            ...item,
            selectedSlides: selectedSlideData,
            webContent: webContent || undefined,
            textContent: textContent || undefined
          }
        : item
    ));
  };

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
      e.target.value = '';
    }
  };

  // URL Handler (supports both webpage and YouTube)
  const handleUrlSubmit = async (url: string) => {
    setIsUrlProcessing(true);
    setWebContent(null);
    setTextContent(null);

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
        setSlides([]);
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
    setWebContent(null);
    setSlides([]);
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

  // Batch Infographic Generation Handler
  const handleGenerateAllInfographics = async () => {
    if (queue.length === 0) {
      alert("대기열에 생성할 항목이 없습니다. +Q 버튼을 눌러 항목을 추가해주세요.");
      return;
    }

    const pendingItems = queue.filter(item => item.status === 'pending');
    if (pendingItems.length === 0) {
      alert("생성할 대기 항목이 없습니다.");
      return;
    }

    setIsGenerating(true);
    setGenerationProgress({ current: 0, total: pendingItems.length });

    try {
      for (let i = 0; i < queue.length; i++) {
        const item = queue[i];
        if (item.status !== 'pending') continue;

        // Update status to generating
        setQueue(prev => prev.map((q, idx) =>
          idx === i ? { ...q, status: 'generating' as const } : q
        ));

        setGenerationProgress(prev => prev ? { ...prev, current: prev.current + 1 } : null);

        try {
          let resultUrl: string | null = null;

          if (item.webContent) {
            resultUrl = await generateFromWebContent(item.webContent, config);
          } else if (item.textContent) {
            resultUrl = await generateFromTextContent(item.textContent, config);
          } else if (item.selectedSlides.length > 0) {
            // Use stored slide data directly
            resultUrl = await generateInfographic(item.selectedSlides, config);
          }

          if (resultUrl) {
            setQueue(prev => prev.map((q, idx) =>
              idx === i ? { ...q, status: 'completed' as const, generatedImage: resultUrl! } : q
            ));
          } else {
            setQueue(prev => prev.map((q, idx) =>
              idx === i ? { ...q, status: 'error' as const, errorMessage: '이미지 생성 실패' } : q
            ));
          }
        } catch (e) {
          console.error(`Error generating item ${i}:`, e);
          setQueue(prev => prev.map((q, idx) =>
            idx === i ? { ...q, status: 'error' as const, errorMessage: '생성 중 오류 발생' } : q
          ));
        }
      }
    } finally {
      setIsGenerating(false);
      setGenerationProgress(null);
      setPreviewIndex(0);
    }
  };

  // Single item generation (for immediate generation without queue)
  const handleGenerateSingle = async () => {
    const selectedSlides = slides.filter(s => s.selected);

    if (selectedSlides.length === 0 && !webContent && !textContent) {
      alert("파일을 업로드하거나 웹페이지 URL 또는 텍스트를 입력해주세요.");
      return;
    }

    // Add to queue and generate immediately
    const newItem: InfographicQueueItem = {
      id: crypto.randomUUID(),
      name: `인포그래픽 ${queue.length + 1}`,
      selectedSlides: selectedSlides, // Store actual slide data
      webContent: webContent || undefined,
      textContent: textContent || undefined,
      status: 'generating'
    };

    setQueue(prev => [...prev, newItem]);
    setIsGenerating(true);

    try {
      let resultUrl: string | null = null;

      if (webContent) {
        resultUrl = await generateFromWebContent(webContent, config);
      } else if (textContent) {
        resultUrl = await generateFromTextContent(textContent, config);
      } else {
        resultUrl = await generateInfographic(selectedSlides, config);
      }

      if (resultUrl) {
        setQueue(prev => prev.map(q =>
          q.id === newItem.id ? { ...q, status: 'completed' as const, generatedImage: resultUrl! } : q
        ));
        setPreviewIndex(queue.length); // Show the newly generated image
      } else {
        setQueue(prev => prev.map(q =>
          q.id === newItem.id ? { ...q, status: 'error' as const, errorMessage: '이미지 생성 실패' } : q
        ));
        alert("이미지 생성에 실패했습니다.");
      }
    } catch (e) {
      console.error(e);
      setQueue(prev => prev.map(q =>
        q.id === newItem.id ? { ...q, status: 'error' as const, errorMessage: '생성 중 오류 발생' } : q
      ));
      alert("생성 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
      // Reset selections
      setSlides(prev => prev.map(slide => ({ ...slide, selected: false })));
      setWebContent(null);
      setTextContent(null);
    }
  };

  // Clear all queue items
  const clearQueue = () => {
    if (queue.length > 0 && confirm('모든 대기열 항목을 삭제하시겠습니까?')) {
      setQueue([]);
      setActiveQueueIndex(0);
      setPreviewIndex(0);
    }
  };

  // Download handlers for multiple images
  const handleDownloadAllJpg = () => {
    if (completedImages.length === 1) {
      saveImageAsJpg(completedImages[0], 'Infographic.jpg');
    } else if (completedImages.length > 1) {
      saveMultipleImagesAsJpgZip(completedImages, 'Infographics_JPG.zip');
    }
  };

  const handleDownloadAllPng = () => {
    if (completedImages.length === 1) {
      saveImageAsPng(completedImages[0], 'Infographic.png');
    } else if (completedImages.length > 1) {
      saveMultipleImagesAsPngZip(completedImages, 'Infographics_PNG.zip');
    }
  };

  const handleDownloadAllPdf = () => {
    if (completedImages.length === 1) {
      saveImageToPdf(completedImages[0], 'Infographic.pdf');
    } else if (completedImages.length > 1) {
      saveMultipleImagesToPdf(completedImages, 'Infographics.pdf');
    }
  };

  const handleDownloadAllPptx = () => {
    if (completedImages.length === 1) {
      saveImageToPptx(completedImages[0], 'Infographic.pptx');
    } else if (completedImages.length > 1) {
      saveMultipleImagesToPptx(completedImages, 'Infographics.pptx');
    }
  };

  // Current preview image
  const currentPreviewImage = completedImages[previewIndex] || null;

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
           />
        </aside>

        {/* Middle Column: Controls (350px fixed) */}
        <section className="w-[350px] shrink-0 h-full z-10 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col">
           <StyleSelector config={config} onUpdateConfig={updateConfig} />

           {/* Queue Panel - Always visible at bottom */}
           <div className="shrink-0 border-t border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-800/50">
             <div className="flex items-center justify-between mb-3">
               <div className="flex items-center gap-2">
                 <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                 <span className="text-sm font-bold text-slate-700 dark:text-slate-300">생성 대기열</span>
                 <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
                   {queue.length}개
                 </span>
               </div>
               {queue.length > 0 && (
                 <button
                   onClick={clearQueue}
                   className="text-xs text-red-500 hover:text-red-600 font-medium"
                 >
                   전체 삭제
                 </button>
               )}
             </div>

             {/* Add to Queue Button */}
             <button
               onClick={addToQueue}
               disabled={slides.filter(s => s.selected).length === 0 && !webContent && !textContent}
               className="w-full mb-3 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-lg font-bold text-sm transition-colors disabled:cursor-not-allowed"
             >
               <Plus className="w-4 h-4" />
               대기열에 추가 (+Q)
             </button>

             {/* Queue List */}
             <div className="max-h-48 overflow-y-auto space-y-2">
               {queue.length === 0 ? (
                 <div className="text-center py-4 text-slate-400 dark:text-slate-500 text-xs">
                   슬라이드를 선택하고 +Q 버튼을 눌러<br/>생성 대기열에 추가하세요.
                 </div>
               ) : (
                 queue.map((item, idx) => (
                   <div
                     key={item.id}
                     className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer ${
                       activeQueueIndex === idx
                         ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700'
                         : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                     }`}
                     onClick={() => selectQueueItem(idx)}
                   >
                     <div className="flex items-center gap-2">
                       <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                         item.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' :
                         item.status === 'generating' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400 animate-pulse' :
                         item.status === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400' :
                         'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                       }`}>
                         {idx + 1}
                       </span>
                       <div>
                         <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{item.name}</span>
                         <div className="text-[10px] text-slate-400">
                           {item.webContent ? (item.webContent.type === 'youtube' ? '유튜브' : '웹페이지') :
                            item.textContent ? '텍스트' :
                            `${item.selectedSlides.length}개 슬라이드`}
                         </div>
                       </div>
                     </div>
                     <button
                       onClick={(e) => { e.stopPropagation(); removeFromQueue(item.id); }}
                       className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                     >
                       <Trash2 className="w-3.5 h-3.5" />
                     </button>
                   </div>
                 ))
               )}
             </div>
           </div>
        </section>

        {/* Right Column: Preview & Action (Fluid) */}
        <section className="flex-1 bg-slate-100 dark:bg-slate-950 flex flex-col h-full relative transition-colors">

           {/* Canvas Area */}
           <div className="flex-1 p-8 flex items-center justify-center overflow-auto">
              {isGenerating ? (
                  <div className="text-center p-12 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
                     <div className="relative w-20 h-20 mx-auto mb-6">
                        <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-700 rounded-full"></div>
                        <div className="absolute inset-0 border-4 rounded-full border-t-transparent animate-spin border-blue-600 dark:border-blue-500"></div>
                     </div>
                     <h2 className="text-2xl font-bold text-slate-800 dark:text-white animate-pulse mb-2">
                         이미지 생성 중...
                     </h2>
                     <p className="text-sm text-slate-500 dark:text-slate-400">
                         {generationProgress
                           ? `${generationProgress.current} / ${generationProgress.total} 생성 중`
                           : 'Gemini 3.0 Pro가 디자인을 그리고 있습니다.'}
                     </p>
                  </div>
              ) : currentPreviewImage ? (
                  <div className="relative w-full h-full flex flex-col items-center justify-center">
                      {/* Image Navigation */}
                      {completedImages.length > 1 && (
                        <div className="absolute top-0 left-0 right-0 flex items-center justify-center gap-4 mb-4 z-10">
                          <button
                            onClick={() => setPreviewIndex(prev => Math.max(0, prev - 1))}
                            disabled={previewIndex === 0}
                            className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-lg disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow">
                            {previewIndex + 1} / {completedImages.length}
                          </span>
                          <button
                            onClick={() => setPreviewIndex(prev => Math.min(completedImages.length - 1, prev + 1))}
                            disabled={previewIndex === completedImages.length - 1}
                            className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-lg disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                      <img
                        src={currentPreviewImage}
                        alt="Generated Infographic"
                        className="max-w-full max-h-full object-contain shadow-2xl rounded-lg bg-white mt-12"
                      />
                  </div>
              ) : (
                  <div className="text-center text-slate-400 dark:text-slate-600">
                     <div className="w-24 h-24 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <ImageIcon className="w-10 h-10 opacity-30" />
                     </div>
                     <p className="text-lg font-medium">슬라이드를 선택하고<br/>대기열에 추가 후 생성 버튼을 눌러주세요.</p>
                  </div>
              )}
           </div>

           {/* Bottom Action Bar */}
           <div className="h-24 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">

              {/* Left: Generate Buttons */}
              <div className="flex items-center gap-3">
                 {/* Single Generate */}
                 <button
                    onClick={handleGenerateSingle}
                    disabled={isGenerating || (slides.filter(s => s.selected).length === 0 && !webContent && !textContent)}
                    className={`
                       flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all
                       ${isGenerating
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
                    바로 생성
                 </button>

                 {/* Batch Generate */}
                 <button
                    onClick={handleGenerateAllInfographics}
                    disabled={isGenerating || queue.filter(q => q.status === 'pending').length === 0}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:translate-y-0"
                 >
                    <Layers className="w-5 h-5" />
                    대기열 전체 생성 ({queue.filter(q => q.status === 'pending').length})
                 </button>
              </div>

              {/* Right: Download Options */}
              <div className="flex flex-col items-end">
                  {completedImages.length > 0 ? (
                    <>
                         <span className="text-xs text-slate-400 font-medium mb-1">
                           결과물 저장 {completedImages.length > 1 && (
                             <span className="text-blue-500">({completedImages.length}장)</span>
                           )}
                         </span>
                         <div className="flex gap-2">
                            <button
                               onClick={handleDownloadAllJpg}
                               className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg font-bold text-sm transition-colors"
                            >
                               {completedImages.length > 1 ? <Archive className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />} JPG
                            </button>
                            <button
                               onClick={handleDownloadAllPng}
                               className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-sm transition-colors"
                            >
                               {completedImages.length > 1 ? <Archive className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />} PNG
                            </button>
                            <button
                               onClick={handleDownloadAllPdf}
                               className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-sm transition-colors"
                            >
                               <Download className="w-4 h-4" /> PDF
                            </button>
                            <button
                               onClick={handleDownloadAllPptx}
                               className="flex items-center gap-1.5 px-3 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg font-bold text-sm transition-colors"
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
