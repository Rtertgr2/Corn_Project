// web/src/api.ts
// เรียก API ผ่าน proxy /api

async function req<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'เกิดข้อผิดพลาด');
  }
  return res.json() as Promise<T>;
}

export const api = {
  start: (phone: string) =>
    req<{ balance: number; todayPlayed: boolean; todayGame: string; todayCorrect: boolean | null }>(
      '/api/start',
      { method: 'POST', body: JSON.stringify({ phone }) },
    ),
  play: (phone: string, game_id: string, correct: boolean) =>
    req<{ correct: boolean; pointsAwarded: number; balance: number; todayPlayed: boolean }>(
      '/api/play',
      { method: 'POST', body: JSON.stringify({ phone, game_id, correct }) },
    ),
  rewards: (phone: string) =>
    req<{ balance: number; rewards: { id: number; name: string; description: string; cost_points: number; canAfford: boolean }[] }>(
      `/api/rewards?phone=${encodeURIComponent(phone)}`,
    ),
  redeem: (phone: string, reward_id: number) =>
    req<{ coupon_code: string; balance: number }>(
      '/api/redeem',
      { method: 'POST', body: JSON.stringify({ phone, reward_id }) },
    ),
  me: (phone: string) =>
    req<{ balance: number; history: any[]; redemptions: any[] }>(
      `/api/me?phone=${encodeURIComponent(phone)}`,
    ),
};
