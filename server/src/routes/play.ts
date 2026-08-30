// server/src/routes/play.ts
import { Router } from 'express';
import { pool } from '../db.ts';
import { validatePhone } from '../util.ts';
import { dateBKK } from '../daily.ts';
import { computeBalanceFromRows } from '../points.ts';
import { isValidGameId } from '../games.ts';

export const playRouter = Router();

// POST /api/play  { phone, game_id, correct, points? }
playRouter.post('/play', async (req, res) => {
  const phone = String(req.body?.phone ?? '').trim();
  const gameId = String(req.body?.game_id ?? '');
  const correct = Boolean(req.body?.correct);
  const points = Number(req.body?.points) || 1;

  if (!validatePhone(phone)) return res.status(400).json({ error: 'เบอร์โทรไม่ถูกต้อง' });
  if (!isValidGameId(gameId)) return res.status(400).json({ error: 'game_id ไม่รู้จัก' });
  if (points < 1 || points > 100) return res.status(400).json({ error: 'แต้มไม่ถูกต้อง' });

  const today = dateBKK();

  const { rows: p } = await pool.query('SELECT id FROM players WHERE phone=$1', [phone]);
  if (p.length === 0) return res.status(400).json({ error: 'กรุณากรอกเบอร์ก่อนเล่น' });
  const playerId = p[0].id;

  await pool.query(
    'INSERT INTO plays (player_id, game_id, played_on, points_awarded, correct) VALUES ($1,$2,$3,$4,$5)',
    [playerId, gameId, today, points, correct],
  );

  const { rows: plays } = await pool.query('SELECT points_awarded FROM plays WHERE player_id=$1', [playerId]);
  const { rows: reds } = await pool.query('SELECT cost_points FROM redemptions WHERE player_id=$1', [playerId]);
  const balance = computeBalanceFromRows(plays, reds);

  res.json({ correct, pointsAwarded: points, balance, todayPlayed: true });
});
