import React, { useState } from 'react';
import { 
  Moon, 
  Sun, 
  Smartphone, 
  Eye, 
  Sliders, 
  Trash2, 
  Download, 
  Upload, 
  ShieldCheck, 
  Info, 
  Globe, 
  RefreshCw,
  CheckCircle,
  Database,
  BookOpen
} from 'lucide-react';
import { ReaderSettings, ThemeMode, ReadingDirection, FitMode } from '../../types';
import { StorageService } from '../../services/storage';

interface SettingsScreenProps {
  settings: ReaderSettings;
  onUpdateSettings: (updated: Partial<ReaderSettings>) => void;
  onClearHistory: () => void;
  onResetAll: () => void;
  savedCount: number;
  historyCount: number;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onUpdateSettings,
  onClearHistory,
  onResetAll,
  savedCount,
  historyCount,
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleExport = () => {
    const data = StorageService.exportBackup();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnicomic-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Library & progress exported successfully!');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = StorageService.importBackup(content);
        if (success) {
          showToast('Library restored successfully!');
          window.location.reload();
        } else {
          showToast('Failed to parse backup file');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex-1 max-w-2xl mx-auto px-4 py-5 space-y-6 pb-24">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-900 border border-zinc-800 text-zinc-400">
            Preferences & Data
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Application Settings
        </h1>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-xs font-semibold text-red-200 flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-red-400" />
          {statusMessage}
        </div>
      )}

      {/* ================= APPEARANCE ================= */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
          <Moon className="w-3.5 h-3.5 text-red-500" />
          Appearance
        </h2>

        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-200 block mb-2">Theme Mode</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'dark' as ThemeMode, label: 'Dark Mode', icon: Moon },
                { id: 'light' as ThemeMode, label: 'Light Mode', icon: Sun },
                { id: 'amoled' as ThemeMode, label: 'AMOLED Black', icon: Smartphone },
              ].map((themeOpt) => {
                const Icon = themeOpt.icon;
                const isSelected = settings.theme === themeOpt.id;
                return (
                  <button
                    key={themeOpt.id}
                    onClick={() => onUpdateSettings({ theme: themeOpt.id })}
                    className={`py-3 px-2 rounded-xl text-xs font-bold border flex flex-col items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-red-600 border-red-500 text-white shadow-md shadow-red-600/30'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{themeOpt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ================= READING PREFERENCES ================= */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-red-500" />
          Reading Experience
        </h2>

        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-4">
          {/* Reading Direction */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-zinc-200">Reading Direction</label>
              <span className="text-[11px] text-red-400 font-mono">Continuous Vertical (Webtoon)</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'vertical' as ReadingDirection, label: 'Vertical Scroll' },
                { id: 'horizontal-rtl' as ReadingDirection, label: 'Manga (RTL)' },
                { id: 'horizontal-ltr' as ReadingDirection, label: 'Comics (LTR)' },
              ].map((dir) => (
                <button
                  key={dir.id}
                  onClick={() => onUpdateSettings({ readingDirection: dir.id })}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    settings.readingDirection === dir.id
                      ? 'bg-red-600 border-red-500 text-white'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {dir.label}
                </button>
              ))}
            </div>
          </div>

          {/* Page Spacing */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-zinc-200">Page Vertical Spacing</label>
              <span className="text-[11px] text-zinc-400 font-mono">{settings.pageSpacing}px</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[0, 4, 8, 16].map((space) => (
                <button
                  key={space}
                  onClick={() => onUpdateSettings({ pageSpacing: space })}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    settings.pageSpacing === space
                      ? 'bg-red-600 border-red-500 text-white'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {space}px
                </button>
              ))}
            </div>
          </div>

          {/* Image Quality */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-200 block">Artwork Quality</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'high', label: 'High (HD)' },
                { id: 'data-saver', label: 'Data Saver' },
                { id: 'original', label: 'Original' },
              ].map((q) => (
                <button
                  key={q.id}
                  onClick={() => onUpdateSettings({ imageQuality: q.id as any })}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    settings.imageQuality === q.id
                      ? 'bg-red-600 border-red-500 text-white'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="pt-2 border-t border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-white">Double-Tap Zoom</div>
                <div className="text-[11px] text-zinc-400">Instantly magnify panels</div>
              </div>
              <button
                onClick={() => onUpdateSettings({ doubleTapZoom: !settings.doubleTapZoom })}
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

            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-white">Auto-Hide Controls</div>
                <div className="text-[11px] text-zinc-400">Fade navigation bars while reading</div>
              </div>
              <button
                onClick={() => onUpdateSettings({ autoHideControls: !settings.autoHideControls })}
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

            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-white">Floating Page Counter</div>
                <div className="text-[11px] text-zinc-400">Show page index pill during scroll</div>
              </div>
              <button
                onClick={() => onUpdateSettings({ showPageNumberBadge: !settings.showPageNumberBadge })}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  settings.showPageNumberBadge ? 'bg-red-600' : 'bg-zinc-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    settings.showPageNumberBadge ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ================= LIBRARY & STORAGE ================= */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-red-500" />
          Library & Data Persistence
        </h2>

        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
              <div className="text-lg font-black text-white font-mono">{savedCount}</div>
              <div className="text-[11px] text-zinc-400">Saved in My List</div>
            </div>
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
              <div className="text-lg font-black text-red-400 font-mono">{historyCount}</div>
              <div className="text-[11px] text-zinc-400">Reading Sessions</div>
            </div>
          </div>

          {/* Backup Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex-1 py-2.5 px-3 rounded-xl bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 text-xs font-semibold text-zinc-200 flex items-center justify-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Export Backup
            </button>

            <label className="flex-1 py-2.5 px-3 rounded-xl bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 text-xs font-semibold text-zinc-200 flex items-center justify-center gap-1.5 cursor-pointer transition-all">
              <Upload className="w-3.5 h-3.5" />
              Import Backup
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>

          {/* Destructive Actions */}
          <div className="pt-2 border-t border-zinc-800 space-y-2">
            {showClearConfirm ? (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-900/60 space-y-2">
                <p className="text-xs text-red-300">
                  Clear all reading history and saved page bookmarks?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onClearHistory();
                      setShowClearConfirm(false);
                      showToast('Reading history cleared');
                    }}
                    className="flex-1 py-1.5 rounded-lg bg-red-600 text-white font-bold text-xs"
                  >
                    Yes, Clear History
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="w-full py-2 px-3 rounded-xl bg-zinc-950 hover:bg-red-950/30 border border-zinc-800 hover:border-red-900/60 text-xs font-semibold text-zinc-400 hover:text-red-400 flex items-center justify-center gap-1.5 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Reading History
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ================= ABOUT & ARCHITECTURE ================= */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-red-500" />
          About OmniComic
        </h2>

        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-3 text-xs text-zinc-300">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white">Application Version</span>
            <span className="font-mono text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
              v1.0.0 (Android-Ready)
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-semibold text-white">Comics Source</span>
            <span className="text-red-400 font-mono">batcave.biz</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-semibold text-white">Manga Source</span>
            <span className="text-orange-400 font-mono">mangadex.org API</span>
          </div>

          <div className="pt-2 border-t border-zinc-800 text-[11px] text-zinc-400 leading-relaxed">
            Designed from the ground up with modular architecture and local storage synchronization, ready to be wrapped as a native Android APK via Capacitor or Cordova.
          </div>
        </div>
      </section>
    </div>
  );
};
