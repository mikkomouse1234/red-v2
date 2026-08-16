import React, { useState } from 'react';
import { ComicItem } from '../../types';

interface Props { item: ComicItem; onSelect: (item: ComicItem) => void; }
export const ItemCard: React.FC<Props> = ({ item, onSelect }) => {
  const [imgError, setImgError] = useState(false);
  return (
    <button onClick={() => onSelect(item)} className="text-left group">
      <div className="aspect-[2/3] rounded-xl overflow-hidden bg-zinc-800 mb-2 relative">
        {item.coverUrl && !imgError ? (
          <img src={item.coverUrl} alt={item.title} onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs font-bold px-2 text-center leading-tight">
            {item.title}
          </div>
        )}
        {/* Source badge */}
        <span className={`absolute top-1.5 left-1.5 text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
          item.source === 'mangadex' ? 'bg-orange-600 text-white' : 'bg-red-700 text-white'
        }`}>
          {item.source === 'mangadex' ? 'MD' : 'CV'}
        </span>
      </div>
      <p className="text-xs font-semibold text-zinc-200 line-clamp-2 leading-tight mb-0.5">{item.title}</p>
      {item.genres[0] && <p className="text-[10px] text-zinc-500">{item.genres[0]}</p>}
    </button>
  );
};
