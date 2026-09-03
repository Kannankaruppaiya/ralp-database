import { describe, it, expect } from 'vitest';
import {
  formatNhs, stripNhs, ipssSeverity, shimSeverity, fromBaseline, toPatient,
} from '@/lib/mappers';

describe('NHS number formatting', () => {
  it('displays a stored 10-digit number in 3-3-4 groups', () => {
    expect(formatNhs('1234567890')).toBe('123 456 7890');
  });

  it('strips every non-digit back to storage form', () => {
    expect(stripNhs('123 456 7890')).toBe('1234567890');
    expect(stripNhs('NHS-123-456-7890')).toBe('1234567890');
  });
});

describe('PROM severity bands', () => {
  it('bands an IPSS total', () => {
    expect(ipssSeverity(20)).toBe('Severe');
    expect(ipssSeverity(8)).toBe('Moderate');
    expect(ipssSeverity(0)).toBe('Mild');
  });

  it('bands a SHIM total', () => {
    expect(shimSeverity(22)).toBe('No ED');
    expect(shimSeverity(17)).toBe('Mild ED');
    expect(shimSeverity(7)).toBe('Severe ED');
  });
});

describe('fromBaseline', () => {
  // The guarantee that makes partial saves safe: a key the form never displayed
  // must be absent, not null, or ON CONFLICT DO UPDATE would erase the column.
  it('drops keys the caller omitted rather than sending null', () => {
    const row = fromBaseline('p1', { psa: 6.5, gleasonGrade: '3+4' });

    expect(row).toHaveProperty('psa', 6.5);
    expect(row).toHaveProperty('gleason_grade', '3+4');
    expect('ukb_score' in row).toBe(false);
    expect('clinical_stage' in row).toBe(false);
    expect('notes' in row).toBe(false);
  });
});

describe('toPatient', () => {
  it('scores a demographics-only record at 20% complete', () => {
    const patient = toPatient({
      id: 'p1',
      first_name: 'John',
      surname: 'Smith',
      date_of_birth: '1960-04-12',
      nhs_number: '1234567890',
      hospital_number: 'HOS-00001',
      primary_surgeon: 'VK',
      status: 'Active',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    });

    expect(patient.nhsNumber).toBe('123 456 7890');
    expect(patient.completeness.score).toBe(20);
    expect(patient.completeness.missingFields).toHaveLength(3);
  });
});
