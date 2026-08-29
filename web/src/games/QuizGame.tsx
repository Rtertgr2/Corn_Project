// web/src/games/QuizGame.tsx
// เกมตอบคำถามชุมชนสั้นๆ — 3 ข้อปรนัย
import { useState, useEffect } from 'react';
import { api } from '../api';

type Question = { q: string; options: string[] };

export default function QuizGame({ onComplete }: { onComplete: (correct: boolean) => void }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<(number | null)[]>([null, null, null]);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<{
    correctCount: number;
    total: number;
    points: number;
    message: string;
    nextAction: 'home' | 'mini-farm';
    perfect: boolean;
  } | null>(null);

  useEffect(() => {
    api.quizQuestions().then((data) => {
      setQuestions(data.questions);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const selectAnswer = (questionIdx: number, optionIdx: number) => {
    if (result) return;
    const newAnswers = [...answers];
    newAnswers[questionIdx] = optionIdx;
    setAnswers(newAnswers);
  };

  const submit = async () => {
    if (result) return;
    try {
      // ใส่ dummy phone สำหรับ local test — ตอน deploy จะใช้ phone จริง
      const phone = localStorage.getItem('phone') || 'test';
      const res = await api.quizSubmit(phone, answers.map(a => a ?? -1));
      setResult(res);
      // ถูกหมด → เด้งเข้า mini-farm, ผิด → กลับหน้าหลัก
      setTimeout(() => {
        if (res.nextAction === 'mini-farm') {
          onComplete(true);
        } else {
          onComplete(res.points > 0);
        }
      }, 2000);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const allAnswered = answers.every(a => a !== null);

  if (loading) return <p>กำลังโหลด...</p>;

  return (
    <div>
      {questions.map((q, qi) => (
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
            ตอบถูก {result.correctCount} จาก {result.total} ข้อ — ได้ {result.points} แต้ม
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
