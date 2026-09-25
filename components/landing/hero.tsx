'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { HERO } from './content';
import { LANDING_MEDIA } from './media';
import { EASE_OUT } from './reveal';

const media = LANDING_MEDIA.hero;

// Plays the clip once on desktop, then holds its last frame. Mounted only after
// hydration, and never when motion is reduced, so the poster stays the LCP element.
function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    let visible = true;
    const sync = () => {
      if (video.ended) return;
      if (visible && !document.hidden) void video.play().catch(() => {});
      else video.pause();
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    io.observe(video);
    document.addEventListener('visibilitychange', sync);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);

  return (
    <video
      ref={ref}
      autoPlay
      muted
      playsInline
      preload="metadata"
      poster={media.poster.jpg}
      aria-hidden
      tabIndex={-1}
      className="absolute inset-0 h-full w-full object-cover"
    >
      <source src={media.webm} type="video/webm" />
      <source src={media.mp4} type="video/mp4" />
    </video>
  );
}

export function LandingHero() {
  const reduce = useReducedMotion();
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    const still = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setShowVideo(desktop.matches && !still.matches);
    update();
    desktop.addEventListener('change', update);
    still.addEventListener('change', update);
    return () => {
      desktop.removeEventListener('change', update);
      still.removeEventListener('change', update);
    };
  }, []);

  const line = (i: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.9, ease: EASE_OUT, delay: 0.1 + i * 0.08 },
        };

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative lg:grid lg:min-h-[calc(100svh-4rem)] lg:grid-cols-12"
    >
      <div
        className="relative flex flex-col justify-center px-4 pb-12 pt-12 md:px-8 lg:col-span-5 lg:pb-24 lg:pr-12 lg:pt-16"
        style={{ paddingLeft: 'max(16px, calc((100vw - 1320px) / 2 + 32px))' }}
      >
        <h1 id="hero-heading" className="l-display l-hero-title">
          <motion.span className="block" {...line(0)}>
            {HERO.headlineLead}
          </motion.span>
          <motion.span className="block" {...line(1)}>
            {HERO.headlineRest} <em className="italic text-[color:var(--l-accent)]">{HERO.headlineItalic}</em>.
          </motion.span>
        </h1>
        <motion.p
          className="l-prose mt-6 max-w-[34rem] text-[length:var(--step-1)] leading-[1.5] text-[color:var(--l-ink-muted)]"
          {...line(2)}
        >
          {HERO.subhead}
        </motion.p>
        <motion.div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4" {...line(3)}>
          <Link href={HERO.primary.href} className="l-cta">
            {HERO.primary.label}
          </Link>
          <Link href={HERO.secondary.href} className="l-link">
            {HERO.secondary.label} <span aria-hidden>→</span>
          </Link>
        </motion.div>

        {/* Start of the long-view line: day zero is the operation. */}
        <div className="mt-14 flex items-center gap-3" aria-hidden>
          <span className="l-dot" />
          <span className="l-eyebrow">Theatre</span>
        </div>
        {/* Runs through the bottom padding so the line meets the next section. */}
        <span aria-hidden className="l-rule -mb-24 ml-[4px] mt-3 hidden h-24 w-px lg:block" />
      </div>

      <div className="relative h-[56svh] overflow-hidden bg-[color:var(--l-surface)] lg:col-span-7 lg:h-auto">
        <picture>
          <source media="(max-width: 1023px)" srcSet={media.mobile.avif} type="image/avif" />
          <source media="(max-width: 1023px)" srcSet={media.mobile.jpg} type="image/jpeg" />
          <source media="(prefers-reduced-motion: reduce)" srcSet={media.end.avif} type="image/avif" />
          <source media="(prefers-reduced-motion: reduce)" srcSet={media.end.jpg} type="image/jpeg" />
          <source srcSet={media.poster.avif} type="image/avif" />
          <img
            src={media.poster.jpg}
            alt="An empty, quiet operating theatre with a robotic surgical system at rest."
            width={media.width}
            height={media.height}
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </picture>
        {showVideo && <HeroVideo />}
      </div>
    </section>
  );
}
