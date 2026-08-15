import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ArrowLeft, 
  Menu, 
  Bookmark, 
  ChevronLeft, 
  ChevronRight, 
  Maximize, 
  Minimize, 
  Sliders, 
  Layers, 
  X, 
  Check, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Moon,
  Sun,
  BookOpen
} from 'lucide-react';
import { 
  ComicItem, 
  ChapterItem, 
  ReaderSettings, 
  ReadingProgress, 
  ReadingDirection,
  FitMode
} from '../../types';
import { StorageService } from '../../services/storage';
import { ApiService } from '../../services/api';
import { PageSkeleton } from '../common/SkeletonLoader';

interface ReaderScreenProps {
  item: ComicItem;
  initialChapter: ChapterItem;
  initialPage?: number;
  onClose: () => void;
  onChapterChange?: (chapter: ChapterItem) => void;
}

export const ReaderScreen: React.FC<ReaderScreenProps> = ({
  item,
  initialChapter,
  initialPage = 0,
  onClose,
  onChapterChange,
}) => {
  // State
  const [currentChapter, setCurrentChapter] = useState<ChapterItem>(initialChapter);
  const [pages, setPages] = useState<string[]>([]);
  const [loadingPages, setLoadingPages] = useState<boolean>(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(initialPage);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [showMenuDrawer, setShowMenuDrawer] = useState<boolean>(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false);
  const [settings, setSettings] = useState<ReaderSettings>(StorageService.getSettings());
  const [zoomScale, setZoomScale] = useState<number>(1);

  // References
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<number>(0);

  // Load Saved Status
  useEffect(() => {
    setIsSaved(StorageService.isInMyList(item.id));
  }, [item.id]);

  // Load Pages for the current chapter
  useEffect(() => {
    let isMounted = true;
    setLoadingPages(true);
    setPageError(null);
    setPages([]);

    ApiService.getChapterPages(item.id, currentChapter.id, item.type)
      .then((loadedPages) => {
        if (!isMounted) return;
        setPages(loadedPages);
        setLoadingPages(false);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        console.error('Failed to load chapter pages:', err);
        const msg =
          err && typeof err === 'object' && 'userMessage' in err
            ? (err as { userMessage: string }).userMessage
            : 'Unable to load this chapter. Please try again.';
        setPageError(msg);
        setLoadingPages(false);
      });

    return () => {
      isMounted = false;
    };
  }, [item.id, currentChapter.id, item.type]);

  // Auto-hide controls logic
  const resetHideTimer = useCallback(() => {
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    if (settings.autoHideControls) {
      hideControlsTimer.current = setTimeout(() => {
        setShowControls(false);
      }, settings.autoHideDelay || 3500);
    }
  }, [settings.autoHideControls, settings.autoHideDelay]);

  // Toggle Controls on user screen tap
  const handleToggleControls = () => {
    setShowControls((prev) => {
      const next = !prev;
      if (next) resetHideTimer();
      return next;
    });
  };

  // Scroll to initial page when pages load
  useEffect(() => {
    if (!loadingPages && pages.length > 0 && initialPage > 0) {
      setTimeout(() => {
        const target = pageRefs.current[initialPage];
        if (target) {
          target.scrollIntoView({ behavior: 'auto', block: 'start' });
        }
      }, 100);
    }
  }, [loadingPages, pages.length, initialPage]);

  // Scroll observer to track active page and update progress in real-time
  useEffect(() => {
    if (loadingPages || pages.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-page-index'));
            if (!isNaN(index)) {
              setCurrentPageIndex(index);
              
              // Persist reading progress
              StorageService.saveProgress({
                itemId: item.id,
                itemTitle: item.title,
                itemType: item.type,
                source: item.source,
                coverUrl: item.coverUrl,
                chapterId: currentChapter.id,
                chapterNumber: currentChapter.chapterNumber,
                chapterTitle: currentChapter.title,
                pageIndex: index,
                totalPages: pages.length,
                isCompleted: index >= pages.length - 1,
              });
            }
          }
        });
      },
      {
        root: containerRef.current,
        threshold: 0.35,
      }
    );

    pageRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      observer.disconnect();
    };
  }, [loadingPages, pages.length, item, currentChapter]);

  // Handle Fullscreen Mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Handle Double Tap Zoom
  const handleDoubleTap = (e: React.MouseEvent | React.TouchEvent) => {
    if (!settings.doubleTapZoom) return;
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap detected
      setZoomScale((prev) => (prev > 1 ? 1 : 2));
    }
    lastTapRef.current = now;
  };

  // Chapter Navigation
  const allChapters = item.chapters || [currentChapter];
  const currentChapterIdx = allChapters.findIndex((c) => c.id === currentChapter.id);
  const hasPrevChapter = currentChapterIdx > 0;
  const hasNextChapter = currentChapterIdx < allChapters.length - 1;

  const goToChapter = (chapter: ChapterItem, startPage = 0) => {
    setCurrentChapter(chapter);
    setCurrentPageIndex(startPage);
    setShowMenuDrawer(false);
    if (onChapterChange) onChapterChange(chapter);
    if (containerRef.current) containerRef.current.scrollTop = 0;
  };

  const jumpToPage = (index: number) => {
    setCurrentPageIndex(index);
    const target = pageRefs.current[index];
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleUpdateSettings = (partial: Partial<ReaderSettings>) => {
    const updated = StorageService.saveSettings(partial);
    setSettings(updated);
  };

  const handleToggleBookmark = () => {
    const added = StorageService.toggleMyList(item);
    setIsSaved(added);
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col bg-black text-white select-none overflow-hidden ${
        settings.theme === 'light' ? 'bg-zinc-950' : 'bg-black'
      }`}
    >
      {/* ================= TOP BAR ================= */}
      <div
        className={`fixed top-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/80 transition-transform duration-300 ${
          showControls ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="max-w-4xl mx-auto px-3 h-14 flex items-center justify-between gap-2">
          {/* Back Action */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              id="reader-back-btn"
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 active:scale-95 transition-all"
              aria-label="Back to details"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="truncate">
              <h2 className="font-bold text-xs sm:text-sm text-white truncate">
                {item.title}
              </h2>
              <p className="text-[11px] text-zinc-400 truncate flex items-center gap-1.5">
                <span className="text-red-400 font-semibold">{currentChapter.title}</span>
                <span>•</span>
                <span>{item.source === 'batcave' ? 'Batcave.biz' : 'MangaDex'}</span>
              </p>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1">
            {/* Page Count Badge */}
            <span className="text-xs font-mono font-bold bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg text-zinc-200">
              {currentPageIndex + 1} / {pages.length || currentChapter.pageCount || 1}
            </span>

            {/* Bookmark Toggle */}
            <button
              id="reader-bookmark-btn"
              onClick={handleToggleBookmark}
              className={`p-2 rounded-xl transition-all ${
                isSaved ? 'text-red-500 bg-red-950/40 border border-red-900/60' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
              title={isSaved ? 'In My List' : 'Save to My List'}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 hidden sm:flex"
              title="Fullscreen"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>

            {/* Menu Drawer Toggle */}
            <button
              id="reader-menu-btn"
              onClick={() => setShowMenuDrawer(true)}
              className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 active:scale-95"
              aria-label="Reader Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* ================= MAIN READING VIEWPORT ================= */}
      <div
        ref={containerRef}
        onClick={handleToggleControls}
        onTouchEnd={handleDoubleTap}
        onDoubleClick={handleDoubleTap}
        className="flex-1 w-full overflow-y-auto overflow-x-hidden scroll-smooth touch-pan-y"
        style={{
          backgroundColor: settings.theme === 'light' ? '#18181b' : '#000000',
        }}
      >
        {loadingPages ? (
          <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-4">
            <PageSkeleton />
            <PageSkeleton />
          </div>
        ) : pageError ? (
          <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-red-950/40 border border-red-900 flex items-center justify-center text-3xl">⚠️</div>
            <div>
              <h3 className="text-base font-bold text-white mb-2">Chapter unavailable</h3>
              <p className="text-sm text-zinc-400 max-w-xs leading-relaxed">{pageError}</p>
            </div>
            <button
              onClick={() => {
                setPageError(null);
                setLoadingPages(true);
                setPages([]);
                ApiService.getChapterPages(item.id, currentChapter.id, item.type)
                  .then((p) => { setPages(p); setLoadingPages(false); })
                  .catch((err: unknown) => {
                    const msg = err && typeof err === 'object' && 'userMessage' in err
                      ? (err as { userMessage: string }).userMessage
                      : 'Unable to load this chapter. Please try again.';
                    setPageError(msg);
                    setLoadingPages(false);
                  });
              }}
              className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm font-semibold text-white flex items-center gap-2"
            >
              Try Again
            </button>
            <button onClick={onClose} className="text-xs text-zinc-500 hover:text-zinc-300 underline">
              Back to details
            </button>
          </div>
        ) : (
          <div 
            className="flex flex-col items-center mx-auto w-full transition-transform origin-top"
            style={{
              transform: `scale(${zoomScale})`,
              gap: `${settings.pageSpacing}px`,
              maxWidth: settings.fitMode === 'fit-width' ? '820px' : '100%',
            }}
          >
            {pages.map((pageUrl, index) => (
              <div
                key={index}
                ref={(el) => (pageRefs.current[index] = el)}
                data-page-index={index}
                className="relative w-full flex justify-center bg-black overflow-hidden"
              >
                {/* Visual Page Panel Container */}
                <div className="relative w-full aspect-[2/3] max-w-2xl bg-zinc-950 flex items-center justify-center border-b border-zinc-900/60">
                  <img
                    src={pageUrl}
                    alt={`Page ${index + 1}`}
                    loading={index <= currentPageIndex + 3 ? 'eager' : 'lazy'}
                    referrerPolicy="strict-origin-when-cross-origin"
                    className="w-full h-full object-contain pointer-events-none"
                  />

                  {/* Aesthetic Comic Page Watermark / Overlay Banner for Authentic Reader Feel */}
                  <div className="absolute bottom-2 right-3 pointer-events-none opacity-30 text-[10px] font-mono text-zinc-400 bg-black/60 px-1.5 py-0.5 rounded">
                    {item.source === 'batcave' ? 'Batcave.biz' : 'MangaDex'} • P.{index + 1}
                  </div>
                </div>
              </div>
            ))}

            {/* End of Chapter Section / Advance CTA */}
            <div className="w-full max-w-lg mx-auto my-12 p-6 rounded-2xl bg-zinc-900 border border-zinc-800 text-center space-y-4 shadow-xl">
              <div className="w-12 h-12 rounded-full bg-red-600/20 border border-red-600/40 text-red-500 mx-auto flex items-center justify-center">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {currentChapter.title} Finished!
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  You have completed all {pages.length} pages of this {item.type === 'comic' ? 'issue' : 'chapter'}.
                </p>
              </div>

              {hasNextChapter ? (
                <button
                  id="reader-next-chapter-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    goToChapter(allChapters[currentChapterIdx + 1]);
                  }}
                  className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-600/30"
                >
                  <span>Next: {allChapters[currentChapterIdx + 1].title}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white font-bold text-xs uppercase tracking-wider"
                >
                  Return to Library
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ================= FLOATING PAGE PILL ================= */}
      {settings.showPageNumberBadge && !loadingPages && (
        <div className="fixed bottom-18 right-4 z-30 pointer-events-none">
          <div className="bg-black/80 backdrop-blur-md border border-zinc-800 px-3 py-1 rounded-full text-xs font-mono text-zinc-300 shadow-xl">
            <span className="text-red-400 font-bold">{currentPageIndex + 1}</span> / {pages.length}
          </div>
        </div>
      )}

      {/* ================= BOTTOM CONTROLS BAR ================= */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800/80 transition-transform duration-300 pb-safe ${
          showControls ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="max-w-xl mx-auto px-4 py-3 space-y-2.5">
          {/* Chapter Selector & Page Scrub Slider */}
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (hasPrevChapter) goToChapter(allChapters[currentChapterIdx - 1]);
              }}
              disabled={!hasPrevChapter}
              className={`p-2 rounded-xl border text-xs flex items-center gap-1 font-semibold transition-all ${
                hasPrevChapter
                  ? 'bg-zinc-900 border-zinc-700 text-zinc-200 hover:bg-zinc-800 active:scale-95'
                  : 'bg-zinc-950 border-zinc-900 text-zinc-600 opacity-50 cursor-not-allowed'
              }`}
              title="Previous Chapter"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            {/* Page Slider */}
            <div className="flex-1 flex items-center gap-2">
              <input
                id="reader-page-slider"
                type="range"
                min={0}
                max={Math.max(0, pages.length - 1)}
                value={currentPageIndex}
                onChange={(e) => {
                  e.stopPropagation();
                  jumpToPage(Number(e.target.value));
                }}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (hasNextChapter) goToChapter(allChapters[currentChapterIdx + 1]);
              }}
              disabled={!hasNextChapter}
              className={`p-2 rounded-xl border text-xs flex items-center gap-1 font-semibold transition-all ${
                hasNextChapter
                  ? 'bg-red-600 border-red-500 text-white hover:bg-red-500 active:scale-95'
                  : 'bg-zinc-950 border-zinc-900 text-zinc-600 opacity-50 cursor-not-allowed'
              }`}
              title="Next Chapter"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Bar Actions */}
          <div className="flex items-center justify-between pt-1 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomScale((z) => (z >= 2 ? 1 : z + 0.5));
                }}
                className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 flex items-center gap-1"
                title="Zoom"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                <span>{Math.round(zoomScale * 100)}%</span>
              </button>

              {zoomScale > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setZoomScale(1);
                  }}
                  className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSettingsDrawer(true);
              }}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 flex items-center gap-1"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Reader Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= MENU DRAWER (CHAPTERS & PAGES) ================= */}
      {showMenuDrawer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-sm bg-zinc-950 border-l border-zinc-800 h-full flex flex-col animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-red-500" />
                <h3 className="font-bold text-sm text-white">Chapters & Issues</h3>
              </div>
              <button
                onClick={() => setShowMenuDrawer(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chapter Selection List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {allChapters.map((ch) => {
                const isSelected = ch.id === currentChapter.id;
                return (
                  <div
                    key={ch.id}
                    onClick={() => goToChapter(ch)}
                    className={`p-3 rounded-xl cursor-pointer transition-all border flex items-center justify-between ${
                      isSelected
                        ? 'bg-red-950/40 border-red-800/80 text-white'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:bg-zinc-900'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-xs text-white">{ch.title}</div>
                      <div className="text-[11px] text-zinc-500">{ch.pageCount} pages</div>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] uppercase font-bold bg-red-600 text-white px-2 py-0.5 rounded">
                        Current
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-3 border-t border-zinc-800 space-y-2 bg-zinc-950">
              <button
                onClick={() => {
                  setShowMenuDrawer(false);
                  setShowSettingsDrawer(true);
                }}
                className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-xs font-semibold text-zinc-200 flex items-center justify-center gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5" />
                Reader Settings
              </button>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white"
              >
                Exit Reader
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= SETTINGS DRAWER ================= */}
      {showSettingsDrawer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-zinc-950 border-t sm:border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-red-500" />
                Reader Preferences
              </h3>
              <button
                onClick={() => setShowSettingsDrawer(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Page Spacing */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Page Spacing</label>
              <div className="grid grid-cols-4 gap-2">
                {[0, 4, 8, 16].map((space) => (
                  <button
                    key={space}
                    onClick={() => handleUpdateSettings({ pageSpacing: space })}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      settings.pageSpacing === space
                        ? 'bg-red-600 border-red-500 text-white'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {space}px
                  </button>
                ))}
              </div>
            </div>

            {/* Fit Mode */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Layout Fit Mode</label>
              <div className="grid grid-cols-2 gap-2">
                {(['fit-width', 'fit-both'] as FitMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => handleUpdateSettings({ fitMode: mode })}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      settings.fitMode === mode
                        ? 'bg-red-600 border-red-500 text-white'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {mode === 'fit-width' ? 'Fit Screen Width' : 'Full Immersion'}
                  </button>
                ))}
              </div>
            </div>

            {/* Double Tap Zoom Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800">
              <div>
                <div className="text-xs font-semibold text-white">Double-Tap to Zoom</div>
                <div className="text-[11px] text-zinc-400">Quickly toggle 2x magnification</div>
              </div>
              <button
                onClick={() => handleUpdateSettings({ doubleTapZoom: !settings.doubleTapZoom })}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  settings.doubleTapZoom ? 'bg-red-600' : 'bg-zinc-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    settings.doubleTapZoom ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Auto Hide Controls Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800">
              <div>
                <div className="text-xs font-semibold text-white">Auto-Hide Controls</div>
                <div className="text-[11px] text-zinc-400">Hide navigation after 3.5s of reading</div>
              </div>
              <button
                onClick={() => handleUpdateSettings({ autoHideControls: !settings.autoHideControls })}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  settings.autoHideControls ? 'bg-red-600' : 'bg-zinc-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    settings.autoHideControls ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>

            <button
              onClick={() => setShowSettingsDrawer(false)}
              className="w-full py-3 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-500 mt-2"
            >
              Apply & Resume Reading
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
