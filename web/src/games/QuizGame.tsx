// web/src/games/QuizGame.tsx
// เกมตอบคำถามชุมชนสั้นๆ (v1: คำถามตัวอย่าง)

const QUESTION = 'ตลาดยิ่งเจริญตั้งอยู่ที่เขตใด?';
const OPTIONS = ['จตุจักร', 'บางเขน', 'บึงกุ่ม', 'ห้วยขวาง'];
const ANSWER_INDEX = 1; // บางเขน

export default function QuizGame({ onComplete }: { onComplete: (correct: boolean) => void }) {
  return (
    <div>
      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 600, marginBottom: 'var(--space-md)', color: 'var(--color-foreground)' }}>
        {QUESTION}
      </h3>
      {OPTIONS.map((opt, i) => (
        <button
          key={i}
          className="game-option"
          onClick={() => onComplete(i === ANSWER_INDEX)}
        >
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-muted)',
            color: 'var(--color-primary)',
            fontWeight: 700,
            fontSize: '0.85rem',
            marginRight: 12,
            flexShrink: 0,
          }}>
            {String.fromCharCode(65 + i)}
          </span>
          {opt}
        </button>
      ))}
    </div>
  );
}
