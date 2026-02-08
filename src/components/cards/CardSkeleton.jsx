import React from 'react';

export function CardSkeleton() {
  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4 animate-pulse">
      {/* Header with color bar */}
      <div className="h-2 bg-slate-700 rounded-full w-full mb-4" />

      {/* Title */}
      <div className="h-5 bg-slate-700 rounded w-3/4 mb-3" />

      {/* Content lines */}
      <div className="space-y-2">
        <div className="h-3 bg-slate-700/70 rounded w-full" />
        <div className="h-3 bg-slate-700/70 rounded w-5/6" />
        <div className="h-3 bg-slate-700/70 rounded w-2/3" />
      </div>

      {/* Tags */}
      <div className="flex gap-2 mt-4">
        <div className="h-5 bg-slate-700/50 rounded-full w-16" />
        <div className="h-5 bg-slate-700/50 rounded-full w-12" />
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <div className="space-y-4 p-4 animate-pulse">
      {/* Folders section */}
      <div>
        <div className="h-4 bg-slate-700 rounded w-20 mb-3" />
        <div className="space-y-2">
          <div className="h-8 bg-slate-700/50 rounded w-full" />
          <div className="h-8 bg-slate-700/50 rounded w-full" />
          <div className="h-8 bg-slate-700/50 rounded w-3/4" />
        </div>
      </div>

      {/* Tags section */}
      <div className="mt-6">
        <div className="h-4 bg-slate-700 rounded w-16 mb-3" />
        <div className="flex flex-wrap gap-2">
          <div className="h-6 bg-slate-700/50 rounded-full w-14" />
          <div className="h-6 bg-slate-700/50 rounded-full w-18" />
          <div className="h-6 bg-slate-700/50 rounded-full w-12" />
        </div>
      </div>
    </div>
  );
}

export default CardSkeleton;
