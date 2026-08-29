import { Router } from 'express';
import { pool } from '../db.ts';

export const quizRouter = Router();

const QUESTIONS = [
  { q: 'ตลาดยิ่งเจริญตั้งอยู่ที่เขตใด?', options: ['จตุจักร', 'บางเขน', 'บึงกุ่ม', 'ห้วยขวาง'], answer: 1 },
  { q: 'ข้าวโพดนิยมปลูกในฤดูใด?', options: ['ฤดูฝน', 'ฤดูร้อน', 'ฤดูหนาว', 'ฤดูแล้ง'], answer: 0 },
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

  let correctCount = 0;
  for (let i = 0; i < QUESTIONS.length; i++) {
    if (answers[i] === QUESTIONS[i].answer) correctCount++;
  }

  let points = 0;
  let message = '';
  let nextAction: 'home' | 'mini-farm' = 'home';

  if (correctCount === QUESTIONS.length) {
    points = 5;
    message = 'เยี่ยมมาก!';
    nextAction = 'mini-farm';
  } else if (correctCount > 0) {
    points = 1;
    message = `ตอบถูก ${correctCount} จาก ${QUESTIONS.length} ข้อ`;
    nextAction = 'home';
  } else {
    points = 1;
    message = 'ไว้โอกาสหน้านะครับ อย่าเสียใจนะ';
    nextAction = 'home';
  }

  res.json({
    correctCount,
    total: QUESTIONS.length,
    points,
    message,
    nextAction,
    perfect: correctCount === QUESTIONS.length,
  });
});

export { QUESTIONS };
