import React, { useState, useEffect, useCallback } from 'react';
import { Search, Flame, Clock, Layers, X, Globe, AlertCircle, RefreshCw } from 'lucide-react';
import { ComicItem, ReadingProgress } from '../../types';
import { ApiService } from '../../services/api';
import { ComicCard } from '../common/ComicCard';
import { GridSkeleton } from '../common/SkeletonLoader';

interface MangaScreenProps {
  onSelectManga: (item: ComicItem) => void;
  onToggleSave: (item: ComicItem) => void;
  isSaved: (itemId: string) => boolean;
  getProgress: (itemId: string) => ReadingProgress | undefined;
}

const GENRES = ['All', 'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
  'Mystery', 'Psychological', 'Romance', 'Sci-Fi', 'Slice of Life', 'Supernatural', 'Thriller'];

export const MangaScreen: React.FC<MangaScreenProps> = ({
  onSelectManga,
  onToggleSave,
  isSaved,
  getProgress,
}) => {
  const [mangaList, setMangaList]     = useState<ComicItem[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [activeTab, setActiveTab]     = useState<'all' | 'popular' | 'recent'>('all');

  const fetchManga = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const data = await ApiService.getManga({
        query: searchQuery || undefined,
        genre: selectedGenre !== 'All' ? selectedGenre : undefined,
        sort:  activeTab !== 'all' ? activeTab : undefined,
      });
      if (signal?.aborted) return;
      setMangaList(data);
    } catch (err: unknown) {
      if (signal?.aborted) return;
      const msg =
        err && typeof err === 'object' && 'userMessage' in err
          ? (err as { userMessage: string }).userMessage
          : 'Unable to load manga from MangaDex. Please check your connection and try again.';
      setError(msg);
      setMangaList([]);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [searchQuery, selectedGenre, activeTab]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => fetchManga(controller.signal), searchQuery ? 350 : 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [fetchManga]);

  return (
    <div className="flex-1 max-w-5xl mx-auto px-4 py-5 space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-950 border border-orange-800/80 text-orange-300 flex items-center gap-1">
              <Globe className="w-3 h-3" />
              Source: mangadex.org
            </span>
            <span className="text-xs text-zinc-400 font-mono">Live API</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            MangaDex Explorer
          </h1>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
          <input
            id="manga-search-input"
            type="text"
            placeholder="Search Berserk, One Piece, JJK…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 p-1 rounded text-zinc-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Sort Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-3 overflow-x-auto">
        {([
          { key: 'all',     label: 'Popular',        icon: <Layers className="w-3.5 h-3.5" /> },
          { key: 'popular', label: 'Top Followed',   icon: <Flame  className="w-3.5 h-3.5 text-orange-400" /> },
          { key: 'recent',  label: 'Latest Updates', icon: <Clock  className="w-3.5 h-3.5 text-blue-400" /> },
        ] as const).map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === key
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            {icon}{label}
          </button>
        ))}
      </div>

      {/* Genre Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {GENRES.map((genre) => (
          <button
            key={genre}
            onClick={() => setSelectedGenre(genre)}
            className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
              selectedGenre === genre
                ? 'bg-orange-950 border-orange-700 text-orange-200 font-bold'
                : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
            }`}
          >
            {genre}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <GridSkeleton count={8} />
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl bg-zinc-900/40 border border-dashed border-red-900/60 my-6 gap-4">
          <div className="w-14 h-14 rounded-2xl bg-red-950/40 border border-red-900 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-200 mb-1">MangaDex unavailable</h3>
            <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">{error}</p>
          </div>
          <button
            onClick={() => fetchManga()}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-100 flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try Again
          </button>
        </div>
      ) : mangaList.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {mangaList.map((manga) => (
            <ComicCard
              key={manga.id}
              item={manga}
              progress={getProgress(manga.id)}
              isSaved={isSaved(manga.id)}
              onSelect={onSelectManga}
              onToggleSave={() => onToggleSave(manga)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl bg-zinc-900/40 border border-dashed border-zinc-800 my-6 gap-3">
          <Search className="w-8 h-8 text-zinc-500" />
          <h3 className="text-base font-bold text-zinc-200">No manga found</h3>
          <p className="text-xs text-zinc-400">
            {searchQuery
              ? `MangaDex returned no results for "${searchQuery}".`
              : 'No manga matched your filters.'}
          </p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedGenre('All'); }}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-100 flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};
