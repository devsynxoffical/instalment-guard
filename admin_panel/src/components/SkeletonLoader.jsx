import React from 'react';

export const TableSkeleton = ({ rows = 5, cols = 5 }) => {
  return (
    <div className="w-full animate-pulse space-y-4">
      <div className="h-10 bg-slate-800/60 rounded-lg w-full"></div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-8 bg-slate-800/40 rounded flex-1"></div>
          ))}
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-32 bg-slate-800/50 rounded-xl p-5 border border-slate-700/40 space-y-3">
          <div className="h-4 bg-slate-700/50 rounded w-1/2"></div>
          <div className="h-8 bg-slate-700/60 rounded w-3/4"></div>
          <div className="h-3 bg-slate-700/40 rounded w-1/3"></div>
        </div>
      ))}
    </div>
  );
};

export const MetricSkeleton = () => {
  return (
    <div className="animate-pulse space-y-3 p-5 glass-card rounded-xl">
      <div className="h-4 bg-slate-700/50 rounded w-1/3"></div>
      <div className="h-8 bg-slate-700/70 rounded w-2/3"></div>
    </div>
  );
};
