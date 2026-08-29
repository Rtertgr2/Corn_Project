// web/src/games/QuizGame.tsx
// เกมตอบคำถามชุมชนสั้นๆ — 3 ข้อปรนัย
import { useState } from 'react';

const QUESTIONS = [
  {
    q: 'ตลาดยิ่งเจริญตั้งอยู่ที่เขตใด?',
    options: ['จตุจักร', 'บางเขน', 'บึงกุ่ม', 'ห้วยขวาง'],
    answer: 1,
  },
  {
    q: 'ข้าวโพดนิยมปลูกในฤดูใด?',
    options: ['ฤดูฝน', 'ฤดูร้อน', 'ฤดูหนาว', 'ฤดูแล้ง'],
    answer: 0,
  },
  {
    q: 'เมล็ดข้าวโพดเมื่อรวมกันจะกลายเป็นอะไร?',
    options: ['ต้นกล้า', 'ดอกไม้', 'ผลไม้', 'ใบไม้'],
    answer: 0,
  },
];

export default function QuizGame({ onComplete }: { onComplete: (correct: boolean) => void }) {
  const [answers, setAnswers] = useState<(number | null)[]>([null, null, null]);
  const [result, setResult] = useState<{
    correctCount: number;
    points: number;
    message: string;
    nextAction: 'home' | 'mini-farm';
    perfect: boolean;
  } | null>(null);

  const selectAnswer = (questionIdx: number, optionIdx: number) => {
    if (result) return;
    const newAnswers = [...answers];
    newAnswers[questionIdx] = optionIdx;
    setAnswers(newAnswers);
  };

  const submit = () => {
    if (result) return;
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

    setResult({ correctCount, points, message, nextAction, perfect: correctCount === QUESTIONS.length });

    setTimeout(() => {
      onComplete(nextAction === 'mini-farm' || points > 0);
    }, 2000);
  };

  const allAnswered = answers.every(a => a !== null);

  return (
    <div>
      {QUESTIONS.map((q, qi) => (
        <div key={qi} style={{ marginBottom: 'var(--space-lg)' }}>
          <p style={{ fontWeight: 700, marginBottom: 'var(--space-sm)', color: 'var(--color-text)' }}>
            {qi + 1}. {q.q}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {q.options.map((opt, oi) => (
              <button
                key={oi}
                onClick={() => selectAnswer(qi, oi)}
                className={answers[qi] === oi ? 'game-option-btn selected' : 'game-option-btn'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  gap: 8,
                }}
              >
                <span style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: answers[qi] === oi ? 'var(--color-primary)' : 'var(--color-muted)',
                  color: answers[qi] === oi ? '#fff' : 'var(--color-primary)',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {String.fromCharCode(65 + oi)}
                </span>
                <span style={{ fontSize: '0.9rem', fontWeight: 500, textAlign: 'left' }}>{opt}</span>
              </button>
            ))}
          </div>
        </div>
      ))}

      {!result && (
        <button
          className="btn btn-accent btn-block"
          disabled={!allAnswered}
          onClick={submit}
          style={{ marginTop: 'var(--space-md)' }}
        >
          {allAnswered ? 'ส่งคำตอบ' : 'กรุณาตอบให้ครบทั้ง 3 ข้อ'}
        </button>
      )}

      {result && (
        <div className={result.perfect ? 'msg-success' : 'msg-info'} style={{ marginTop: 'var(--space-md)' }}>
          <p style={{ fontWeight: 700, marginBottom: 'var(--space-sm)' }}>{result.message}</p>
          <p style={{ fontSize: '0.85rem' }}>
            ตอบถูก {result.correctCount} จาก {QUESTIONS.length} ข้อ — ได้ {result.points} แต้ม
          </p>
          {result.perfect && (
            <p style={{ fontSize: '0.8rem', marginTop: 'var(--space-sm)' }}>
              🎮 กำลังเข้าสู่ Mini Farm...
            </p>
          )}
        </div>
      )}
    </div>
  );
}
