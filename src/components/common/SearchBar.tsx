import React from 'react';
import { Search, X } from 'lucide-react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  accentClass?: string;
}

export const SearchBar: React.FC<Props> = ({ value, onChange, placeholder = 'Search…', accentClass = 'focus:border-orange-500' }) => (
  <div className="relative w-full">
    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full pl-10 pr-8 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none ${accentClass} transition-colors`}
    />
    {value && (
      <button onClick={() => onChange('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-zinc-500 hover:text-white">
        <X className="w-3.5 h-3.5" />
      </button>
    )}
  </div>
);
