// server/tests/util.test.ts
import { describe, it, expect } from 'vitest';
import { validatePhone, hashCode } from '../src/util.ts';

describe('validatePhone', () => {
  it('accepts 10-digit Thai mobile', () => {
    expect(validatePhone('0812345678')).toBe(true);
  });
  it('rejects too short', () => {
    expect(validatePhone('08123')).toBe(false);
  });
  it('rejects non-digits', () => {
    expect(validatePhone('08a2345678')).toBe(false);
  });
  it('accepts 9-digit', () => {
    expect(validatePhone('812345678')).toBe(true);
  });
});

describe('hashCode', () => {
  it('is deterministic and non-negative', () => {
    expect(hashCode('0812345678|2026-08-28')).toBe(hashCode('0812345678|2026-08-28'));
    expect(hashCode('x')).toBeGreaterThanOrEqual(0);
  });
});
