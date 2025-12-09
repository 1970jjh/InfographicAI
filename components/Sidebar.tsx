import React from 'react';
import { Slide } from '../types';

interface SidebarProps {
  slides: Slide[];
  selectedSlideIndex: number;
  onSelectSlide: (index: number) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  slides,
  selectedSlideIndex,
  onSelectSlide,
}) => {
  return (
    <div className="w-full bg-slate-100 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-white shrink-0">
        <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider whitespace-nowrap overflow-hidden text-ellipsis">
            슬라이드 목록 ({slides.length})
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            onClick={() => onSelectSlide(index)}
            className={`cursor-pointer group relative transition-all duration-200 ${
              index === selectedSlideIndex
                ? 'ring-2 ring-blue-500 ring-offset-2'
                : 'hover:ring-2 hover:ring-slate-300 hover:ring-offset-2'
            }`}
          >
            <div className="relative bg-white shadow-sm rounded-md overflow-hidden aspect-video">
              <img
                src={slide.currentImage}
                alt={`Slide ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                {index + 1}
              </div>
              {slide.currentImage !== slide.originalImage && (
                 <div className="absolute top-1 right-1 bg-blue-500 text-white text-[10px] px-1 py-0.5 rounded-full">
                   편집됨
                 </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};