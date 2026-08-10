import React from 'react';

export const PageContainer: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${className}`}>{children}</div>;
};

export const Breadcrumbs: React.FC<{ items: { label: string; active?: boolean }[] }> = ({ items }) => {
  return (
    <nav className="flex items-center gap-2 text-xs text-slate-500 mb-4">
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && <span>/</span>}
          <span className={item.active ? 'font-bold text-slate-900' : 'hover:text-slate-700'}>
            {item.label}
          </span>
        </React.Fragment>
      ))}
    </nav>
  );
};
