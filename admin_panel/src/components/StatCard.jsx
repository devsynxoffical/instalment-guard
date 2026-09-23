import React from 'react';

export const StatCard = ({ title, value, subText, icon: Icon, trend, color = 'indigo' }) => {
  const getColorClasses = (c) => {
    switch (c) {
      case 'rose':
        return 'border-rose-200 text-rose-700 bg-rose-50';
      case 'amber':
        return 'border-amber-200 text-amber-700 bg-amber-50';
      case 'emerald':
        return 'border-emerald-200 text-emerald-700 bg-emerald-50';
      case 'sky':
        return 'border-sky-200 text-sky-700 bg-sky-50';
      default:
        return 'border-slate-200 text-slate-800 bg-slate-50';
    }
  };

  return (
    <div className="teal-card p-5 rounded-2xl flex flex-col justify-between space-y-4 hover:shadow-md transition-all duration-300 bg-white">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</span>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono tracking-tight">{value}</div>
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl border ${getColorClasses(color)} shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
        <span className="text-slate-600 font-medium truncate">{subText}</span>
        {trend && <span className="font-bold text-emerald-700 shrink-0">{trend}</span>}
      </div>
    </div>
  );
};

export default StatCard;
