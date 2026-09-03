import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-2.5" aria-label="Breadcrumb">
      <Link
        href="/dashboard"
        aria-label="Back to Clinical Dashboard"
        className="hover:text-teal-700 dark:hover:text-teal-400 transition-colors p-0.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
      >
        <Home className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" aria-hidden="true" />
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-teal-700 dark:hover:text-teal-400 transition-colors font-medium truncate max-w-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded"
            >
              {item.label}
            </Link>
          ) : (
            <span
              className="text-slate-900 dark:text-slate-100 font-semibold truncate max-w-xs"
              aria-current="page"
            >
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

export function PageHeader({
  title,
  description,
  action,
  breadcrumbs,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}) {
  return (
    <div className="mb-6 space-y-1.5">
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 [text-wrap:balance]">
            {title}
          </h1>
          {description && (
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed max-w-3xl [text-wrap:pretty]">
              {description}
            </p>
          )}
        </div>
        {action && <div className="flex items-center gap-2.5 flex-wrap shrink-0">{action}</div>}
      </div>
    </div>
  );
}
