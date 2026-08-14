import React from 'react';
import { BookOpen, Bookmark, Search, History, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  type: 'list' | 'history' | 'search' | 'generic';
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  title,
  description,
  actionText,
  onAction,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'list':
        return <Bookmark className="w-8 h-8 text-zinc-500" />;
      case 'history':
        return <History className="w-8 h-8 text-zinc-500" />;
      case 'search':
        return <Search className="w-8 h-8 text-zinc-500" />;
      default:
        return <BookOpen className="w-8 h-8 text-zinc-500" />;
    }
  };

  const getDefaults = () => {
    switch (type) {
      case 'list':
        return {
          title: 'Your reading list is empty',
          description: 'Browse comics or manga and tap the bookmark icon to save titles here for later reading.',
          actionText: 'Explore Comics',
        };
      case 'history':
        return {
          title: 'No reading history yet',
          description: 'Any comic or manga chapter you open will appear here with your exact reading progress.',
          actionText: 'Start Reading',
        };
      case 'search':
        return {
          title: 'No titles found',
          description: 'Try adjusting your search terms or filter keywords.',
          actionText: 'Clear Search',
        };
      default:
        return {
          title: 'No content available',
          description: 'Please check back later or try refreshing the library.',
          actionText: 'Refresh',
        };
    }
  };

  const defaults = getDefaults();
  const displayTitle = title || defaults.title;
  const displayDesc = description || defaults.description;
  const displayAction = actionText || defaults.actionText;

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl bg-zinc-900/40 border border-dashed border-zinc-800 my-6">
      <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 shadow-inner">
        {getIcon()}
      </div>
      <h3 className="text-base font-bold text-zinc-200 mb-1">{displayTitle}</h3>
      <p className="text-xs text-zinc-400 max-w-sm mb-5 leading-relaxed">{displayDesc}</p>
      {onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-xs font-semibold text-zinc-100 transition-all flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {displayAction}
        </button>
      )}
    </div>
  );
};
