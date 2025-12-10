import React, { useState, useEffect } from 'react';
import { Download, FileText, Presentation, Image as ImageIcon, Moon, Sun } from 'lucide-react';
import { Slide, GenerationConfig } from './types';
import { processFileToSlides, saveImageToPdf, saveImageToPptx } from './services/pdfService';
import { generateInfographic, generateFromWebContent } from './services/geminiService';
import { fetchWebpageContent, WebPageContent } from './services/webService';
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

  // Result State
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Web Content State
  const [isUrlProcessing, setIsUrlProcessing] = useState(false);
  const [webContent, setWebContent] = useState<{ title: string; content: string; url: string } | null>(null);

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

  // URL Handler
  const handleUrlSubmit = async (url: string) => {
    setIsUrlProcessing(true);
    setWebContent(null);

    try {
      const result = await fetchWebpageContent(url);

      if (result.success && result.data) {
        setWebContent({
          title: result.data.title,
          content: result.data.content,
          url: result.data.url
        });
        // Clear slides when using URL mode
        setSlides([]);
        setGeneratedImage(null);
      } else {
        alert(result.error || '웹페이지를 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('URL fetch error:', error);
      alert('웹페이지를 불러오는데 실패했습니다.');
    } finally {
      setIsUrlProcessing(false);
    }
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

    // Check if we have either slides or web content
    if (selectedSlides.length === 0 && !webContent) {
        alert("파일을 업로드하거나 웹페이지 URL을 입력해주세요.");
        return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      let resultUrl: string | null = null;

      if (webContent) {
        // Generate from web content
        resultUrl = await generateFromWebContent(webContent, config);
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
                        <div className="absolute inset-0 border-4 rounded-full border-t-transparent animate-spin border-blue-600 dark:border-blue-500"></div>
                     </div>
                     <h2 className="text-2xl font-bold text-slate-800 dark:text-white animate-pulse mb-2">
                         이미지 생성 중...
                     </h2>
                     <p className="text-sm text-slate-500 dark:text-slate-400">
                         Gemini 3.0 Pro가 디자인을 그리고 있습니다.
                     </p>
                  </div>
              ) : generatedImage ? (
                  <div className="relative w-full h-full flex items-center justify-center group">
                      <img
                        src={generatedImage}
                        alt="Generated Infographic"
                        className="max-w-full max-h-full object-contain shadow-2xl rounded-lg bg-white"
                      />
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

              {/* Left: Generate Button */}
              <div className="flex items-center gap-4">
                 <button
                    onClick={handleGenerateInfographic}
                    disabled={isGenerating || (slides.filter(s => s.selected).length === 0 && !webContent)}
                    className={`
                       flex items-center gap-3 px-6 py-3.5 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all
                       ${isGenerating
                         ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed shadow-none'
                         : webContent
                           ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700'
                           : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700'}
                    `}
                 >
                    <ImageIcon className="w-5 h-5" />
                    {webContent ? '웹페이지 인포그래픽 생성' : '인포그래픽 생성하기'}
                 </button>
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
