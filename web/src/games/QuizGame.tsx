// web/src/games/QuizGame.tsx
// เกมตอบคำถามชุมชนสั้นๆ (v1: คำถามตัวอย่าง)

const QUESTION = 'ตลาดยิ่งเจริญตั้งอยู่ที่เขตใด?';
const OPTIONS = ['จตุจักร', 'บางเขน', 'บึงกุ่ม', 'ห้วยขวาง'];
const ANSWER_INDEX = 1; // บางเขน

export default function QuizGame({ onComplete }: { onComplete: (correct: boolean) => void }) {
  return (
    <div>
      <h3 style={{ fontSize: 18 }}>{QUESTION}</h3>
      {OPTIONS.map((opt, i) => (
        <button
          key={i}
          onClick={() => onComplete(i === ANSWER_INDEX)}
          style={{
            display: 'block',
            width: '100%',
            margin: '8px 0',
            padding: 14,
            fontSize: 16,
            borderRadius: 8,
            border: '1px solid #ccc',
            background: '#fff',
            cursor: 'pointer',
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
