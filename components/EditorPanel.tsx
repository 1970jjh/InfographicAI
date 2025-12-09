import React, { useState, useEffect } from 'react';
import { Slide, GeneratedImage } from '../types';
import { generateSlideVariations } from '../services/geminiService';
import { Loader2, Wand2, RotateCcw, CheckCircle2, ImagePlus } from 'lucide-react';

interface EditorPanelProps {
  slide: Slide;
  onUpdateSlide: (updatedSlide: Slide) => void;
}

type EditMode = 'original' | 'continuous';

export const EditorPanel: React.FC<EditorPanelProps> = ({ slide, onUpdateSlide }) => {
  const [prompt, setPrompt] = useState('');
  const [generateCount, setGenerateCount] = useState(2);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<EditMode>('original');
  
  // Resizable Control Panel State
  const [controlsWidth, setControlsWidth] = useState(384); // Default 384px (w-96)

  // Zoom & Pan State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  // Reset local state when slide changes
  useEffect(() => {
    setPrompt(slide.lastPrompt || '');
    setError(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [slide.id]);

  const startResizingControls = (e: React.MouseEvent) => {
    e.preventDefault();
    // We are resizing from the left edge of the right panel
    // So moving left increases width, moving right decreases width
    const startX = e.clientX;
    const startWidth = controlsWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      // Delta X: positive if moved right (width decreases), negative if moved left (width increases)
      const deltaX = moveEvent.clientX - startX;
      const newWidth = startWidth - deltaX;
      
      // Min 250px, Max 600px
      setControlsWidth(Math.max(250, Math.min(newWidth, 600)));
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'default';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setError(null);

    // Decide which image to use as source
    const sourceImage = editMode === 'original' ? slide.originalImage : slide.currentImage;

    try {
      const newCandidates = await generateSlideVariations(
        sourceImage,
        prompt,
        generateCount
      );

      if (newCandidates.length === 0) {
        // Error is usually handled in service, but if it returns empty array silently:
        // Or if we specifically want to show a message here.
        // We set a generic error if none was caught/handled otherwise.
        if (!error) setError("이미지 생성에 실패했습니다. 다시 시도하거나 API 키를 확인해주세요.");
      } else {
        onUpdateSlide({
          ...slide,
          lastPrompt: prompt,
          generatedCandidates: [...newCandidates, ...slide.generatedCandidates], // Prepend new ones
        });
      }
    } catch (e) {
      console.error(e);
      setError("생성 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyCandidate = (candidate: GeneratedImage) => {
    onUpdateSlide({
      ...slide,
      currentImage: candidate.dataUrl,
    });
  };

  const handleRevert = () => {
    onUpdateSlide({
      ...slide,
      currentImage: slide.originalImage,
    });
  };

  // Zoom Handlers
  const handleWheel = (e: React.WheelEvent) => {
    // Zoom logic
    const intensity = 0.001;
    const newZoom = Math.max(0.1, Math.min(5, zoom - e.deltaY * intensity));
    setZoom(newZoom);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent default to avoid image dragging behavior
    e.preventDefault();
    setIsPanning(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan((prev) => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
  };

  const handleMouseUp = () => setIsPanning(false);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Toolbar / Header for the specific slide */}
      <div className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0">
        <h1 className="text-lg font-semibold text-slate-800">슬라이드 에디터</h1>
        <div className="flex items-center gap-2">
             {slide.currentImage !== slide.originalImage && (
                <button 
                    onClick={handleRevert}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    되돌리기
                </button>
             )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Preview Area */}
        <div 
          className="flex-1 p-8 flex items-center justify-center bg-slate-100/50 relative overflow-hidden cursor-move"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div 
            style={{ 
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transition: isPanning ? 'none' : 'transform 0.1s ease-out'
            }}
            className="relative max-w-full max-h-full shadow-2xl rounded-lg overflow-hidden bg-white ring-1 ring-slate-900/5 flex shrink-0"
          >
             <img 
                src={slide.currentImage} 
                alt="Current Slide" 
                className="w-full h-full object-contain max-h-[calc(100vh-10rem)]"
                draggable={false}
             />
          </div>
          
          {/* Zoom Indicator */}
          <div className="absolute bottom-4 left-4 bg-black/70 text-white px-2 py-1 rounded text-xs pointer-events-none select-none z-10">
            {Math.round(zoom * 100)}%
          </div>
        </div>

        {/* Resizer Handle */}
        <div
            className="w-1 bg-slate-200 hover:bg-blue-400 cursor-col-resize flex items-center justify-center group z-20 transition-colors"
            onMouseDown={startResizingControls}
        >
            <div className="h-8 w-0.5 bg-slate-400 group-hover:bg-white rounded-full" />
        </div>

        {/* Right Control Panel */}
        <div 
            style={{ width: controlsWidth }}
            className="bg-white border-l border-slate-200 flex flex-col shadow-xl z-10 shrink-0"
        >
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            
            {/* Prompt Section */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">
                편집 프롬프트
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="예: 배경을 모던한 그라데이션으로 변경하고 텍스트를 키워줘..."
                className="w-full h-32 p-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all bg-white text-black"
              />
            </div>

            {/* Edit Mode Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">
                편집 기준 (Source)
              </label>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setEditMode('original')}
                  className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
                    editMode === 'original'
                      ? 'bg-white text-slate-800 shadow-sm ring-1 ring-black/5'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  원본 기반 (Original)
                </button>
                <button
                  onClick={() => setEditMode('continuous')}
                  className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
                    editMode === 'continuous'
                      ? 'bg-white text-blue-700 shadow-sm ring-1 ring-black/5'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  연속 편집 (Continuous)
                </button>
              </div>
              <p className="text-[11px] text-slate-500 px-1 leading-tight">
                {editMode === 'original' 
                  ? '항상 초기 업로드한 원본 이미지를 기준으로 수정합니다. 화질 유지에 유리합니다.'
                  : '현재 보이는 편집된 이미지를 기준으로 추가 수정합니다. 반복되면 화질이 저하될 수 있습니다.'}
              </p>
            </div>

            {/* Generation Settings */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">
                생성 개수
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((num) => (
                  <button
                    key={num}
                    onClick={() => setGenerateCount(num)}
                    className={`flex-1 py-2 text-sm font-medium rounded-md border ${
                      generateCount === num
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    } transition-colors`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className={`w-full py-3 px-4 flex items-center justify-center gap-2 rounded-lg text-white font-medium shadow-sm transition-all ${
                isGenerating || !prompt.trim()
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md active:transform active:scale-[0.98]'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  생성 중...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  Nano Banana Pro로 생성
                </>
              )}
            </button>

            {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md">
                    {error}
                </div>
            )}

            <hr className="border-slate-100" />

            {/* Candidates List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-700">
                    생성 결과
                  </label>
                  <span className="text-xs text-slate-400">{slide.generatedCandidates.length} 개</span>
              </div>
              
              {slide.generatedCandidates.length === 0 ? (
                <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    <ImagePlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">생성된 변형 이미지가 없습니다.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {slide.generatedCandidates.map((candidate) => (
                    <button
                      key={candidate.id}
                      onClick={() => handleApplyCandidate(candidate)}
                      className={`relative group rounded-lg overflow-hidden border-2 transition-all aspect-video ${
                        slide.currentImage === candidate.dataUrl
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'border-transparent hover:border-slate-300'
                      }`}
                    >
                      <img
                        src={candidate.dataUrl}
                        alt="Candidate"
                        className="w-full h-full object-cover"
                      />
                      {slide.currentImage === candidate.dataUrl && (
                        <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center">
                           <div className="bg-blue-500 rounded-full p-1 text-white">
                               <CheckCircle2 className="w-4 h-4" />
                           </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};