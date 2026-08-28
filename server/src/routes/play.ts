// server/src/routes/play.ts
import { Router } from 'express';
import { pool } from '../db.ts';
import { validatePhone } from '../util.ts';
import { dateBKK } from '../daily.ts';
import { computeBalanceFromRows } from '../points.ts';
import { isValidGameId } from '../games.ts';

export const playRouter = Router();

// POST /api/play  { phone, game_id, correct }
playRouter.post('/play', async (req, res) => {
  const phone = String(req.body?.phone ?? '').trim();
  const gameId = String(req.body?.game_id ?? '');
  const correct = Boolean(req.body?.correct);

  if (!validatePhone(phone)) return res.status(400).json({ error: 'เบอร์โทรไม่ถูกต้อง' });
  if (!isValidGameId(gameId)) return res.status(400).json({ error: 'game_id ไม่รู้จัก' });

  const today = dateBKK();

  const { rows: p } = await pool.query('SELECT id FROM players WHERE phone=$1', [phone]);
  if (p.length === 0) return res.status(400).json({ error: 'กรุณากรอกเบอร์ก่อนเล่น' });
  const playerId = p[0].id;

  const { rows: existing } = await pool.query(
    'SELECT 1 FROM plays WHERE player_id=$1 AND played_on=$2',
    [playerId, today],
  );
  if (existing.length > 0) {
    return res.status(409).json({ error: 'วันนี้เล่นแล้ว รอพรุ่งนี้ครับ', alreadyPlayed: true });
  }

  try {
    await pool.query(
      'INSERT INTO plays (player_id, game_id, played_on, points_awarded, correct) VALUES ($1,$2,$3,1,$4)',
      [playerId, gameId, today, correct],
    );
  } catch (e: any) {
    if (e?.code === '23505') {
      return res.status(409).json({ error: 'วันนี้เล่นแล้ว รอพรุ่งนี้ครับ', alreadyPlayed: true });
    }
    throw e;
  }

  const { rows: plays } = await pool.query('SELECT points_awarded FROM plays WHERE player_id=$1', [playerId]);
  const { rows: reds } = await pool.query('SELECT cost_points FROM redemptions WHERE player_id=$1', [playerId]);
  const balance = computeBalanceFromRows(plays, reds);

  res.json({ correct, pointsAwarded: 1, balance, todayPlayed: true });
});
