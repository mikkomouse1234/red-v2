import React, { useState } from 'react';
import { Bookmark, Star, BookOpen } from 'lucide-react';
import { ComicItem, ReadingProgress } from '../../types';

interface ComicCardProps {
  item: ComicItem;
  progress?: ReadingProgress;
  isSaved?: boolean;
  onSelect: (item: ComicItem) => void;
  onToggleSave?: (item: ComicItem, e: React.MouseEvent) => void;
  onQuickResume?: (item: ComicItem, e: React.MouseEvent) => void;
}

export const ComicCard: React.FC<ComicCardProps> = ({
  item,
  progress,
  isSaved = false,
  onSelect,
  onToggleSave,
  onQuickResume,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const fallbackCover = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800&auto=format&fit=crop';

  return (
    <div
      id={`comic-card-${item.id}`}
      onClick={() => onSelect(item)}
      className="group relative flex flex-col rounded-xl overflow-hidden bg-zinc-900/90 border border-zinc-800/80 hover:border-zinc-700 transition-all duration-200 cursor-pointer select-none active:scale-[0.98] shadow-md hover:shadow-xl hover:shadow-black/50"
    >
      {/* Cover Image Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-950">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-zinc-900 animate-pulse flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-zinc-700 animate-bounce" />
          </div>
        )}

        <img
          src={imageError ? fallbackCover : item.coverUrl}
          alt={item.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageError(true);
            setImageLoaded(true);
          }}
          className={`w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Top Badges Overlay */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
          {/* Source / Type badge */}
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow ${
              item.source === 'batcave'
                ? 'bg-red-950/80 border border-red-800/60 text-red-300'
                : 'bg-orange-950/80 border border-orange-800/60 text-orange-300'
            }`}
          >
            {item.source === 'batcave' ? 'Batcave' : 'MangaDex'}
          </span>

          {/* Bookmark Button */}
          {onToggleSave && (
            <button
              id={`bookmark-btn-${item.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave(item, e);
              }}
              className={`pointer-events-auto p-1.5 rounded-lg backdrop-blur-md transition-transform active:scale-90 ${
                isSaved
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/40'
                  : 'bg-black/60 text-zinc-300 hover:text-white hover:bg-black/80'
              }`}
              title={isSaved ? 'In My List' : 'Add to My List'}
              aria-label="Save to My List"
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>

        {/* Bottom Rating & Chapter Count Badge */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] font-medium text-zinc-200 pointer-events-none">
          {item.rating && (
            <span className="flex items-center gap-0.5 bg-black/75 backdrop-blur-sm px-1.5 py-0.5 rounded border border-zinc-700/50">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span>{item.rating.toFixed(1)}</span>
            </span>
          )}

          <span className="bg-black/75 backdrop-blur-sm px-1.5 py-0.5 rounded border border-zinc-700/50 ml-auto">
            {item.totalChapters} {item.type === 'comic' ? 'issues' : 'ch.'}
          </span>
        </div>

        {/* Reading Progress Indicator Bar */}
        {progress && progress.percentage > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
            <div
              className="h-full bg-red-600 transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        )}
      </div>

      {/* Title & Metadata */}
      <div className="p-2.5 flex flex-col flex-1 justify-between gap-1">
        <h3 className="font-semibold text-xs text-zinc-100 line-clamp-2 leading-snug group-hover:text-red-400 transition-colors">
          {item.title}
        </h3>

        <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-auto pt-1">
          <span className="truncate max-w-[90px]">
            {item.publisher || item.author || (item.source === 'batcave' ? 'Batcave' : 'MangaDex')}
          </span>

          {progress ? (
            <span className="text-red-400 font-medium text-[10px] bg-red-950/40 px-1 py-0.5 rounded border border-red-900/40">
              {progress.percentage}%
            </span>
          ) : (
            <span className="text-[10px] text-zinc-400">{item.status}</span>
          )}
        </div>
      </div>
    </div>
  );
};
