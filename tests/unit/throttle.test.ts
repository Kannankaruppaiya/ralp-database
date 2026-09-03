import { describe, it, expect, vi, afterEach } from 'vitest';
import { createThrottle } from '@/server/auth/throttle';

describe('createThrottle', () => {
  afterEach(() => vi.useRealTimers());

  it('allows attempts below the limit', () => {
    const t = createThrottle({ limit: 3, windowMs: 1000 });
    t.fail('a');
    t.fail('a');
    expect(t.blocked('a')).toBe(false);
  });

  it('blocks once the limit is reached', () => {
    const t = createThrottle({ limit: 3, windowMs: 1000 });
    t.fail('a');
    t.fail('a');
    t.fail('a');
    expect(t.blocked('a')).toBe(true);
  });

  it('counts each key separately', () => {
    const t = createThrottle({ limit: 1, windowMs: 1000 });
    t.fail('a');
    expect(t.blocked('a')).toBe(true);
    expect(t.blocked('b')).toBe(false);
  });

  it('forgets failures once the window has passed', () => {
    vi.useFakeTimers();
    const t = createThrottle({ limit: 1, windowMs: 1000 });
    t.fail('a');
    expect(t.blocked('a')).toBe(true);
    vi.advanceTimersByTime(1001);
    expect(t.blocked('a')).toBe(false);
  });

  it('clears a key on success', () => {
    const t = createThrottle({ limit: 1, windowMs: 1000 });
    t.fail('a');
    t.clear('a');
    expect(t.blocked('a')).toBe(false);
  });
});
