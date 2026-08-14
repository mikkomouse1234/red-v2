import React, { useState, useEffect } from 'react';
import {
  ActiveTab,
  ComicItem,
  ChapterItem,
  ReadingProgress,
  SavedItem,
  ReaderSettings,
  ThemeMode,
} from './types';
import { StorageService, DEFAULT_SETTINGS } from './services/storage';
import { ApiService } from './services/api';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { HomeScreen } from './components/home/HomeScreen';
import { ComicsScreen } from './components/comics/ComicsScreen';
import { MangaScreen } from './components/manga/MangaScreen';
import { SettingsScreen } from './components/settings/SettingsScreen';
import { DetailModal } from './components/common/DetailModal';
import { ReaderScreen } from './components/reader/ReaderScreen';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [selectedComic, setSelectedComic] = useState<ComicItem | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [readingSession, setReadingSession] = useState<{
    item: ComicItem;
    chapter: ChapterItem;
    pageIndex: number;
  } | null>(null);

  const [history, setHistory] = useState<ReadingProgress[]>([]);
  const [myList, setMyList] = useState<SavedItem[]>([]);
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const loadState = () => {
      setHistory(StorageService.getReadingHistory());
      setMyList(StorageService.getMyList());
      setSettings(StorageService.getSettings());
    };
    loadState();
    const unsubscribe = StorageService.subscribe(loadState);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light', 'amoled');
    if (settings.theme === 'light') {
      root.classList.add('light');
      document.body.style.backgroundColor = '#09090b';
      document.body.style.color = '#f4f4f5';
    } else if (settings.theme === 'amoled') {
      root.classList.add('amoled');
      document.body.style.backgroundColor = '#000000';
      document.body.style.color = '#ffffff';
    } else {
      root.classList.add('dark');
      document.body.style.backgroundColor = '#09090b';
      document.body.style.color = '#fafafa';
    }
  }, [settings.theme]);

  /**
   * Selecting a comic (Batcave): open immediately — data is already complete.
   * Selecting a manga (MangaDex): fetch full details + chapter feed first,
   * then open the detail modal with real data.
   */
  const handleSelectComic = (item: ComicItem) => {
    if (item.source === 'batcave') {
      setSelectedComic(item);
      return;
    }

    // MangaDex flow: fetch details + chapters before showing the modal
    setLoadingDetail(true);
    setDetailError(null);

    (async () => {
      try {
        // 1. Fetch full manga details
        const fullManga = await ApiService.getMangaById(item.mangadexId || item.id);

        // 2. Fetch real chapter feed
        const chapters = await ApiService.getMangaChapters(fullManga.id);

        const withChapters: ComicItem = {
          ...fullManga,
          chapters,
          totalChapters: chapters.length,
        };

        setSelectedComic(withChapters);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.error('Manga detail fetch failed:', msg);
        setDetailError(
          err && typeof err === 'object' && 'userMessage' in err
            ? (err as { userMessage: string }).userMessage
            : 'Unable to load manga details. Please try again.'
        );
      } finally {
        setLoadingDetail(false);
      }
    })();
  };

  const handleStartReading = (item: ComicItem, chapter: ChapterItem, startPage = 0) => {
    setReadingSession({ item, chapter, pageIndex: startPage });
  };

  const handleResumeReading = async (progress: ReadingProgress) => {
    const item = await ApiService.getItemById(progress.itemId, progress.itemType);
    if (!item) return;

    let chapters = item.chapters;
    // For manga without chapters loaded yet, fetch them
    if (item.source === 'mangadex' && (!chapters || chapters.length === 0)) {
      try {
        chapters = await ApiService.getMangaChapters(item.id);
      } catch {
        chapters = [];
      }
    }

    const finalItem = { ...item, chapters };
    const chapter =
      finalItem.chapters?.find((ch) => ch.id === progress.chapterId) ||
      finalItem.chapters?.[0];

    if (chapter) {
      setReadingSession({ item: finalItem, chapter, pageIndex: progress.pageIndex });
    }
  };

  const handleToggleSave = (item: ComicItem) => {
    StorageService.toggleMyList(item);
  };

  const handleThemeToggle = () => {
    const nextTheme: ThemeMode = settings.theme === 'dark' ? 'light' : 'dark';
    setSettings(StorageService.saveSettings({ theme: nextTheme }));
  };

  const handleUpdateSettings = (partial: Partial<ReaderSettings>) => {
    setSettings(StorageService.saveSettings(partial));
  };

  const isSaved = (itemId: string) => StorageService.isInMyList(itemId);
  const getProgress = (itemId: string) => StorageService.getProgress(itemId);

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {!readingSession && (
        <Header
          activeTab={activeTab}
          onTabChange={setActiveTab}
          theme={settings.theme}
          onThemeToggle={handleThemeToggle}
          savedCount={myList.length}
        />
      )}

      <main className="flex-1 flex flex-col">
        {!readingSession && (
          <>
            {activeTab === 'home' && (
              <HomeScreen
                history={history}
                myList={myList}
                onSelectComic={handleSelectComic}
                onResumeReading={handleResumeReading}
                onToggleSave={handleToggleSave}
                onTabChange={setActiveTab}
              />
            )}
            {activeTab === 'comics' && (
              <ComicsScreen
                onSelectComic={handleSelectComic}
                onToggleSave={handleToggleSave}
                isSaved={isSaved}
                getProgress={getProgress}
              />
            )}
            {activeTab === 'manga' && (
              <MangaScreen
                onSelectManga={handleSelectComic}
                onToggleSave={handleToggleSave}
                isSaved={isSaved}
                getProgress={getProgress}
              />
            )}
            {activeTab === 'settings' && (
              <SettingsScreen
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onClearHistory={() => StorageService.clearHistory()}
                onResetAll={() => StorageService.resetAll()}
                savedCount={myList.length}
                historyCount={history.length}
              />
            )}
          </>
        )}
      </main>

      {!readingSession && (
        <BottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          savedCount={myList.length}
          unreadHistoryCount={history.length}
        />
      )}

      {/* Loading overlay while fetching manga details */}
      {loadingDetail && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
          <div className="w-10 h-10 border-4 border-zinc-700 border-t-orange-500 rounded-full animate-spin" />
          <p className="text-sm text-zinc-300 font-medium">Loading manga details…</p>
        </div>
      )}

      {/* Error overlay when manga detail fetch fails */}
      {detailError && !loadingDetail && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
          <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-950 border border-red-800 flex items-center justify-center mx-auto text-2xl">⚠️</div>
            <h3 className="font-bold text-white text-base">Could not load manga</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">{detailError}</p>
            <button
              onClick={() => setDetailError(null)}
              className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Detail modal — only shown after details/chapters are loaded */}
      {selectedComic && !loadingDetail && !detailError && (
        <DetailModal
          item={selectedComic}
          progress={getProgress(selectedComic.id)}
          isSaved={isSaved(selectedComic.id)}
          onClose={() => setSelectedComic(null)}
          onStartReading={handleStartReading}
          onToggleSave={handleToggleSave}
        />
      )}

      {readingSession && (
        <ReaderScreen
          item={readingSession.item}
          initialChapter={readingSession.chapter}
          initialPage={readingSession.pageIndex}
          onClose={() => setReadingSession(null)}
          onChapterChange={(ch) =>
            setReadingSession((prev) => (prev ? { ...prev, chapter: ch, pageIndex: 0 } : null))
          }
        />
      )}
    </div>
  );
}
