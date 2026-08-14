import React, { useState } from 'react';
import { 
  Play, 
  Bookmark, 
  History, 
  Sparkles, 
  ChevronRight, 
  Filter, 
  Layers, 
  BookText, 
  Compass,
  CheckCircle,
  Clock
} from 'lucide-react';
import { ComicItem, ReadingProgress, SavedItem, ListCategory, ActiveTab } from '../../types';
import { ContinueReadingCard } from '../common/ContinueReadingCard';
import { ComicCard } from '../common/ComicCard';
import { EmptyState } from '../common/EmptyState';

interface HomeScreenProps {
  history: ReadingProgress[];
  myList: SavedItem[];
  onSelectComic: (item: ComicItem) => void;
  onResumeReading: (progress: ReadingProgress) => void;
  onToggleSave: (item: ComicItem) => void;
  onTabChange: (tab: ActiveTab) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  history,
  myList,
  onSelectComic,
  onResumeReading,
  onToggleSave,
  onTabChange,
}) => {
  const [listFilter, setListFilter] = useState<'All' | 'Comics' | 'Manga' | 'Completed'>('All');
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'progress'>('recent');

  // Filter My List
  const filteredList = myList.filter((saved) => {
    if (listFilter === 'Comics') return saved.item.type === 'comic';
    if (listFilter === 'Manga') return saved.item.type === 'manga';
    if (listFilter === 'Completed') return saved.category === 'Completed';
    return true;
  });

  // Sort My List
  filteredList.sort((a, b) => {
    if (sortBy === 'title') {
      return a.item.title.localeCompare(b.item.title);
    }
    return b.addedAt - a.addedAt;
  });

  const getProgressForItem = (itemId: string) => {
    return history.find((h) => h.itemId === itemId);
  };

  return (
    <div className="flex-1 max-w-5xl mx-auto px-4 py-5 space-y-8 pb-24">
      {/* Quick Hero Banner / Greeting */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 border border-zinc-800/80 p-5 sm:p-6 shadow-xl">
        <div className="relative z-10 max-w-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-600/90 text-white">
              Reader Hub
            </span>
            <span className="text-xs text-zinc-400 font-mono">Batcave & MangaDex</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
            Welcome to <span className="text-red-500">OmniComic</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 leading-relaxed">
            Your dedicated mobile-ready reader for comic books and manga. Sourced directly from Batcave and MangaDex with vertical scroll reading.
          </p>

          {/* Quick Jump Buttons */}
          <div className="flex items-center gap-2.5 mt-4">
            <button
              onClick={() => onTabChange('comics')}
              className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-red-600/20 transition-all"
            >
              <BookText className="w-3.5 h-3.5" />
              Browse Comics
            </button>
            <button
              onClick={() => onTabChange('manga')}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 font-bold text-xs flex items-center gap-1.5 border border-zinc-700 transition-all"
            >
              <Layers className="w-3.5 h-3.5 text-orange-400" />
              Browse Manga
            </button>
          </div>
        </div>

        {/* Decorative subtle background gradient */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-red-600/10 to-transparent pointer-events-none" />
      </div>

      {/* ================= CONTINUE READING SECTION ================= */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-5 bg-red-600 rounded-full" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Continue Reading
            </h2>
            {history.length > 0 && (
              <span className="text-xs font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full">
                {history.length}
              </span>
            )}
          </div>
        </div>

        {history.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {history.slice(0, 4).map((prog) => (
              <ContinueReadingCard
                key={prog.itemId}
                progress={prog}
                onResume={onResumeReading}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            type="history"
            title="No reading history yet"
            description="Start reading any comic from Batcave or manga from MangaDex to instantly track and resume your progress."
            actionText="Explore Comics"
            onAction={() => onTabChange('comics')}
          />
        )}
      </section>

      {/* ================= MY LIST / LIBRARY SECTION ================= */}
      <section className="space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-5 bg-red-600 rounded-full" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              My List
            </h2>
            <span className="text-xs font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full">
              {myList.length} titles
            </span>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(['All', 'Comics', 'Manga'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setListFilter(filter)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  listFilter === filter
                    ? 'bg-red-600 border-red-500 text-white shadow-sm shadow-red-600/30'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {filteredList.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {filteredList.map((saved) => (
              <ComicCard
                key={saved.itemId}
                item={saved.item}
                progress={getProgressForItem(saved.itemId)}
                isSaved={true}
                onSelect={onSelectComic}
                onToggleSave={() => onToggleSave(saved.item)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            type="list"
            title="Your reading list is empty"
            description="Tap the bookmark icon on any comic or manga to save it to your personal library for quick access."
            actionText="Discover Titles"
            onAction={() => onTabChange('comics')}
          />
        )}
      </section>
    </div>
  );
};
