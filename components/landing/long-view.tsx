'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from 'motion/react';
import { LONG_VIEW, MILESTONES } from './content';
import { EASE_OUT, Reveal } from './reveal';

const SPAN = 36; // months shown on the rule; theatre is month 0
const FIRST = MILESTONES[0].months;
const LAST = MILESTONES[MILESTONES.length - 1].months;
const pct = (months: number) => `${(months / SPAN) * 100}%`;

// Static illustration of how a rising PSA is flagged. Not patient data.
function PsaFlag() {
  return (
    <figure className="l-panel inline-block px-4 py-3 text-sm" aria-label="Illustration of a flagged PSA value">
      <div className="flex items-baseline gap-3">
        <span className="font-semibold">PSA</span>
        <span className="l-num text-[color:var(--l-signal)]">0.21 ng/mL</span>
        <span className="rounded-[2px] border border-[color:var(--l-signal)] px-1.5 text-xs font-semibold text-[color:var(--l-signal)]">
          Flagged
        </span>
      </div>
      <figcaption className="mt-1 text-xs text-[color:var(--l-ink-muted)]">Illustration · flagged at ≥ 0.2</figcaption>
    </figure>
  );
}

function Fields({ fields }: { fields: readonly string[] }) {
  return (
    <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-[color:var(--l-ink-muted)]" aria-label="Recorded at this review">
      {fields.map((f) => (
        <li key={f} className="flex items-center gap-2">
          <span className="h-px w-3 bg-[color:var(--l-accent)]" aria-hidden />
          {f}
        </li>
      ))}
    </ul>
  );
}

function Intro() {
  return (
    <Reveal>
      <p className="l-eyebrow">{LONG_VIEW.eyebrow}</p>
      <h2 id="long-view-heading" className="l-display mt-3 max-w-[22ch] text-[length:var(--step-5)]">{LONG_VIEW.heading}</h2>
      <p className="l-prose mt-5 text-[color:var(--l-ink-muted)]">{LONG_VIEW.intro}</p>
    </Reveal>
  );
}

// Mobile and reduced motion: every milestone visible, nothing pinned.
function MilestoneList() {
  return (
    <div className="l-wrap py-24">
      <Intro />
      <ol className="mt-14 border-l border-[color:var(--l-accent)]">
        {MILESTONES.map((m) => (
          <li key={m.id} className="relative pb-10 pl-8 last:pb-0">
            <span className="l-dot absolute -left-[5px] top-2" aria-hidden />
            <h3 className="l-num text-[length:var(--step-2)] font-medium">{m.shortLabel}</h3>
            <p className="l-prose mt-2 text-[color:var(--l-ink-muted)]">{m.description}</p>
            <Fields fields={m.fields} />
            {m.months === 12 && (
              <div className="mt-5">
                <PsaFlag />
              </div>
            )}
          </li>
        ))}
      </ol>
      <p className="l-prose mt-10 text-sm text-[color:var(--l-ink-muted)]">{LONG_VIEW.flagNote}</p>
    </div>
  );
}

// Desktop: a 240vh stage pinned with position: sticky; scroll moves the marker.
function PinnedTimeline() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const months = useTransform(scrollYProgress, [0.05, 0.95], [FIRST, LAST], { clamp: true });
  const left = useTransform(months, (m) => pct(m));
  const [active, setActive] = useState(0);

  useMotionValueEvent(months, 'change', (m) => {
    let i = 0;
    MILESTONES.forEach((ms, idx) => {
      if (ms.months <= m + 0.5) i = idx;
    });
    setActive(i);
  });

  const current = MILESTONES[active];

  return (
    <div ref={ref} className="relative h-[240vh]" data-testid="long-view-stage">
      <div className="sticky top-0 flex h-[100svh] flex-col justify-center">
        <div className="l-wrap">
          <Intro />

          <div className="relative mt-20 h-24">
            <div className="absolute left-0 right-0 top-6 h-px bg-[color:var(--l-line)]" aria-hidden />
            <motion.div className="l-rule absolute left-0 top-6 h-px" style={{ width: left }} aria-hidden />
            <span className="l-dot absolute top-6 -translate-x-1/2 -translate-y-1/2" style={{ left: 0 }} aria-hidden />
            <ol className="contents">
              {MILESTONES.map((m, i) => (
                <li
                  key={m.id}
                  className="absolute top-0 -translate-x-1/2 text-center"
                  style={{ left: pct(m.months) }}
                  aria-current={i === active ? 'step' : undefined}
                >
                  <span
                    className="l-num block text-sm transition-colors duration-150"
                    style={{ color: i <= active ? 'var(--l-ink)' : 'var(--l-ink-muted)' }}
                  >
                    {m.months}m
                  </span>
                  <span
                    className="mx-auto mt-2 block h-3 w-px transition-colors duration-150"
                    style={{ background: i <= active ? 'var(--l-accent)' : 'var(--l-line)' }}
                    aria-hidden
                  />
                </li>
              ))}
            </ol>
            <motion.span
              className="absolute top-6 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[color:var(--l-accent)] bg-[color:var(--l-ground)]"
              style={{ left }}
              aria-hidden
            />
          </div>

          <div className="mt-8 grid grid-cols-12 gap-8">
            <div className="relative col-span-7 min-h-[12rem]" aria-live="polite">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.42, ease: EASE_OUT }}
                >
                  <h3 className="l-num text-[length:var(--step-3)] font-medium">{current.shortLabel}</h3>
                  <p className="l-prose mt-3 text-[color:var(--l-ink-muted)]">{current.description}</p>
                  <Fields fields={current.fields} />
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="col-span-5 flex flex-col items-start gap-3 pt-2">
              <PsaFlag />
              <p className="max-w-[34ch] text-sm text-[color:var(--l-ink-muted)]">{LONG_VIEW.flagNote}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LongView() {
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px) and (prefers-reduced-motion: no-preference)');
    const update = () => setPinned(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return (
    <section aria-labelledby="long-view-heading" id="long-view" className="border-t border-[color:var(--l-line)]">
      {pinned ? <PinnedTimeline /> : <MilestoneList />}
    </section>
  );
}
