import React from 'react';
import { BatchItem } from '../types';
import { X, Trash2, FileText, Globe, Youtube, Image as ImageIcon } from 'lucide-react';

interface BatchQueueProps {
  items: BatchItem[];
  onRemoveItem: (id: string) => void;
  onClearAll: () => void;
}

export const BatchQueue: React.FC<BatchQueueProps> = ({
  items,
  onRemoveItem,
  onClearAll
}) => {
  const getItemIcon = (item: BatchItem) => {
    if (item.source.type === 'web') {
      return item.source.content.type === 'youtube'
        ? <Youtube className="w-4 h-4 text-red-500" />
        : <Globe className="w-4 h-4 text-emerald-500" />;
    } else if (item.source.type === 'text') {
      return <FileText className="w-4 h-4 text-violet-500" />;
    }
    return <ImageIcon className="w-4 h-4 text-blue-500" />;
  };

  const getItemThumbnails = (item: BatchItem) => {
    if (item.source.type === 'slides' && item.source.thumbnails.length > 0) {
      return item.source.thumbnails;
    }
    if (item.source.type === 'web' && item.source.content.thumbnail) {
      return [item.source.content.thumbnail];
    }
    return [];
  };

  return (
    <div className="border-t border-slate-200 dark:border-slate-800 bg-amber-50/50 dark:bg-amber-900/10">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-amber-200 dark:border-amber-800/30">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {items.length}
          </div>
          <span className="text-sm font-bold text-amber-800 dark:text-amber-400">배치 대기열</span>
        </div>
        <button
          onClick={onClearAll}
          className="text-xs text-amber-600 dark:text-amber-500 hover:text-amber-800 dark:hover:text-amber-300 flex items-center gap-1 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          모두 삭제
        </button>
      </div>

      {/* Queue Items */}
      <div className="max-h-48 overflow-y-auto p-2 space-y-2">
        {items.map((item, index) => {
          const thumbnails = getItemThumbnails(item);

          return (
            <div
              key={item.id}
              className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 rounded-lg border border-amber-200 dark:border-slate-700 shadow-sm"
            >
              {/* Index Number */}
              <div className="w-5 h-5 bg-amber-500 rounded text-white text-xs font-bold flex items-center justify-center shrink-0">
                {index + 1}
              </div>

              {/* Thumbnails or Icon */}
              <div className="w-12 h-8 bg-slate-100 dark:bg-slate-700 rounded overflow-hidden shrink-0 flex items-center justify-center">
                {thumbnails.length > 0 ? (
                  <div className="flex -space-x-2">
                    {thumbnails.slice(0, 2).map((thumb, i) => (
                      <img
                        key={i}
                        src={thumb}
                        alt=""
                        className="w-6 h-8 object-cover rounded border border-white dark:border-slate-800"
                      />
                    ))}
                    {thumbnails.length > 2 && (
                      <div className="w-6 h-8 bg-slate-300 dark:bg-slate-600 rounded border border-white dark:border-slate-800 flex items-center justify-center text-[8px] font-bold text-slate-600 dark:text-slate-300">
                        +{thumbnails.length - 2}
                      </div>
                    )}
                  </div>
                ) : (
                  getItemIcon(item)
                )}
              </div>

              {/* Label */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  {getItemIcon(item)}
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                    {item.label}
                  </span>
                </div>
              </div>

              {/* Remove Button */}
              <button
                onClick={() => onRemoveItem(item.id)}
                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors shrink-0"
              >
                <X className="w-4 h-4 text-slate-400 hover:text-red-500" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2 border-t border-amber-200 dark:border-amber-800/30">
        <p className="text-xs text-amber-700 dark:text-amber-500">
          하단의 "일괄 생성" 버튼을 눌러 {items.length}장을 한번에 생성하세요.
        </p>
      </div>
    </div>
  );
};
