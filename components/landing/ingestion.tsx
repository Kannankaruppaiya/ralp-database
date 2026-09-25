'use client';

import { motion, useReducedMotion } from 'motion/react';
import { INGESTION } from './content';
import { EASE_OUT, Reveal } from './reveal';

// Document → side-by-side review → record, joined by a line that draws on enter.
function Diagram() {
  const reduce = useReducedMotion();
  const stroke = { stroke: 'var(--l-line)', strokeWidth: 1.5, fill: 'var(--l-surface)' };
  const ink = { stroke: 'var(--l-ink-muted)', strokeWidth: 1.5, strokeLinecap: 'round' as const };
  return (
    <svg viewBox="0 0 560 160" className="h-auto w-full" role="img" aria-label="A document, a side-by-side review, then a structured record">
      {/* document */}
      <rect x="8" y="24" width="96" height="120" rx="2" {...stroke} />
      {[48, 64, 80, 96, 112].map((y, i) => (
        <line key={y} x1="24" x2={i % 2 ? 72 : 88} y1={y} y2={y} {...ink} />
      ))}
      {/* side by side */}
      <rect x="216" y="24" width="128" height="120" rx="2" {...stroke} />
      <line x1="280" x2="280" y1="24" y2="144" stroke="var(--l-line)" strokeWidth="1.5" />
      {[48, 72, 96, 120].map((y) => (
        <g key={y}>
          <line x1="230" x2="266" y1={y} y2={y} {...ink} />
          <line x1="294" x2="330" y1={y} y2={y} stroke="var(--l-accent)" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      ))}
      {/* record */}
      <rect x="456" y="24" width="96" height="120" rx="2" {...stroke} />
      {[52, 84, 116].map((y) => (
        <g key={y}>
          <circle cx="474" cy={y} r="3" fill="var(--l-accent)" />
          <line x1="486" x2="536" y1={y} y2={y} {...ink} />
        </g>
      ))}
      <motion.path
        d="M104 84 H216 M344 84 H456"
        fill="none"
        stroke="var(--l-accent)"
        strokeWidth="1.5"
        initial={reduce ? false : { pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true, margin: '0px 0px -20% 0px' }}
        transition={{ duration: 0.9, ease: EASE_OUT }}
      />
    </svg>
  );
}

export function Ingestion() {
  return (
    <section aria-labelledby="ingestion-heading" className="border-t border-[color:var(--l-line)] py-24 lg:py-28">
      <div className="l-wrap grid gap-14 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Reveal>
            <p className="l-eyebrow">{INGESTION.eyebrow}</p>
            <h2 id="ingestion-heading" className="l-display mt-3 text-[length:var(--step-4)]">
              {INGESTION.heading}
            </h2>
          </Reveal>
          <ol className="mt-10 space-y-8">
            {INGESTION.steps.map((step, i) => (
              <li key={step.title} className="grid grid-cols-[2rem_1fr] gap-x-3">
                <span className="l-num l-display text-[length:var(--step-2)] text-[color:var(--l-accent)]" aria-hidden>
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="mt-1 text-[color:var(--l-ink-muted)]">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="flex items-center lg:col-span-7">
          <Diagram />
        </div>
      </div>
    </section>
  );
}
