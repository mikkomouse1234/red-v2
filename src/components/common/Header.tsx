import React from 'react';
import { BookOpen, Moon, Sun, Search, Sparkles, Shield } from 'lucide-react';
import { ThemeMode, ActiveTab } from '../../types';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  theme: ThemeMode;
  onThemeToggle: () => void;
  onOpenSearch?: () => void;
  savedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  theme,
  onThemeToggle,
  onOpenSearch,
  savedCount,
}) => {
  const getSourceBadge = () => {
    if (activeTab === 'comics') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-zinc-900 border border-red-900/60 text-red-400">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
          batcave.biz
        </span>
      );
    }
    if (activeTab === 'manga') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-zinc-900 border border-orange-900/60 text-orange-400">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
          mangadex.org
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-zinc-900 text-zinc-400 border border-zinc-800">
        Reader v1.0
      </span>
    );
  };

  const getTitle = () => {
    switch (activeTab) {
      case 'home':
        return 'OmniComic';
      case 'comics':
        return 'Comics Library';
      case 'manga':
        return 'MangaDex';
      case 'settings':
        return 'Settings';
      default:
        return 'OmniComic';
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-black/90 backdrop-blur-md border-b border-zinc-800/80 transition-colors">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
        {/* Left: Brand Logo & Title */}
        <div 
          onClick={() => onTabChange('home')}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/30 group-hover:scale-105 transition-transform">
            <BookOpen className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-black tracking-wider text-base text-white uppercase font-mono">
                {getTitle()}
              </span>
              {getSourceBadge()}
            </div>
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-1.5">
          {onOpenSearch && activeTab !== 'settings' && (
            <button
              id="header-search-btn"
              onClick={onOpenSearch}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-all"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          )}

          <button
            id="header-theme-toggle-btn"
            onClick={onThemeToggle}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-all"
            title={`Switch from ${theme} mode`}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-zinc-300" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
