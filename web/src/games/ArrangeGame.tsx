// web/src/games/ArrangeGame.tsx
// เกมเรียงลำดับขั้นตอนการปลูกข้าวโพด (คลิกเรียงตามลำดับที่ถูกต้อง)
import { useState } from 'react';

const STEPS = ['🌱 ปลูกเมล็ด', '💧 รดน้ำดูแล', '🌾 เก็บเกี่ยว', '🛒 ขายในตลาด'];
const SOLUTION = [...STEPS]; // ลำดับถูกต้องคือตามนี้

export default function ArrangeGame({ onComplete }: { onComplete: (correct: boolean) => void }) {
  const [order] = useState<number[]>(() => [...STEPS.keys()].sort(() => Math.random() - 0.5));
  const [picked, setPicked] = useState<number[]>([]);

  const click = (i: number) => {
    if (picked.includes(i)) return;
    const next = [...picked, i];
    setPicked(next);
    if (next.length === STEPS.length) {
      const correct = next.every((v, idx) => STEPS[v] === SOLUTION[idx]);
      onComplete(correct);
    }
  };

  return (
    <div>
      <p style={{ fontSize: 16, marginBottom: 12 }}>คลิกเรียงลำดับขั้นตอนให้ถูกต้อง:</p>
      {order.map((i) => (
        <button
          key={i}
          disabled={picked.includes(i)}
          onClick={() => click(i)}
          style={{
            display: 'block',
            width: '100%',
            margin: '8px 0',
            padding: 14,
            fontSize: 16,
            borderRadius: 8,
            border: '1px solid #ccc',
            background: picked.includes(i) ? '#e0e0e0' : '#fff',
            cursor: picked.includes(i) ? 'default' : 'pointer',
            opacity: picked.includes(i) ? 0.6 : 1,
          }}
        >
          {STEPS[i]} {picked.includes(i) ? `(${picked.indexOf(i) + 1})` : ''}
        </button>
      ))}
    </div>
  );
}
