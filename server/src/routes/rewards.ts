// server/src/routes/rewards.ts
import { Router } from 'express';
import { pool } from '../db.ts';
import { validatePhone } from '../util.ts';
import { computeBalanceFromRows, generateCouponCode } from '../points.ts';

export const rewardsRouter = Router();

// GET /api/rewards?phone=xxx
rewardsRouter.get('/rewards', async (req, res) => {
  const phone = String(req.query.phone ?? '').trim();
  if (!validatePhone(phone)) return res.status(400).json({ error: 'เบอร์โทรไม่ถูกต้อง' });

  const { rows: rewards } = await pool.query(
    'SELECT id, name, description, cost_points FROM rewards WHERE active=true ORDER BY cost_points',
  );
  let balance = 0;
  const { rows: p } = await pool.query('SELECT id FROM players WHERE phone=$1', [phone]);
  if (p.length > 0) {
    const playerId = p[0].id;
    const { rows: plays } = await pool.query('SELECT points_awarded FROM plays WHERE player_id=$1', [playerId]);
    const { rows: reds } = await pool.query('SELECT cost_points FROM redemptions WHERE player_id=$1', [playerId]);
    balance = computeBalanceFromRows(plays, reds);
  }
  res.json({
    balance,
    rewards: rewards.map((r) => ({ ...r, canAfford: balance >= r.cost_points })),
  });
});

// POST /api/redeem  { phone, reward_id }
rewardsRouter.post('/redeem', async (req, res) => {
  const phone = String(req.body?.phone ?? '').trim();
  const rewardId = Number(req.body?.reward_id);
  if (!validatePhone(phone)) return res.status(400).json({ error: 'เบอร์โทรไม่ถูกต้อง' });
  if (!Number.isInteger(rewardId)) return res.status(400).json({ error: 'reward_id ไม่ถูกต้อง' });

  const { rows: p } = await pool.query('SELECT id FROM players WHERE phone=$1', [phone]);
  if (p.length === 0) return res.status(400).json({ error: 'กรุณากรอกเบอร์ก่อนแลก' });
  const playerId = p[0].id;

  const { rows: rw } = await pool.query('SELECT id, cost_points FROM rewards WHERE id=$1 AND active=true', [rewardId]);
  if (rw.length === 0) return res.status(400).json({ error: 'ไม่พบของรางวัลนี้' });
  const cost = rw[0].cost_points;

  const { rows: plays } = await pool.query('SELECT points_awarded FROM plays WHERE player_id=$1', [playerId]);
  const { rows: reds } = await pool.query('SELECT cost_points FROM redemptions WHERE player_id=$1', [playerId]);
  const balance = computeBalanceFromRows(plays, reds);
  if (balance < cost) {
    return res.status(400).json({ error: 'แต้มไม่พอ สะสมอีกนิดนะ', balance, cost });
  }

  // สร้างโค้ด ค้นหาซ้ำใน DB แล้ว retry
  let code = generateCouponCode();
  for (let i = 0; i < 5; i++) {
    try {
      await pool.query(
        'INSERT INTO redemptions (player_id, reward_id, coupon_code, cost_points) VALUES ($1,$2,$3,$4)',
        [playerId, rewardId, code, cost],
      );
      break;
    } catch (e: any) {
      if (e?.code === '23505') { code = generateCouponCode(); continue; }
      throw e;
    }
  }

  const newBalance = balance - cost;
  res.json({ coupon_code: code, balance: newBalance });
});
