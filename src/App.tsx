import React, { useState } from 'react';
import { ComicItem, ChapterItem } from './types';
import { ApiService } from './services/api';
import { ComicsScreen } from './components/comics/ComicsScreen';
import { MangaScreen } from './components/manga/MangaScreen';
import { DetailModal } from './components/common/DetailModal';
import { ReaderScreen } from './components/reader/ReaderScreen';
import { BookOpen, Layers } from 'lucide-react';

type Tab = 'comics' | 'manga';

interface ReadingSession {
  item: ComicItem;
  chapter: ChapterItem;
  pageIndex: number;
}

export default function App() {
  const [tab, setTab] = useState<Tab>('manga');
  const [selectedItem, setSelectedItem] = useState<ComicItem | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [reading, setReading] = useState<ReadingSession | null>(null);

  const handleSelect = async (item: ComicItem) => {
    setLoadingDetail(true);
    setDetailError(null);

    try {
      if (item.source === 'mangadex') {
        const [details, chapters] = await Promise.all([
          ApiService.getMangaDetails(item.id),
          ApiService.getMangaChapters(item.id),
        ]);
        setSelectedItem({ ...details, chapters, totalChapters: chapters.length });
      } else {
        // ComicVine: fetch volume + issues
        const [details, issues] = await Promise.all([
          ApiService.getComicVolume(item.id),
          ApiService.getComicIssues(item.id),
        ]);
        setSelectedItem({ ...(details || item), chapters: issues, totalChapters: issues.length });
      }
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'userMessage' in err
        ? (err as { userMessage: string }).userMessage
        : 'Unable to load details.';
      setDetailError(msg);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleRead = (item: ComicItem, chapter: ChapterItem) => {
    setSelectedItem(null);
    setReading({ item, chapter, pageIndex: 0 });
  };

  if (reading) {
    return (
      <ReaderScreen
        item={reading.item}
        chapter={reading.chapter}
        initialPage={reading.pageIndex}
        onClose={() => setReading(null)}
        onNextChapter={(ch) => setReading({ ...reading, chapter: ch, pageIndex: 0 })}
        onPrevChapter={(ch) => setReading({ ...reading, chapter: ch, pageIndex: 0 })}
      />
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur border-b border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-red-500" />
            <span className="font-black text-lg tracking-tight text-white">OmniComic</span>
          </div>
          <div className="flex gap-1 bg-zinc-900 rounded-xl p-1">
            <button
              onClick={() => setTab('manga')}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${tab === 'manga' ? 'bg-orange-600 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              Manga
            </button>
            <button
              onClick={() => setTab('comics')}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${tab === 'comics' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              Comics
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1">
        {tab === 'manga'  && <MangaScreen  onSelect={handleSelect} />}
        {tab === 'comics' && <ComicsScreen onSelect={handleSelect} />}
      </main>

      {/* Loading overlay */}
      {loadingDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-zinc-700 border-t-orange-500 rounded-full animate-spin" />
          <p className="text-sm text-zinc-300">Loading details…</p>
        </div>
      )}

      {/* Error toast */}
      {detailError && !loadingDetail && (
        <div className="fixed inset-x-4 bottom-6 z-50 max-w-sm mx-auto">
          <div className="bg-zinc-900 border border-red-800 rounded-2xl p-4 flex gap-3 items-start shadow-xl">
            <span className="text-xl">⚠️</span>
            <div className="flex-1">
              <p className="text-sm text-zinc-200 font-semibold mb-1">Couldn't load details</p>
              <p className="text-xs text-zinc-400">{detailError}</p>
            </div>
            <button onClick={() => setDetailError(null)} className="text-zinc-500 hover:text-white text-lg leading-none">×</button>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {selectedItem && !loadingDetail && !detailError && (
        <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} onRead={handleRead} />
      )}
    </div>
  );
}
