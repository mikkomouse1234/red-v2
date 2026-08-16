import React, { useState, useEffect, useCallback } from 'react';
import { ComicItem } from '../../types';
import { ApiService } from '../../services/api';
import { SearchBar } from '../common/SearchBar';
import { ItemCard } from '../common/ItemCard';
import { GridSkeleton } from '../common/Skeleton';
import { ErrorState } from '../common/ErrorState';
import { Flame, Clock, Star, Globe } from 'lucide-react';

const GENRES = ['All','Action','Adventure','Comedy','Drama','Fantasy','Horror','Mystery','Romance','Sci-Fi','Slice of Life','Supernatural'];

interface Props { onSelect: (item: ComicItem) => void; }

export const MangaScreen: React.FC<Props> = ({ onSelect }) => {
  const [items, setItems]   = useState<ComicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const [query, setQuery]   = useState('');
  const [sort, setSort]     = useState('popular');
  const [genre, setGenre]   = useState('All');

  const load = useCallback(async (sig?: AbortSignal) => {
    setLoading(true); setError(null);
    try {
      const data = await ApiService.searchManga(query, query ? undefined : sort, genre);
      if (!sig?.aborted) setItems(data);
    } catch (e: unknown) {
      if (sig?.aborted) return;
      setError(e && typeof e === 'object' && 'userMessage' in e ? (e as { userMessage: string }).userMessage : 'Unable to load manga.');
      setItems([]);
    } finally {
      if (!sig?.aborted) setLoading(false);
    }
  }, [query, sort, genre]);

  useEffect(() => {
    const c = new AbortController();
    const t = setTimeout(() => load(c.signal), query ? 400 : 0);
    return () => { clearTimeout(t); c.abort(); };
  }, [load]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-5 space-y-5 pb-10">
      {/* Source badge */}
      <div className="flex items-center gap-2">
        <Globe className="w-3.5 h-3.5 text-orange-400" />
        <span className="text-xs text-zinc-400">Live from <span className="text-orange-400 font-semibold">mangadex.org</span></span>
      </div>

      <SearchBar value={query} onChange={setQuery} placeholder="Search any manga on MangaDex…" accentClass="focus:border-orange-500" />

      {/* Sort tabs */}
      {!query && (
        <div className="flex gap-2">
          {[
            { k: 'popular', label: 'Popular', icon: <Flame className="w-3.5 h-3.5" /> },
            { k: 'recent',  label: 'Recent',  icon: <Clock className="w-3.5 h-3.5" /> },
            { k: 'rating',  label: 'Top Rated', icon: <Star className="w-3.5 h-3.5" /> },
          ].map(({ k, label, icon }) => (
            <button key={k} onClick={() => setSort(k)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                sort === k ? 'bg-orange-600 text-white border-orange-600' : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
              }`}>
              {icon}{label}
            </button>
          ))}
        </div>
      )}

      {/* Genre pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {GENRES.map(g => (
          <button key={g} onClick={() => setGenre(g)}
            className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap border transition-all ${
              genre === g ? 'bg-orange-950 border-orange-700 text-orange-200' : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-white'
            }`}>
            {g}
          </button>
        ))}
      </div>

      {loading ? <GridSkeleton count={10} />
        : error  ? <ErrorState message={error} onRetry={() => load()} />
        : items.length === 0 ? (
          <div className="py-16 text-center text-sm text-zinc-500">
            {query ? `No manga found for "${query}" on MangaDex.` : 'No manga to display.'}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {items.map(item => <ItemCard key={item.id} item={item} onSelect={onSelect} />)}
          </div>
        )}
    </div>
  );
};
