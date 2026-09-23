import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export const PageHeader = ({ breadcrumbs = [], title, description, action }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6 min-w-0">
      <div className="space-y-1 min-w-0 flex-1">
        {/* Breadcrumb Navigation */}
        {breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-1 flex-wrap">
            <Link to="/dashboard" className="hover:text-slate-900 font-medium transition-colors shrink-0">
              Dashboard
            </Link>
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {crumb.path ? (
                  <Link to={crumb.path} className="hover:text-slate-900 font-medium transition-colors shrink-0">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="font-bold text-amber-600 truncate max-w-[200px] sm:max-w-none">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        {/* Page Title & Description */}
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight break-words">{title}</h1>
        {description && <p className="text-slate-500 text-xs sm:text-sm break-words leading-relaxed">{description}</p>}
      </div>

      {/* Primary Action Buttons */}
      {action && <div className="shrink-0 flex items-center gap-2 flex-wrap sm:flex-nowrap">{action}</div>}
    </div>
  );
};
