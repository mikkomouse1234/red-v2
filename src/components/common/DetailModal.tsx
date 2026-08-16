import React, { useState } from 'react';
import { X, BookOpen, Calendar, Users, Tag } from 'lucide-react';
import { ComicItem, ChapterItem } from '../../types';

interface Props {
  item: ComicItem;
  onClose: () => void;
  onRead: (item: ComicItem, chapter: ChapterItem) => void;
}

export const DetailModal: React.FC<Props> = ({ item, onClose, onRead }) => {
  const [imgErr, setImgErr] = useState(false);
  const chapters = item.chapters || [];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start gap-4 p-5 border-b border-zinc-800 shrink-0">
          <div className="w-20 h-28 rounded-xl overflow-hidden bg-zinc-800 shrink-0">
            {item.coverUrl && !imgErr ? (
              <img src={item.coverUrl} alt={item.title} onError={() => setImgErr(true)} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs font-bold px-1 text-center">{item.title}</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-[10px] font-black uppercase tracking-wider mb-1 ${item.source === 'mangadex' ? 'text-orange-400' : 'text-red-400'}`}>
              {item.source === 'mangadex' ? 'MangaDex' : 'ComicVine'}
            </p>
            <h2 className="font-black text-white text-base leading-tight mb-2 line-clamp-3">{item.title}</h2>
            <div className="flex flex-wrap gap-2 text-xs text-zinc-400">
              {item.author && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{item.author}</span>}
              {item.releaseYear && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{item.releaseYear}</span>}
              {item.totalChapters > 0 && <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{item.totalChapters} {item.type === 'manga' ? 'chapters' : 'issues'}</span>}
            </div>
            {item.genres.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {item.genres.slice(0, 4).map(g => (
                  <span key={g} className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-400 flex items-center gap-1">
                    <Tag className="w-2.5 h-2.5" />{g}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button onClick={onClose} className="shrink-0 p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description */}
        {item.description && (
          <div className="px-5 py-3 border-b border-zinc-800/60 shrink-0">
            <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">{item.description}</p>
          </div>
        )}

        {/* Chapter list */}
        <div className="flex-1 overflow-y-auto">
          {chapters.length === 0 ? (
            <div className="py-12 text-center text-sm text-zinc-500">
              {item.source === 'comicvine' ? 'No issues available in ComicVine.' : 'No chapters available.'}
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/60">
              {chapters.slice(0, 200).map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => onRead(item, ch)}
                  className="w-full px-5 py-3 text-left hover:bg-zinc-900 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-200 truncate">{ch.title}</p>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
                      {ch.volume && <span>Vol.{ch.volume}</span>}
                      {ch.releaseDate && <span>{ch.releaseDate}</span>}
                      {ch.scanlationGroup && <span>{ch.scanlationGroup}</span>}
                    </div>
                  </div>
                  <BookOpen className="w-4 h-4 text-zinc-600 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
