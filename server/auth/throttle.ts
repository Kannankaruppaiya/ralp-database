import 'server-only';

/**
 * Counts failures per key inside a sliding window. Used to slow down guessing
 * against the patient sign-in, where the credential (name and date of birth) is
 * not a secret and so brute force is the realistic attack.
 *
 * ponytail: in-process map, so the count is per app instance. Move it to a
 * table if this application is ever run as more than one instance.
 */
export interface Throttle {
  blocked(key: string): boolean;
  fail(key: string): void;
  clear(key: string): void;
}

export function createThrottle({ limit, windowMs }: { limit: number; windowMs: number }): Throttle {
  const hits = new Map<string, number[]>();

  function recent(key: string): number[] {
    const cutoff = Date.now() - windowMs;
    const kept = (hits.get(key) ?? []).filter((at) => at > cutoff);
    if (kept.length) hits.set(key, kept);
    else hits.delete(key);
    return kept;
  }

  return {
    blocked: (key) => recent(key).length >= limit,
    fail: (key) => {
      const kept = recent(key);
      kept.push(Date.now());
      hits.set(key, kept);
    },
    clear: (key) => {
      hits.delete(key);
    },
  };
}

/** Ten failures per client address per fifteen minutes. */
export const patientLoginThrottle = createThrottle({ limit: 10, windowMs: 15 * 60_000 });
