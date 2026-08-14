import React from 'react';
import { Home, BookText, Layers, Settings } from 'lucide-react';
import { ActiveTab } from '../../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  savedCount?: number;
  unreadHistoryCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  savedCount = 0,
  unreadHistoryCount = 0,
}) => {
  const navItems = [
    {
      id: 'home' as ActiveTab,
      label: 'Home',
      icon: Home,
      badge: unreadHistoryCount > 0 ? unreadHistoryCount : undefined,
    },
    {
      id: 'comics' as ActiveTab,
      label: 'Comics',
      icon: BookText,
      source: 'batcave.biz',
    },
    {
      id: 'manga' as ActiveTab,
      label: 'Manga',
      icon: Layers,
      source: 'mangadex',
    },
    {
      id: 'settings' as ActiveTab,
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-800/90 pb-safe transition-all">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              onClick={() => onTabChange(item.id)}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-red-500 font-semibold scale-105'
                  : 'text-zinc-400 hover:text-zinc-200 active:scale-95'
              }`}
            >
              {/* Active Glow Pill */}
              {isActive && (
                <span className="absolute -top-1 w-8 h-1 bg-red-600 rounded-full shadow-sm shadow-red-500/50 animate-pulse" />
              )}

              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-red-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-zinc-950">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>

              <span className={`text-[11px] mt-1 tracking-tight ${isActive ? 'text-red-500' : 'text-zinc-400'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
