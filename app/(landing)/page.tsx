import type { Metadata } from 'next';
import { LandingNav } from '@/components/landing/nav';
import { LandingHero } from '@/components/landing/hero';
import { LongView } from '@/components/landing/long-view';
import { Portals } from '@/components/landing/portals';
import { Ingestion } from '@/components/landing/ingestion';
import { Governance } from '@/components/landing/governance';
import { LandingFooter } from '@/components/landing/footer';
import { LANDING_MEDIA } from '@/components/landing/media';

const description =
  'One registry for the whole RALP pathway, from baseline cancer profile to the 36-month review, with patients reporting their own recovery.';

export const metadata: Metadata = {
  title: 'RALP Outcomes — every prostatectomy, followed for three years',
  description,
  openGraph: {
    title: 'RALP Outcomes',
    description,
    images: [{ url: LANDING_MEDIA.og.jpg, width: LANDING_MEDIA.og.width, height: LANDING_MEDIA.og.height }],
  },
};

export default function LandingPage() {
  return (
    <div className="landing">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-[color:var(--l-surface)] focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <LandingNav />
      <main id="main">
        <LandingHero />
        <LongView />
        <Portals />
        <Ingestion />
        <Governance />
      </main>
      <LandingFooter
        trustLine={process.env.NEXT_PUBLIC_TRUST_LINE || undefined}
        supportEmail={process.env.NEXT_PUBLIC_SUPPORT_EMAIL || undefined}
      />
    </div>
  );
}
