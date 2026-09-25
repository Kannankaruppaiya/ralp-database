import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { CLINICIAN_PANEL, GOVERNANCE_PANEL, PATIENT_PANEL } from './content';
import { LANDING_MEDIA } from './media';

const patient = LANDING_MEDIA.patient;

// Asymmetric: the registry gets the wide panel; patients and governance stack beside it.
export function Portals() {
  return (
    <section aria-labelledby="portals-heading" className="border-t border-[color:var(--l-line)] py-24 lg:py-28">
      <div className="l-wrap">
        <h2 id="portals-heading" className="l-display max-w-[20ch] text-[length:var(--step-5)]">
          Three ways in, one record.
        </h2>

        <div className="mt-14 grid gap-6 lg:grid-cols-12">
          <article className="l-panel flex flex-col justify-between p-8 lg:col-span-7 lg:p-12">
            <div>
              <p className="l-eyebrow">{CLINICIAN_PANEL.heading}</p>
              <ul className="mt-8 divide-y divide-[color:var(--l-line)] border-y border-[color:var(--l-line)]">
                {CLINICIAN_PANEL.lines.map((line) => (
                  <li key={line} className="l-display py-5 text-[length:var(--step-2)]">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-12">
              <Link href={CLINICIAN_PANEL.cta.href} className="l-cta">
                {CLINICIAN_PANEL.cta.label}
                <ArrowRight size={20} strokeWidth={1.5} aria-hidden />
              </Link>
            </div>
          </article>

          <div className="grid gap-6 lg:col-span-5">
            <article id="patients" className="l-panel scroll-mt-24 overflow-hidden">
              <div className="grid sm:grid-cols-5">
                <picture className="relative block aspect-[4/3] sm:col-span-2 sm:aspect-auto">
                  <source srcSet={patient.avif} type="image/avif" />
                  <img
                    src={patient.jpg}
                    alt="A mug of tea and reading glasses on a kitchen table by a sunny window."
                    width={patient.width}
                    height={patient.height}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </picture>
                <div className="p-8 sm:col-span-3">
                  <p className="l-eyebrow">{PATIENT_PANEL.heading}</p>
                  <p className="mt-4 text-[length:var(--step-1)] leading-[1.5]">{PATIENT_PANEL.body}</p>
                  <Link href={PATIENT_PANEL.cta.href} className="l-link mt-6 inline-flex min-h-11 items-center gap-2">
                    {PATIENT_PANEL.cta.label}
                    <ArrowRight size={20} strokeWidth={1.5} aria-hidden />
                  </Link>
                </div>
              </div>
            </article>

            <article id="governance" className="l-panel scroll-mt-24 p-8">
              <p className="l-eyebrow">{GOVERNANCE_PANEL.heading}</p>
              <p className="mt-4 text-[color:var(--l-ink-muted)]">{GOVERNANCE_PANEL.body}</p>
              <Link href={GOVERNANCE_PANEL.cta.href} className="l-link mt-6 inline-flex min-h-11 items-center gap-2">
                {GOVERNANCE_PANEL.cta.label}
                <ArrowRight size={20} strokeWidth={1.5} aria-hidden />
              </Link>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
