import { describe, expect, it } from 'vitest';
import { FOLLOW_UP_MILESTONES } from '@/config/follow-ups';
import {
  CLINICIAN_PANEL,
  FOOTER_LINKS,
  GOVERNANCE_PANEL,
  HERO,
  MILESTONES,
  NAV_LINKS,
  PATIENT_PANEL,
} from '@/components/landing/content';

describe('landing timeline', () => {
  it('renders exactly the follow-up schedule the registry uses', () => {
    expect(MILESTONES).toHaveLength(FOLLOW_UP_MILESTONES.length);
    expect(MILESTONES.map((m) => m.months)).toEqual([2, 6, 12, 18, 24, 30, 36]);
    MILESTONES.forEach((m, i) => {
      expect(m.id).toBe(FOLLOW_UP_MILESTONES[i].milestone);
      expect(m.shortLabel).toBe(FOLLOW_UP_MILESTONES[i].shortLabel);
      expect(m.description).toBe(FOLLOW_UP_MILESTONES[i].description);
    });
  });

  it('shows human labels for recorded fields', () => {
    for (const m of MILESTONES) {
      for (const f of m.fields) expect(['PSA', 'IPSS', 'SHIM', 'Continence']).toContain(f);
    }
  });
});

describe('landing CTAs', () => {
  const allowed = new Set(['/login', '/patient-login', '/admin-login']);
  const hrefs = [
    HERO.primary.href,
    HERO.secondary.href,
    CLINICIAN_PANEL.cta.href,
    PATIENT_PANEL.cta.href,
    GOVERNANCE_PANEL.cta.href,
    ...NAV_LINKS.map((l) => l.href),
    ...FOOTER_LINKS.map((l) => l.href),
  ];

  it('only point at a portal or an in-page anchor', () => {
    for (const href of hrefs) expect(allowed.has(href) || href.startsWith('#')).toBe(true);
  });

  it('route each audience to its own portal', () => {
    expect(HERO.primary.href).toBe('/login');
    expect(PATIENT_PANEL.cta.href).toBe('/patient-login');
    expect(GOVERNANCE_PANEL.cta.href).toBe('/admin-login');
  });
});
