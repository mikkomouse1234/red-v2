import React, { useState } from 'react';
import { 
  X, 
  Play, 
  Bookmark, 
  Share2, 
  Star, 
  Clock, 
  BookOpen, 
  ArrowUpDown, 
  Search, 
  CheckCircle2, 
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ComicItem, ChapterItem, ReadingProgress, ListCategory } from '../../types';

interface DetailModalProps {
  item: ComicItem;
  progress?: ReadingProgress;
  isSaved: boolean;
  onClose: () => void;
  onStartReading: (item: ComicItem, chapter: ChapterItem, startPage?: number) => void;
  onToggleSave: (item: ComicItem, category?: ListCategory) => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({
  item,
  progress,
  isSaved,
  onClose,
  onStartReading,
  onToggleSave,
}) => {
  const [searchChapter, setSearchChapter] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [descExpanded, setDescExpanded] = useState(false);
  const [activeCategory, setActiveCategory] = useState<ListCategory>('Reading');

  const chapters = item.chapters || [];

  const filteredChapters = chapters
    .filter((ch) => {
      if (!searchChapter) return true;
      const q = searchChapter.toLowerCase();
      return (
        ch.title.toLowerCase().includes(q) ||
        String(ch.chapterNumber).includes(q)
      );
    })
    .sort((a, b) => {
      const numA = typeof a.chapterNumber === 'number' ? a.chapterNumber : parseFloat(a.chapterNumber) || 0;
      const numB = typeof b.chapterNumber === 'number' ? b.chapterNumber : parseFloat(b.chapterNumber) || 0;
      return sortAsc ? numA - numB : numB - numA;
    });

  // Calculate next or current chapter to resume
  const currentChapter = progress
    ? chapters.find((ch) => ch.id === progress.chapterId) || chapters[0]
    : chapters[0];

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: `Check out ${item.title} on OmniComic!`,
          url: window.location.href,
        });
      } catch {
        // Ignored
      }
    } else {
      navigator.clipboard.writeText(`${item.title} - Read on OmniComic`);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center sm:p-4">
      {/* Container Dialog */}
      <div 
        id={`detail-modal-${item.id}`}
        className="relative w-full max-w-2xl bg-zinc-950 border-t sm:border border-zinc-800 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col animate-in fade-in slide-in-from-bottom-6 duration-200"
      >
        {/* Header / Backdrop Hero */}
        <div className="relative h-48 sm:h-60 w-full overflow-hidden flex-shrink-0 bg-zinc-900">
          <img
            src={item.bannerUrl || item.coverUrl}
            alt={item.title}
            className="w-full h-full object-cover filter blur-xs brightness-40 scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />

          {/* Close button */}
          <button
            id="modal-close-btn"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black/90 text-zinc-300 hover:text-white transition-all z-10 backdrop-blur-md border border-zinc-700/50"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content Over Header */}
          <div className="absolute bottom-4 left-4 right-4 flex items-end gap-4">
            {/* Poster Thumbnail */}
            <div className="relative w-24 h-34 sm:w-28 sm:h-40 rounded-xl overflow-hidden shadow-2xl border border-zinc-700/80 bg-zinc-900 flex-shrink-0">
              <img
                src={item.coverUrl}
                alt={item.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Main Titles and Source Pill */}
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    item.source === 'batcave'
                      ? 'bg-red-600 text-white'
                      : 'bg-orange-600 text-white'
                  }`}
                >
                  {item.source === 'batcave' ? 'Batcave.biz' : 'MangaDex'}
                </span>
                <span className="text-[11px] text-zinc-400 font-medium">
                  {item.status} • {item.releaseYear || 'Recent'}
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-white leading-tight line-clamp-2">
                {item.title}
              </h2>

              {item.altTitles && item.altTitles.length > 0 && (
                <p className="text-xs text-zinc-400 truncate mt-0.5 italic">
                  {item.altTitles[0]}
                </p>
              )}

              {/* Rating & Issue Count */}
              <div className="flex items-center gap-3 mt-2 text-xs text-zinc-300">
                {item.rating && (
                  <span className="flex items-center gap-1 text-amber-400 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    {item.rating.toFixed(1)}
                  </span>
                )}
                <span>
                  {item.totalChapters} {item.type === 'comic' ? 'Issues' : 'Chapters'}
                </span>
                {item.views && (
                  <span className="text-zinc-500">{item.views} reads</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="px-4 py-3 bg-zinc-950 border-b border-zinc-800/80 flex items-center gap-2.5">
          {/* Main Primary Action Button */}
          <button
            id="detail-resume-reading-btn"
            onClick={() => onStartReading(item, currentChapter, progress?.pageIndex || 0)}
            className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition-all"
          >
            <Play className="w-4 h-4 fill-white" />
            {progress && progress.percentage > 0
              ? `Resume ${currentChapter.title} (${progress.percentage}%)`
              : `Start Reading ${currentChapter.title}`}
          </button>

          {/* Bookmark / My List toggle */}
          <button
            id="detail-bookmark-btn"
            onClick={() => onToggleSave(item, activeCategory)}
            className={`py-3 px-4 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all border ${
              isSaved
                ? 'bg-zinc-800 border-red-500/80 text-red-400'
                : 'bg-zinc-900 border-zinc-700 text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            <span>{isSaved ? 'Saved' : 'Add to List'}</span>
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all"
            aria-label="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content: Meta & Chapters */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          {/* Progress Card if in progress */}
          {progress && (
            <div className="p-3 rounded-xl bg-zinc-900/80 border border-red-900/40 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs text-red-400 font-semibold">
                  <Clock className="w-3.5 h-3.5" />
                  Currently Reading: {progress.chapterTitle}
                </div>
                <div className="text-xs text-zinc-400">
                  Page {progress.pageIndex + 1} of {progress.totalPages} ({progress.percentage}%)
                </div>
              </div>
              <button
                onClick={() => onStartReading(item, currentChapter, progress.pageIndex)}
                className="px-3 py-1.5 rounded-lg bg-red-600/90 text-white text-xs font-bold hover:bg-red-500"
              >
                Jump In
              </button>
            </div>
          )}

          {/* Genres Badges */}
          <div className="flex flex-wrap gap-1.5">
            {item.genres.map((genre) => (
              <span
                key={genre}
                className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-medium"
              >
                {genre}
              </span>
            ))}
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
              Synopsis
            </h4>
            <p className={`text-xs sm:text-sm text-zinc-300 leading-relaxed ${descExpanded ? '' : 'line-clamp-3'}`}>
              {item.description}
            </p>
            {item.description.length > 180 && (
              <button
                onClick={() => setDescExpanded(!descExpanded)}
                className="mt-1 text-xs text-red-400 font-semibold flex items-center gap-1 hover:underline"
              >
                {descExpanded ? 'Show Less' : 'Read More'}
                {descExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>

          {/* Creators & Info Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
            {item.publisher && (
              <div>
                <span className="text-zinc-500 block font-medium">Publisher</span>
                <span className="text-zinc-200 font-semibold">{item.publisher}</span>
              </div>
            )}
            {item.author && (
              <div>
                <span className="text-zinc-500 block font-medium">Author</span>
                <span className="text-zinc-200 font-semibold">{item.author}</span>
              </div>
            )}
            {item.artist && (
              <div>
                <span className="text-zinc-500 block font-medium">Artist</span>
                <span className="text-zinc-200 font-semibold">{item.artist}</span>
              </div>
            )}
            <div>
              <span className="text-zinc-500 block font-medium">Source</span>
              <span className="text-zinc-200 font-semibold">
                {item.source === 'batcave' ? 'batcave.biz' : 'mangadex.org'}
              </span>
            </div>
          </div>

          {/* Chapters / Issues Header with Search & Sort */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-red-500" />
                {item.type === 'comic' ? 'Issues' : 'Chapters'} ({chapters.length})
              </h3>

              <button
                onClick={() => setSortAsc(!sortAsc)}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white px-2 py-1 rounded bg-zinc-900 border border-zinc-800"
              >
                <ArrowUpDown className="w-3 h-3" />
                <span>{sortAsc ? 'Oldest First' : 'Newest First'}</span>
              </button>
            </div>

            {/* Chapter Filter Search */}
            {chapters.length > 6 && (
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder={`Search ${item.type === 'comic' ? 'issue' : 'chapter'} number...`}
                  value={searchChapter}
                  onChange={(e) => setSearchChapter(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-hidden focus:border-red-500"
                />
              </div>
            )}

            {/* Chapter Items List */}
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {filteredChapters.map((ch) => {
                const isCurrentRead = progress?.chapterId === ch.id;
                return (
                  <div
                    key={ch.id}
                    id={`chapter-item-${ch.id}`}
                    onClick={() => onStartReading(item, ch, isCurrentRead ? progress?.pageIndex : 0)}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border active:scale-[0.99] ${
                      isCurrentRead
                        ? 'bg-red-950/30 border-red-800/80 text-white'
                        : 'bg-zinc-900/90 border-zinc-800/80 hover:bg-zinc-850 hover:border-zinc-700 text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isCurrentRead ? (
                        <CheckCircle2 className="w-4 h-4 text-red-500 flex-shrink-0" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-zinc-600 flex-shrink-0" />
                      )}
                      <div className="truncate">
                        <div className="font-semibold text-xs text-white truncate">
                          {ch.title}
                        </div>
                        <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
                          {ch.pageCount && <span>{ch.pageCount} pages</span>}
                          {ch.scanlationGroup && (
                            <>
                              <span>•</span>
                              <span className="truncate">{ch.scanlationGroup}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 text-xs font-semibold text-zinc-300 hover:bg-red-600 hover:text-white transition-colors ml-2 flex-shrink-0"
                    >
                      Read
                    </button>
                  </div>
                );
              })}

              {filteredChapters.length === 0 && (
                <div className="text-center py-6 text-xs text-zinc-500">
                  No chapters matched your search.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
