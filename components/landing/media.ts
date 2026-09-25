// Media manifest for the landing page. Files live in public/landing/ and are produced by
// `npm run landing:media`; swapping a source clip or still needs no code change.
export const LANDING_MEDIA = {
  hero: {
    webm: '/landing/hero.webm',
    mp4: '/landing/hero.mp4',
    // First frame: painted under the video so the LCP element is an image.
    poster: { avif: '/landing/hero-poster.avif', jpg: '/landing/hero-poster.jpg' },
    // Last frame: shown instead of the video when motion is reduced.
    end: { avif: '/landing/hero-end.avif', jpg: '/landing/hero-end.jpg' },
    // Below 1024px a 4:5 still replaces the video (no mobile clip yet).
    mobile: { avif: '/landing/hero-m.avif', jpg: '/landing/hero-m.jpg' },
    width: 1280,
    height: 720,
  },
  patient: {
    avif: '/landing/patient.avif',
    jpg: '/landing/patient.jpg',
    width: 960,
    height: 1200,
  },
  og: { jpg: '/landing/og.jpg', width: 1200, height: 630 },
} as const;
