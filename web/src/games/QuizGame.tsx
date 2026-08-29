// web/src/games/QuizGame.tsx
// เกมตอบคำถามชุมชนสั้นๆ (v1: คำถามตัวอย่าง)

const QUESTION = 'ตลาดยิ่งเจริญตั้งอยู่ที่เขตใด?';
const OPTIONS = ['จตุจักร', 'บางเขน', 'บึงกุ่ม', 'ห้วยขวาง'];
const ANSWER_INDEX = 1; // บางเขน

export default function QuizGame({ onComplete }: { onComplete: (correct: boolean) => void }) {
  return (
    <div>
      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 600, marginBottom: 'var(--space-md)', color: 'var(--color-text)' }}>
        {QUESTION}
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: var(--space-sm) }}>
        {OPTIONS.map((opt, i) => (
          <button
            key={i}
            className="game-option"
            onClick={() => onComplete(i === ANSWER_INDEX)}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 14px',
              border: '2px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-muted)',
              color: 'var(--color-primary)',
              fontWeight: 700,
              fontSize: '0.85rem',
              marginRight: 10,
              flexShrink: 0,
            }}>
              {String.fromCharCode(65 + i)}
            </span>
            <span style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '0.9rem' }}>{opt}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
