import { describe, it, expect } from 'vitest';
import { APP_CONFIG } from '@/config/environment';

describe('test harness', () => {
  it('resolves the @/ alias into app code', () => {
    expect(typeof APP_CONFIG.name).toBe('string');
  });
});
