// server/tests/daily.test.ts
import { describe, it, expect } from 'vitest';
import { dateBKK, hashDailyGame } from '../src/daily.ts';

describe('dateBKK', () => {
  it('returns YYYY-MM-DD in Asia/Bangkok for a fixed UTC time', () => {
    // 2026-08-28T20:00:00Z = 2026-08-29T03:00 in BKK
    const d = new Date('2026-08-28T20:00:00Z');
    expect(dateBKK(d)).toBe('2026-08-29');
  });
});

describe('hashDailyGame', () => {
  const games = ['quiz', 'arrange'] as const;
  it('is stable within the same day', () => {
    const a = hashDailyGame('0812345678', '2026-08-28', games);
    const b = hashDailyGame('0812345678', '2026-08-28', games);
    expect(a).toBe(b);
    expect(games).toContain(a);
  });
  it('can differ across days', () => {
    const a = hashDailyGame('0812345678', '2026-08-28', games);
    const b = hashDailyGame('0812345678', '2026-08-29', games);
    expect(games).toContain(b);
  });
  it('varies by phone', () => {
    const a = hashDailyGame('0812345678', '2026-08-28', games);
    const b = hashDailyGame('0899999999', '2026-08-28', games);
    expect(games).toContain(a);
    expect(games).toContain(b);
  });
});
