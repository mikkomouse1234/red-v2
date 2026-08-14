import React from 'react';

export const CardSkeleton: React.FC = () => (
  <div className="flex flex-col rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 animate-pulse">
    <div className="aspect-[2/3] w-full bg-zinc-800" />
    <div className="p-3 space-y-2">
      <div className="h-3.5 bg-zinc-800 rounded w-3/4" />
      <div className="h-3 bg-zinc-800/60 rounded w-1/2" />
    </div>
  </div>
);

export const GridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

export const PageSkeleton: React.FC = () => (
  <div className="w-full max-w-2xl mx-auto aspect-[1/1.5] bg-zinc-900 border border-zinc-800 animate-pulse rounded-lg flex flex-col items-center justify-center text-zinc-600 gap-3">
    <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
    <span className="text-xs font-mono">Loading Page Artwork...</span>
  </div>
);
