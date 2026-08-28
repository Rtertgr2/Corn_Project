// server/src/routes/player.ts
import { Router } from 'express';
import { pool } from '../db.ts';
import { validatePhone } from '../util.ts';
import { dateBKK, hashDailyGame } from '../daily.ts';
import { computeBalanceFromRows } from '../points.ts';
import { GAME_IDS } from '../games.ts';

export const playerRouter = Router();

// POST /api/start  { phone }
playerRouter.post('/start', async (req, res) => {
  const phone = String(req.body?.phone ?? '').trim();
  if (!validatePhone(phone)) {
    return res.status(400).json({ error: 'เบอร์โทรไม่ถูกต้อง (ต้องเป็นตัวเลข 9-10 หลัก)' });
  }
  const today = dateBKK();
  const { rows: p } = await pool.query(
    `INSERT INTO players (phone) VALUES ($1)
     ON CONFLICT (phone) DO UPDATE SET phone = EXCLUDED.phone
     RETURNING id`,
    [phone],
  );
  const playerId = p[0].id;

  const { rows: todayPlays } = await pool.query(
    'SELECT game_id, correct FROM plays WHERE player_id=$1 AND played_on=$2',
    [playerId, today],
  );
  const playedToday = todayPlays.length > 0;
  const todayGame = playedToday ? todayPlays[0].game_id : hashDailyGame(phone, today, GAME_IDS);

  const { rows: plays } = await pool.query('SELECT points_awarded FROM plays WHERE player_id=$1', [playerId]);
  const { rows: reds } = await pool.query('SELECT cost_points FROM redemptions WHERE player_id=$1', [playerId]);
  const balance = computeBalanceFromRows(plays, reds);

  res.json({
    balance,
    todayPlayed: playedToday,
    todayGame,
    todayCorrect: playedToday ? todayPlays[0].correct : null,
  });
});

// GET /api/me?phone=xxx
playerRouter.get('/me', async (req, res) => {
  const phone = String(req.query.phone ?? '').trim();
  if (!validatePhone(phone)) return res.status(400).json({ error: 'เบอร์โทรไม่ถูกต้อง' });
  const { rows: p } = await pool.query('SELECT id FROM players WHERE phone=$1', [phone]);
  if (p.length === 0) return res.json({ balance: 0, history: [], redemptions: [] });
  const playerId = p[0].id;

  const { rows: plays } = await pool.query(
    'SELECT game_id, played_on, points_awarded, correct FROM plays WHERE player_id=$1 ORDER BY played_on DESC',
    [playerId],
  );
  const { rows: reds } = await pool.query(
    `SELECT rd.coupon_code, rw.name, rd.cost_points, rd.created_at
     FROM redemptions rd JOIN rewards rw ON rw.id = rd.reward_id
     WHERE rd.player_id=$1 ORDER BY rd.created_at DESC`,
    [playerId],
  );
  const balance = computeBalanceFromRows(plays, reds);
  res.json({ balance, history: plays, redemptions: reds });
});
