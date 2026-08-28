// server/src/points.ts

export const COUPON_PREFIX = 'YJ'; // Yingcharoen

/** ยอดแต้ม = รวมที่ได้ - รวมที่แลก (คำนวณสด ไม่มี ledger แยก) */
export function computeBalanceFromRows(
  plays: { points_awarded: number }[],
  redemptions: { cost_points: number }[],
): number {
  const earned = plays.reduce((s, p) => s + p.points_awarded, 0);
  const spent = redemptions.reduce((s, r) => s + r.cost_points, 0);
  return earned - spent;
}

/** สร้างรหัสคูปอง เช่น YJ-7F3K9Q2X (prefix + base36 8 ตัว) */
export function generateCouponCode(): string {
  const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
  const padded = (rand + '00000000').slice(0, 8);
  return `${COUPON_PREFIX}-${padded}`;
}
