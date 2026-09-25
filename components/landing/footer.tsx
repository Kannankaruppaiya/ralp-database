import Link from 'next/link';
import { FOOTER_LINKS } from './content';

// Trust line and support address come from env so nothing unconfirmed is hard-coded.
export function LandingFooter({ trustLine, supportEmail }: { trustLine?: string; supportEmail?: string }) {
  return (
    <footer className="border-t border-[color:var(--l-line)] py-16">
      <div className="l-wrap">
        <div className="flex items-center gap-3" aria-hidden>
          <span className="l-rule h-px w-16" />
          <span className="l-dot" />
          <span className="l-eyebrow">36 months</span>
        </div>
        <div className="mt-10 flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="l-display text-[length:var(--step-2)] font-medium">RALP Outcomes</p>
            {trustLine && <p className="mt-2 text-sm text-[color:var(--l-ink-muted)]">{trustLine}</p>}
            {supportEmail && (
              <p className="mt-2 text-sm text-[color:var(--l-ink-muted)]">
                Support:{' '}
                <a href={`mailto:${supportEmail}`} className="l-link">
                  {supportEmail}
                </a>
              </p>
            )}
          </div>
          <nav aria-label="Portals">
            <ul className="flex flex-col gap-3 sm:flex-row sm:gap-8">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="l-link inline-flex min-h-11 items-center text-[0.9375rem]">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
