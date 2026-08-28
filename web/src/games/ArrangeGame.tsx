// web/src/games/ArrangeGame.tsx
// เกมเรียงลำดับขั้นตอนการปลูกข้าวโพด (คลิกเรียงตามลำดับที่ถูกต้อง)
import { useState } from 'react';

const STEPS = [
  { icon: '🌱', label: 'ปลูกเมล็ด' },
  { icon: '💧', label: 'รดน้ำดูแล' },
  { icon: '🌾', label: 'เก็บเกี่ยว' },
  { icon: '🛒', label: 'ขายในตลาด' },
];
const SOLUTION = STEPS.map((s) => s.label);

export default function ArrangeGame({ onComplete }: { onComplete: (correct: boolean) => void }) {
  const [order] = useState<number[]>(() => [...STEPS.keys()].sort(() => Math.random() - 0.5));
  const [picked, setPicked] = useState<number[]>([]);

  const click = (i: number) => {
    if (picked.includes(i)) return;
    const next = [...picked, i];
    setPicked(next);
    if (next.length === STEPS.length) {
      const correct = next.every((v, idx) => STEPS[v].label === SOLUTION[idx]);
      onComplete(correct);
    }
  };

  return (
    <div>
      <p style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 600, marginBottom: 'var(--space-md)', color: 'var(--color-foreground)' }}>
        คลิกเรียงลำดับขั้นตอนให้ถูกต้อง
      </p>
      <p style={{ fontSize: '0.85rem', color: 'var(--color-muted-foreground)', marginBottom: 'var(--space-md)' }}>
        ขั้นตอนการปลูกข้าวโพด: เรียงจากต้นจนจบ
      </p>
      {order.map((i) => {
        const isPicked = picked.includes(i);
        const pickOrder = picked.indexOf(i) + 1;
        return (
          <button
            key={i}
            className={`game-option ${isPicked ? 'selected' : ''}`}
            disabled={isPicked}
            onClick={() => click(i)}
          >
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-full)',
              background: isPicked ? 'var(--color-primary)' : 'var(--color-muted)',
              color: isPicked ? 'var(--color-on-primary)' : 'var(--color-primary)',
              fontWeight: 700,
              fontSize: '0.9rem',
              marginRight: 12,
              flexShrink: 0,
            }}>
              {isPicked ? pickOrder : STEPS[i].icon}
            </span>
            <span style={{ flex: 1, textAlign: 'left' }}>{STEPS[i].label}</span>
            {isPicked && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}
