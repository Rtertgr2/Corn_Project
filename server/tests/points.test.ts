// server/tests/points.test.ts
import { describe, it, expect } from 'vitest';
import { computeBalanceFromRows, generateCouponCode, COUPON_PREFIX } from '../src/points.ts';

describe('computeBalanceFromRows', () => {
  it('sums plays minus redemptions', () => {
    const plays = [{ points_awarded: 1 }, { points_awarded: 1 }, { points_awarded: 1 }];
    const reds = [{ cost_points: 10 }, { cost_points: 5 }];
    expect(computeBalanceFromRows(plays, reds)).toBe(3 - 15);
  });
  it('is 0 when empty', () => {
    expect(computeBalanceFromRows([], [])).toBe(0);
  });
});

describe('generateCouponCode', () => {
  it('starts with prefix, is 11 chars (YJ- + 8), uppercased', () => {
    const a = generateCouponCode();
    const b = generateCouponCode();
    expect(a.startsWith(COUPON_PREFIX + '-')).toBe(true);
    expect(a.length).toBe(11); // YJ- (3) + 8 random
    expect(a).toBe(a.toUpperCase());
    expect(a).not.toBe(b);
  });
});
