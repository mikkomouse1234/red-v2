import React, { useState, useEffect } from 'react';
import { Search, Filter, Sparkles, Flame, Clock, Layers, Star, X } from 'lucide-react';
import { ComicItem, ReadingProgress } from '../../types';
import { ApiService } from '../../services/api';
import { ComicCard } from '../common/ComicCard';
import { GridSkeleton } from '../common/SkeletonLoader';
import { EmptyState } from '../common/EmptyState';

interface ComicsScreenProps {
  onSelectComic: (item: ComicItem) => void;
  onToggleSave: (item: ComicItem) => void;
  isSaved: (itemId: string) => boolean;
  getProgress: (itemId: string) => ReadingProgress | undefined;
}

export const ComicsScreen: React.FC<ComicsScreenProps> = ({
  onSelectComic,
  onToggleSave,
  isSaved,
  getProgress,
}) => {
  const [comics, setComics] = useState<ComicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedPublisher, setSelectedPublisher] = useState<string>('All');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'all' | 'popular' | 'recent'>('all');

  const publishers = ['All', 'DC Comics', 'Marvel Comics', 'Image Comics', 'DC Vertigo'];
  const genres = ['All', 'Superhero', 'Dark Noir', 'Sci-Fi', 'Horror', 'Mystery', 'Crime'];

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const sortOption = activeTab === 'all' ? undefined : activeTab;

    ApiService.getComics({
      query: searchQuery,
      publisher: selectedPublisher,
      genre: selectedGenre,
      sort: sortOption,
    })
      .then((data) => {
        if (isMounted) {
          setComics(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch comics:', err);
        if (isMounted) {
          setComics([]);
          setError(
            err && typeof err === 'object' && 'userMessage' in err
              ? (err as { userMessage: string }).userMessage
              : 'The comics source is not connected yet.'
          );
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [searchQuery, selectedPublisher, selectedGenre, activeTab]);

  return (
    <div className="flex-1 max-w-5xl mx-auto px-4 py-5 space-y-6 pb-24">
      {/* Header & Source Identifier */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-950 border border-red-800/80 text-red-300">
              Source: authorized comics feed required
            </span>
            <span className="text-xs text-zinc-400 font-mono">Live source required</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Comics Collection
          </h1>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
          <input
            id="comics-search-input"
            type="text"
            placeholder="Search Batman, Marvel, Watchmen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-hidden focus:border-red-600 transition-colors shadow-inner"
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

      {/* Main Sort Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'all'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          All Comics
        </button>
        <button
          onClick={() => setActiveTab('popular')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'popular'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          Popular / Recommended
        </button>
        <button
          onClick={() => setActiveTab('recent')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'recent'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          Recently Added
        </button>
      </div>

      {/* Publisher Filter Pills */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {publishers.map((pub) => (
            <button
              key={pub}
              onClick={() => setSelectedPublisher(pub)}
              className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                selectedPublisher === pub
                  ? 'bg-zinc-800 border-zinc-600 text-white font-bold'
                  : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
              }`}
            >
              {pub}
            </button>
          ))}
        </div>

        {/* Genre Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all border ${
                selectedGenre === genre
                  ? 'bg-red-950 border-red-800 text-red-300 font-bold'
                  : 'bg-zinc-900/40 border-zinc-800/60 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* Comics Grid */}
      {loading ? (
        <GridSkeleton count={8} />
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-10 text-center rounded-2xl bg-zinc-900/40 border border-dashed border-red-900/60 my-6 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-red-950/40 border border-red-900 flex items-center justify-center text-red-400 text-xl font-black">!</div>
          <h3 className="text-base font-bold text-zinc-200">Comics source not connected</h3>
          <p className="text-xs text-zinc-400 max-w-md leading-relaxed">{error}</p>
        </div>
      ) : comics.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {comics.map((comic) => (
            <ComicCard
              key={comic.id}
              item={comic}
              progress={getProgress(comic.id)}
              isSaved={isSaved(comic.id)}
              onSelect={onSelectComic}
              onToggleSave={() => onToggleSave(comic)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          type="search"
          title="No comics found"
          description={`No titles matched "${searchQuery || selectedPublisher || selectedGenre}".`}
          actionText="Reset Filters"
          onAction={() => {
            setSearchQuery('');
            setSelectedPublisher('All');
            setSelectedGenre('All');
          }}
        />
      )}
    </div>
  );
};
