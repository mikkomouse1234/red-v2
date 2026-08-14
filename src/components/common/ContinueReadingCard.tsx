import React from 'react';
import { Play, Clock, BookOpen, ChevronRight } from 'lucide-react';
import { ReadingProgress } from '../../types';

interface ContinueReadingCardProps {
  progress: ReadingProgress;
  onResume: (progress: ReadingProgress) => void;
  onSelectTitle?: (itemId: string, type: 'comic' | 'manga') => void;
}

export const ContinueReadingCard: React.FC<ContinueReadingCardProps> = ({
  progress,
  onResume,
  onSelectTitle,
}) => {
  const timeAgo = (timestamp: number): string => {
    const elapsed = Math.floor((Date.now() - timestamp) / 1000);
    if (elapsed < 60) return 'Just now';
    if (elapsed < 3600) return `${Math.floor(elapsed / 60)}m ago`;
    if (elapsed < 86400) return `${Math.floor(elapsed / 3600)}h ago`;
    return `${Math.floor(elapsed / 86400)}d ago`;
  };

  return (
    <div
      id={`continue-reading-${progress.itemId}`}
      onClick={() => onResume(progress)}
      className="group relative flex items-center gap-3.5 p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-red-600/60 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-red-950/20 active:scale-[0.99] select-none"
    >
      {/* Cover Image */}
      <div className="relative w-16 h-22 rounded-lg overflow-hidden bg-zinc-950 flex-shrink-0 shadow-md">
        <img
          src={progress.coverUrl}
          alt={progress.itemTitle}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        {/* Source Mini Tag */}
        <span className="absolute top-1 left-1 px-1 py-0.2 rounded text-[8px] font-bold uppercase bg-black/80 text-zinc-300">
          {progress.source === 'batcave' ? 'Comic' : 'Manga'}
        </span>
      </div>

      {/* Details & Progress Info */}
      <div className="flex flex-col flex-1 min-w-0 justify-between py-0.5">
        <div>
          <h4 className="font-bold text-sm text-zinc-100 truncate group-hover:text-red-400 transition-colors">
            {progress.itemTitle}
          </h4>
          <p className="text-xs text-zinc-300 mt-0.5 font-medium flex items-center gap-1.5">
            <span className="text-red-400 font-semibold">{progress.chapterTitle}</span>
            <span className="text-zinc-500">•</span>
            <span>Page {progress.pageIndex + 1} of {progress.totalPages}</span>
          </p>
        </div>

        {/* Progress Bar & Timestamp */}
        <div className="mt-2.5 space-y-1.5">
          <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-red-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.max(5, progress.percentage)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span className="flex items-center gap-1 text-zinc-400">
              <Clock className="w-3 h-3" />
              {timeAgo(progress.lastReadTimestamp)}
            </span>
            <span className="font-semibold text-red-400">
              {progress.percentage}% completed
            </span>
          </div>
        </div>
      </div>

      {/* Resume CTA Action Button */}
      <button
        id={`resume-btn-${progress.itemId}`}
        onClick={(e) => {
          e.stopPropagation();
          onResume(progress);
        }}
        className="w-10 h-10 rounded-xl bg-red-600 hover:bg-red-500 active:scale-90 text-white flex items-center justify-center shadow-lg shadow-red-600/30 flex-shrink-0 transition-transform"
        aria-label="Resume Reading"
      >
        <Play className="w-4 h-4 fill-white ml-0.5" />
      </button>
    </div>
  );
};
