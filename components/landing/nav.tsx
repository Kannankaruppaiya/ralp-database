'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Moon, Sun, X } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { FOOTER_LINKS, NAV_LINKS, PORTALS } from './content';

function ThemeButton() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const next = resolvedTheme === 'dark' ? 'light' : 'dark';
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${next} theme`}
      className="inline-flex h-11 w-11 items-center justify-center rounded-[2px] text-[color:var(--l-ink-muted)] transition-colors duration-150 hover:text-[color:var(--l-ink)]"
    >
      {resolvedTheme === 'dark' ? (
        <Sun size={20} strokeWidth={1.5} aria-hidden />
      ) : (
        <Moon size={20} strokeWidth={1.5} aria-hidden />
      )}
    </button>
  );
}

function MobileSheet({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sheet = ref.current;
    const opener = document.activeElement as HTMLElement | null;
    const focusables = () =>
      Array.from(sheet?.querySelectorAll<HTMLElement>('a[href], button') ?? []);
    focusables()[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return onClose();
      if (e.key !== 'Tab') return;
      const items = focusables();
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      opener?.focus();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-hidden
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-[color:var(--l-ink)] opacity-40"
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label="Sign in"
        className="absolute inset-x-0 top-0 border-b border-[color:var(--l-line)] bg-[color:var(--l-ground)] px-4 pb-8 pt-3"
      >
        <div className="flex h-12 items-center justify-between">
          <span className="l-display text-xl font-medium">Sign in</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-11 w-11 items-center justify-center rounded-[2px]"
          >
            <X size={20} strokeWidth={1.5} aria-hidden />
          </button>
        </div>
        <ul className="mt-4 divide-y divide-[color:var(--l-line)] border-y border-[color:var(--l-line)]">
          {FOOTER_LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="flex min-h-14 items-center py-3 text-lg font-medium">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className="sticky top-0 z-40 transition-shadow duration-150"
      style={{
        backgroundColor: 'var(--l-ground)',
        boxShadow: scrolled ? '0 1px 0 var(--l-line)' : 'none',
      }}
    >
      <nav aria-label="Main" className="l-wrap flex h-16 items-center justify-between gap-4">
        <Link href="/" className="l-display inline-flex min-h-11 items-center text-[1.375rem] font-medium tracking-[-0.01em]">
          RALP Outcomes
        </Link>

        <div className="hidden items-center gap-6 lg:flex">
          <ThemeButton />
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="l-link text-[0.9375rem]">
              {link.label}
            </a>
          ))}
          <Link href={PORTALS.clinician} className="l-cta l-cta-sm">
            Clinician sign-in
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeButton />
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={open}
            className="l-cta l-cta-sm"
          >
            Sign in
          </button>
        </div>
      </nav>
      {open && <MobileSheet onClose={close} />}
    </header>
  );
}
