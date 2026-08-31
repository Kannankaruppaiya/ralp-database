'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowUpRight, ShieldCheck, Eye, EyeOff, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Shared, token-driven sign-in layout for every role. A bold accent-coloured
 * brand panel on the left, a theme-aware form column on the right. The accent
 * (teal / indigo / violet) is the only thing that changes per role, so all
 * three portals read as one product. Works in light and dark.
 */
export type AuthAccent = 'primary' | 'admin' | 'category';

interface AccentClasses {
  panel: string;
  solid: string;
  text: string;
  softBg: string;
  softBorder: string;
  focus: string;
  selected: string;
}

export const AUTH_ACCENTS: Record<AuthAccent, AccentClasses> = {
  primary: {
    panel: 'bg-primary',
    solid: 'bg-primary hover:bg-primary/90 text-primary-foreground',
    text: 'text-primary',
    softBg: 'bg-primary/10',
    softBorder: 'border-primary/25',
    focus: 'focus-visible:ring-primary focus-visible:border-primary',
    selected: 'bg-primary text-primary-foreground',
  },
  admin: {
    panel: 'bg-admin',
    solid: 'bg-admin hover:bg-admin/90 text-admin-foreground',
    text: 'text-admin',
    softBg: 'bg-admin/10',
    softBorder: 'border-admin/25',
    focus: 'focus-visible:ring-admin focus-visible:border-admin',
    selected: 'bg-admin text-admin-foreground',
  },
  category: {
    panel: 'bg-category',
    solid: 'bg-category hover:bg-category/90 text-category-foreground',
    text: 'text-category',
    softBg: 'bg-category/10',
    softBorder: 'border-category/25',
    focus: 'focus-visible:ring-category focus-visible:border-category',
    selected: 'bg-category text-category-foreground',
  },
};

const AccentContext = React.createContext<AuthAccent>('primary');
export const useAuthAccent = () => AUTH_ACCENTS[React.useContext(AccentContext)];

export interface AuthShellProps {
  accent: AuthAccent;
  brandIcon: LucideIcon;
  brandTitle: string;
  brandSubtitle: string;
  eyebrow: string;
  eyebrowIcon: LucideIcon;
  headline: string;
  description: string;
  stats: { value: string; label: string }[];
  trust: string[];
  portalLinks: { href: string; label: string }[];
  formTitle: string;
  formSubtitle: string;
  footer: string;
  children: React.ReactNode;
}

export function AuthShell({
  accent,
  brandIcon: BrandIcon,
  brandTitle,
  brandSubtitle,
  eyebrow,
  eyebrowIcon: EyebrowIcon,
  headline,
  description,
  stats,
  trust,
  portalLinks,
  formTitle,
  formSubtitle,
  footer,
  children,
}: AuthShellProps) {
  const a = AUTH_ACCENTS[accent];
  return (
    <AccentContext.Provider value={accent}>
      <div className="grid min-h-screen grid-cols-1 bg-background font-sans lg:grid-cols-2">
        {/* Brand panel — a committed accent surface, white text in both themes */}
        <aside className={cn('relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex', a.panel)}>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/40" />
          <div className="pointer-events-none absolute -left-16 top-16 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-10 h-80 w-80 rounded-full bg-black/20 blur-3xl" />

          <Link href="/" className="relative z-10 flex items-center gap-3.5">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md ring-1 ring-white/25">
              <BrandIcon className="h-6 w-6" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-lg font-extrabold leading-none tracking-tight">{brandTitle}</span>
              <span className="mt-1 block text-[11px] font-semibold uppercase tracking-widest text-white/80">{brandSubtitle}</span>
            </span>
          </Link>

          <div className="relative z-10 my-auto max-w-lg space-y-6 py-8">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ring-1 ring-white/20 backdrop-blur-sm">
              <EyebrowIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {eyebrow}
            </span>
            <h1 className="text-balance text-4xl font-black leading-[1.12] tracking-tight xl:text-[2.9rem]">{headline}</h1>
            <p className="max-w-md text-sm leading-relaxed text-white/80">{description}</p>

            <div className="grid grid-cols-3 gap-3 pt-2">
              {stats.map((s) => (
                <div key={s.label} className="rounded-2xl bg-white/10 p-3.5 ring-1 ring-white/15 backdrop-blur-md">
                  <div className="font-mono text-xl font-black tabular-nums">{s.value}</div>
                  <div className="mt-0.5 text-[11px] font-medium text-white/70">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/20 pt-6 text-xs text-white/75">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              {trust[0]}
            </span>
            {trust.slice(1).map((t) => (
              <React.Fragment key={t}>
                <span aria-hidden="true">&middot;</span>
                <span>{t}</span>
              </React.Fragment>
            ))}
          </div>
        </aside>

        {/* Form column — theme-aware */}
        <main className="flex flex-col justify-center p-6 sm:p-10 lg:p-12">
          <div className="mx-auto w-full max-w-md space-y-7">
            {/* Mobile brand + role switch */}
            <div className="flex items-center justify-between lg:hidden">
              <Link href="/" className="flex items-center gap-2.5">
                <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl text-white', a.panel)}>
                  <BrandIcon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="font-bold text-foreground">{brandTitle}</span>
              </Link>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={cn('text-xs font-bold uppercase tracking-widest', a.text)}>{formSubtitle}</span>
                <div className="flex items-center gap-3">
                  {portalLinks.map((p) => (
                    <Link key={p.href} href={p.href} className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
                      {p.label}
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">{formTitle}</h2>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-xl shadow-black/[0.03] sm:p-7">
              {children}
            </div>

            <p className="text-center text-[11px] leading-relaxed text-muted-foreground">{footer}</p>
          </div>
        </main>
      </div>
    </AccentContext.Provider>
  );
}

/** Segmented control for switching auth methods, accent-aware. */
export function AuthTabs<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon: LucideIcon }[];
}) {
  const a = useAuthAccent();
  return (
    <div className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-muted p-1 text-xs font-semibold text-muted-foreground">
      {options.map((o) => {
        const Icon = o.icon;
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={active}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active ? cn(a.selected, 'font-bold shadow-sm') : 'hover:text-foreground'
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Labelled input with a leading icon and an optional password reveal toggle. */
export function AuthField({
  label,
  icon: Icon,
  type = 'text',
  reveal,
  labelRight,
  id,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon: LucideIcon;
  reveal?: boolean;
  labelRight?: React.ReactNode;
}) {
  const a = useAuthAccent();
  const [show, setShow] = React.useState(false);
  const reactId = React.useId();
  const inputId = id ?? reactId;
  const resolvedType = reveal ? (show ? 'text' : 'password') : type;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={inputId} className="text-xs font-semibold text-foreground">{label}</label>
        {labelRight}
      </div>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input
          id={inputId}
          type={resolvedType}
          className={cn(
            'h-11 w-full rounded-xl border border-input bg-background pl-10 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50',
            reveal ? 'pr-10' : 'pr-3.5',
            a.focus
          )}
          {...props}
        />
        {reveal && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {show ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
          </button>
        )}
      </div>
    </div>
  );
}

/** Accent-filled submit button with a leading icon. */
export function AuthSubmit({
  icon: Icon,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { icon: LucideIcon }) {
  const a = useAuthAccent();
  return (
    <button
      className={cn(
        'inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold shadow-lg shadow-black/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60',
        a.solid,
        className
      )}
      {...props}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {children}
    </button>
  );
}
