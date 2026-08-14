import { ReadingProgress, SavedItem, ReaderSettings, ComicItem, ListCategory } from '../types';

const STORAGE_KEYS = {
  HISTORY: 'omnicomic_reading_history_v1',
  MY_LIST: 'omnicomic_my_list_v1',
  SETTINGS: 'omnicomic_reader_settings_v1',
  ACTIVE_THEME: 'omnicomic_theme_mode_v1',
};

export const DEFAULT_SETTINGS: ReaderSettings = {
  readingDirection: 'vertical',
  pageSpacing: 0,
  fitMode: 'fit-width',
  autoHideControls: true,
  autoHideDelay: 3500,
  doubleTapZoom: true,
  maxZoom: 2.5,
  showPageNumberBadge: true,
  theme: 'dark',
  imageQuality: 'high',
  keepScreenAwake: true,
  volumeKeyNavigation: false,
};

type Listener = () => void;
const listeners = new Set<Listener>();

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error('Storage listener error:', e);
    }
  });
}

export const StorageService = {
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  // --- Reading History & Progress ---
  getReadingHistory(): ReadingProgress[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (!data) return [];
      const parsed: ReadingProgress[] = JSON.parse(data);
      return parsed.sort((a, b) => b.lastReadTimestamp - a.lastReadTimestamp);
    } catch (e) {
      console.error('Failed to load reading history:', e);
      return [];
    }
  },

  getProgress(itemId: string): ReadingProgress | undefined {
    const history = this.getReadingHistory();
    return history.find((h) => h.itemId === itemId);
  },

  saveProgress(progress: Omit<ReadingProgress, 'lastReadTimestamp' | 'percentage'> & { percentage?: number }): void {
    try {
      const history = this.getReadingHistory();
      const existingIndex = history.findIndex((h) => h.itemId === progress.itemId);
      
      const percentage = progress.totalPages > 0 
        ? Math.round(((progress.pageIndex + 1) / progress.totalPages) * 100)
        : 0;

      const record: ReadingProgress = {
        ...progress,
        percentage: progress.percentage ?? percentage,
        lastReadTimestamp: Date.now(),
      };

      if (existingIndex >= 0) {
        history[existingIndex] = record;
      } else {
        history.unshift(record);
      }

      // Limit history to 200 items to avoid storage overflow
      const trimmed = history.slice(0, 200);
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(trimmed));
      notifyListeners();
    } catch (e) {
      console.error('Failed to save reading progress:', e);
    }
  },

  removeHistoryItem(itemId: string): void {
    try {
      const history = this.getReadingHistory().filter((h) => h.itemId !== itemId);
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
      notifyListeners();
    } catch (e) {
      console.error('Failed to remove history item:', e);
    }
  },

  clearHistory(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.HISTORY);
      notifyListeners();
    } catch (e) {
      console.error('Failed to clear history:', e);
    }
  },

  // --- My List / Library ---
  getMyList(): SavedItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MY_LIST);
      if (!data) return [];
      const parsed: SavedItem[] = JSON.parse(data);
      return parsed.sort((a, b) => b.addedAt - a.addedAt);
    } catch (e) {
      console.error('Failed to load my list:', e);
      return [];
    }
  },

  isInMyList(itemId: string): boolean {
    const list = this.getMyList();
    return list.some((item) => item.itemId === itemId);
  },

  toggleMyList(item: ComicItem, category: ListCategory = 'Reading'): boolean {
    try {
      const list = this.getMyList();
      const existingIndex = list.findIndex((i) => i.itemId === item.id);
      let isAdded = false;

      if (existingIndex >= 0) {
        list.splice(existingIndex, 1);
        isAdded = false;
      } else {
        list.unshift({
          itemId: item.id,
          item,
          addedAt: Date.now(),
          category,
        });
        isAdded = true;
      }

      localStorage.setItem(STORAGE_KEYS.MY_LIST, JSON.stringify(list));
      notifyListeners();
      return isAdded;
    } catch (e) {
      console.error('Failed to toggle my list:', e);
      return false;
    }
  },

  updateItemCategory(itemId: string, category: ListCategory): void {
    try {
      const list = this.getMyList();
      const target = list.find((i) => i.itemId === itemId);
      if (target) {
        target.category = category;
        localStorage.setItem(STORAGE_KEYS.MY_LIST, JSON.stringify(list));
        notifyListeners();
      }
    } catch (e) {
      console.error('Failed to update category:', e);
    }
  },

  // --- Settings ---
  getSettings(): ReaderSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch (e) {
      console.error('Failed to load settings:', e);
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(partial: Partial<ReaderSettings>): ReaderSettings {
    try {
      const current = this.getSettings();
      const updated = { ...current, ...partial };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      notifyListeners();
      return updated;
    } catch (e) {
      console.error('Failed to save settings:', e);
      return DEFAULT_SETTINGS;
    }
  },

  // --- Backup & Data Management ---
  exportBackup(): string {
    const data = {
      history: this.getReadingHistory(),
      myList: this.getMyList(),
      settings: this.getSettings(),
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  },

  importBackup(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.history && Array.isArray(parsed.history)) {
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(parsed.history));
      }
      if (parsed.myList && Array.isArray(parsed.myList)) {
        localStorage.setItem(STORAGE_KEYS.MY_LIST, JSON.stringify(parsed.myList));
      }
      if (parsed.settings) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(parsed.settings));
      }
      notifyListeners();
      return true;
    } catch (e) {
      console.error('Failed to import backup:', e);
      return false;
    }
  },

  resetAll(): void {
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
    localStorage.removeItem(STORAGE_KEYS.MY_LIST);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    notifyListeners();
  },
};
