import { Router } from 'express';
import { pool } from '../db.ts';
import { computeBalanceFromRows } from '../points.ts';

export const quizRouter = Router();

const QUESTIONS = [
  { q: 'ตลาดยิ่งเจริญตั้งอยู่ที่เขตใด?', options: ['จตุจักร', 'บางเขน', 'บึงกุ่ม', 'ห้วยขวาง'], answer: 1 },
  { q: 'ข้าวโพดนิยมปลูกในฤดูใด?', options: ['ฤดูฝน', 'ฤดูร้อน', 'ฤดูหนาว', 'ฤดูไม่มีฝน'], answer: 0 },
  { q: 'เมล็ดข้าวโพดเมื่อรวมกันจะกลายเป็นอะไร?', options: ['ต้นกล้า', 'ดอกไม้', 'ผลไม้', 'ใบไม้'], answer: 0 },
];

quizRouter.get('/questions', (_req, res) => {
  res.json({
    questions: QUESTIONS.map(({ q, options }) => ({ q, options })),
  });
});

quizRouter.post('/submit', async (req, res) => {
  const { phone, answers } = req.body;
  if (!phone || !Array.isArray(answers)) {
    return res.status(400).json({ error: 'ข้อมูลไม่ครบ' });
  }

  const { rows: p } = await pool.query('SELECT id FROM players WHERE phone=$1', [phone]);
  if (p.length === 0) return res.status(400).json({ error: 'ไม่พบผู้เล่น' });
  const playerId = p[0].id;

  let correctCount = 0;
  for (let i = 0; i < QUESTIONS.length; i++) {
    if (answers[i] === QUESTIONS[i].answer) correctCount++;
  }

  // ถูกหมด = 5 แต้ม, ถูกบางข้อ = 1 แต้ม, ไม่ถูกเลย = 0
  const points = correctCount === QUESTIONS.length ? 5 : correctCount > 0 ? 1 : 0;

  res.json({
    correctCount,
    total: QUESTIONS.length,
    points,
    perfect: correctCount === QUESTIONS.length,
  });
});

export { QUESTIONS };
