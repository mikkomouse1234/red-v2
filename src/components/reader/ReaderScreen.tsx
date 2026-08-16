import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, AlertCircle, RefreshCw, ArrowLeft, ArrowRight, List } from 'lucide-react';
import { ComicItem, ChapterItem } from '../../types';
import { ApiService } from '../../services/api';

interface Props {
  item: ComicItem;
  chapter: ChapterItem;
  initialPage: number;
  onClose: () => void;
  onNextChapter: (ch: ChapterItem) => void;
  onPrevChapter: (ch: ChapterItem) => void;
}

export const ReaderScreen: React.FC<Props> = ({
  item, chapter, initialPage, onClose, onNextChapter, onPrevChapter
}) => {
  const [pages, setPages]     = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [pageIdx, setPageIdx] = useState(initialPage);
  const [showUI, setShowUI]   = useState(true);
  const [showChapters, setShowChapters] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const chapters = item.chapters || [];
  const currentIdx = chapters.findIndex(c => c.id === chapter.id);
  const prevChapter = currentIdx > 0 ? chapters[currentIdx - 1] : null;
  const nextChapter = currentIdx < chapters.length - 1 ? chapters[currentIdx + 1] : null;

  const loadPages = useCallback(async () => {
    setLoading(true); setError(null); setPages([]); setPageIdx(0);
    try {
      const p = await ApiService.getPages(item, chapter);
      if (p.length === 0 && item.source === 'comicvine') {
        setError('ComicVine does not provide readable page images through its public API. Open the issue on ComicVine.com to read it there.');
      } else if (p.length === 0) {
        setError('No pages found for this chapter.');
      } else {
        setPages(p);
      }
    } catch (e: unknown) {
      setError(e && typeof e === 'object' && 'userMessage' in e ? (e as { userMessage: string }).userMessage : 'Unable to load chapter pages.');
    } finally {
      setLoading(false);
    }
  }, [item, chapter]);

  useEffect(() => { loadPages(); }, [loadPages]);

  const resetHideTimer = useCallback(() => {
    setShowUI(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowUI(false), 3000);
  }, []);

  useEffect(() => { resetHideTimer(); return () => { if (hideTimer.current) clearTimeout(hideTimer.current); }; }, []);

  const prev = () => { if (pageIdx > 0) { setPageIdx(p => p - 1); resetHideTimer(); } };
  const next = () => { if (pageIdx < pages.length - 1) { setPageIdx(p => p + 1); resetHideTimer(); } };

  return (
    <div className="fixed inset-0 bg-black flex flex-col" onClick={resetHideTimer}>
      {/* Top bar */}
      <div className={`absolute top-0 inset-x-0 z-20 bg-gradient-to-b from-black/80 to-transparent transition-opacity duration-300 ${showUI ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={onClose} className="p-2 rounded-xl bg-black/40 text-white hover:bg-black/60">
            <X className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-zinc-400 truncate">{item.title}</p>
            <p className="text-sm font-bold text-white truncate">{chapter.title}</p>
          </div>
          <button onClick={() => setShowChapters(true)} className="p-2 rounded-xl bg-black/40 text-white hover:bg-black/60">
            <List className="w-5 h-5" />
          </button>
        </div>
        {/* Page progress */}
        {pages.length > 0 && (
          <div className="px-4 pb-2 flex items-center gap-2">
            <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${((pageIdx + 1) / pages.length) * 100}%` }} />
            </div>
            <span className="text-[11px] text-zinc-400 font-mono">{pageIdx + 1}/{pages.length}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-zinc-700 border-t-orange-500 rounded-full animate-spin" />
            <p className="text-sm text-zinc-400">Loading pages…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 p-8 text-center max-w-sm">
            <AlertCircle className="w-10 h-10 text-red-500" />
            <p className="text-sm text-zinc-300 leading-relaxed">{error}</p>
            {item.source === 'mangadex' && (
              <button onClick={loadPages} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white">
                <RefreshCw className="w-3.5 h-3.5" /> Try Again
              </button>
            )}
          </div>
        ) : (
          <img
            key={pages[pageIdx]}
            src={pages[pageIdx]}
            alt={`Page ${pageIdx + 1}`}
            className="max-h-full max-w-full object-contain select-none"
            onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.2'; }}
          />
        )}
      </div>

      {/* Navigation arrows */}
      {pages.length > 0 && (
        <>
          <button onClick={prev} disabled={pageIdx === 0}
            className={`absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-black/50 text-white transition-opacity ${showUI && pageIdx > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button onClick={next} disabled={pageIdx === pages.length - 1}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-black/50 text-white transition-opacity ${showUI && pageIdx < pages.length - 1 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Bottom bar — chapter nav */}
      <div className={`absolute bottom-0 inset-x-0 z-20 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 ${showUI ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="flex items-center justify-between px-4 py-4 gap-2">
          <button onClick={() => prevChapter && onPrevChapter(prevChapter)} disabled={!prevChapter}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/50 text-xs font-semibold text-zinc-300 hover:text-white disabled:opacity-30">
            <ArrowLeft className="w-4 h-4" /> Prev Chapter
          </button>
          <span className="text-xs text-zinc-500">{currentIdx + 1} of {chapters.length}</span>
          <button onClick={() => nextChapter && onNextChapter(nextChapter)} disabled={!nextChapter}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/50 text-xs font-semibold text-zinc-300 hover:text-white disabled:opacity-30">
            Next Chapter <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chapter list drawer */}
      {showChapters && (
        <div className="fixed inset-0 z-30 flex items-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowChapters(false)} />
          <div className="relative w-full bg-zinc-950 border-t border-zinc-800 max-h-[70vh] flex flex-col rounded-t-3xl">
            <div className="px-5 py-4 flex items-center justify-between border-b border-zinc-800">
              <h3 className="font-bold text-white">Chapters</h3>
              <button onClick={() => setShowChapters(false)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="overflow-y-auto flex-1">
              {chapters.map((ch, i) => (
                <button key={ch.id} onClick={() => { setShowChapters(false); if (ch.id !== chapter.id) { i < currentIdx ? onPrevChapter(ch) : onNextChapter(ch); } }}
                  className={`w-full px-5 py-3 text-left flex items-center gap-3 hover:bg-zinc-900 border-b border-zinc-800/40 ${ch.id === chapter.id ? 'bg-zinc-900' : ''}`}>
                  {ch.id === chapter.id && <span className="w-1 h-4 rounded-full bg-orange-500 shrink-0" />}
                  <span className="text-sm text-zinc-200">{ch.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
