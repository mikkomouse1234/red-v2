import React from 'react';
export const CardSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="aspect-[2/3] bg-zinc-800 rounded-xl mb-2" />
    <div className="h-3 bg-zinc-800 rounded w-4/5 mb-1" />
    <div className="h-3 bg-zinc-800 rounded w-1/2" />
  </div>
);
export const GridSkeleton: React.FC<{ count?: number }> = ({ count = 10 }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
    {Array.from({ length: count }).map((_, i) => <CardSkeleton key={i} />)}
  </div>
);
