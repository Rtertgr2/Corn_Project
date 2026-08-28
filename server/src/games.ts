// server/src/games.ts

export const GAME_IDS = ['quiz', 'arrange'] as const;
export type GameId = (typeof GAME_IDS)[number];

/** ตรวจว่า game_id อยู่ในชุดที่รองรับ */
export function isValidGameId(id: string): id is GameId {
  return (GAME_IDS as readonly string[]).includes(id);
}
