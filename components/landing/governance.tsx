import { GOVERNANCE } from './content';
import { Reveal } from './reveal';

export function Governance() {
  return (
    <section aria-labelledby="governance-heading" className="border-t border-[color:var(--l-line)] bg-[color:var(--l-surface)] py-24 lg:py-28">
      <div className="l-wrap grid gap-12 lg:grid-cols-12">
        <Reveal className="lg:col-span-5">
          <p className="l-eyebrow">{GOVERNANCE.eyebrow}</p>
          <h2 id="governance-heading" className="l-display mt-3 max-w-[16ch] text-[length:var(--step-4)]">
            {GOVERNANCE.heading}
          </h2>
        </Reveal>
        <dl className="grid gap-x-10 sm:grid-cols-2 lg:col-span-7">
          {GOVERNANCE.items.map((item) => (
            <div key={item.term} className="border-t border-[color:var(--l-line)] py-6">
              <dt className="font-semibold">{item.term}</dt>
              <dd className="mt-2 text-[color:var(--l-ink-muted)]">{item.detail}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
