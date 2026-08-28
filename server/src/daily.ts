// server/src/daily.ts
import { hashCode } from './util.ts';

/** คืนวันที่ YYYY-MM-DD ตามเขตเวลา Asia/Bangkok */
export function dateBKK(now: Date = new Date()): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(now); // en-CA => YYYY-MM-DD
}

/**
 * เลือก game_id วันละอันแบบ deterministic จากเบอร์ + วัน
 * ทำให้เกมเดียวตลอดวัน แม้รีเฟรช (ไม่ต้องเก็บสถานะเพิ่ม)
 */
export function hashDailyGame(
  phone: string,
  dateStr: string,
  gameIds: readonly string[],
): string {
  const idx = hashCode(`${phone}|${dateStr}`) % gameIds.length;
  return gameIds[idx];
}
