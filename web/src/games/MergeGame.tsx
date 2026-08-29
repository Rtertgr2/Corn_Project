// web/src/games/MergeGame.tsx
// เกมรวมเมล็ดแบบ Suika — ปล่อยเมล็ดลง container เมื่อเมล็ดเดียวกันชนกันจะรวมเป็นต้นที่ใหญ่กว่า
import { useState, useCallback, useEffect, useRef } from 'react';

type Item = {
  id: number;
  type: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  settled: boolean;
};

// 7 ชนิด: seed, sprout, young_corn, ripe_corn, golden_rice, brown_rice, ice_cream
const TYPES = [
  { name: 'เมล็ด', img: '/assets/corn/seed.png', radius: 15, color: '#FBBF24' },
  { name: 'ต้นกล้า', img: '/assets/corn/sprout.png', radius: 20, color: '#34D399' },
  { name: 'ต้นข้าวโพด', img: '/assets/corn/young_corn.png', radius: 25, color: '#81C784' },
  { name: 'ข้าวโพด', img: '/assets/corn/ripe_corn.png', radius: 30, color: '#F59E0B' },
  { name: 'ต้นข้าวสีทอง', img: '/assets/corn/golden_rice.png', radius: 25, color: '#F4D03F' },
  { name: 'ข้าวกล้อง', img: '/assets/corn/brown_rice.png', radius: 30, color: '#A0522D' },
  { name: 'ไอศครีม', img: '/assets/corn/ice_cream.png', radius: 35, color: '#FFB6C1' },
];

// merge rules: type + type → result
const MERGE_RESULT: Record<number, number> = {
  0: 1,   // seed → sprout
  1: 2,   // sprout → young_corn
  2: 3,   // young_corn → ripe_corn
  3: 5,   // ripe_corn → brown_rice
  4: 5,   // golden_rice → brown_rice
  5: 6,   // brown_rice → ice_cream
};

const CONTAINER_WIDTH = 300;
const CONTAINER_HEIGHT = 400;
const GRAVITY = 0.5;
const FRICTION = 0.8;
const BOUNCE = 0.3;

let nextId = 0;

function createItem(type: number, x: number): Item {
  return {
    id: nextId++,
    type,
    x,
    y: 30,
    vx: (Math.random() - 0.5) * 2,
    vy: 0,
    radius: TYPES[type].radius,
    settled: false,
  };
}

function randomType(): number {
  const rand = Math.random();
  if (rand < 0.6) return 0; // 60% seed
  if (rand < 0.9) return 1; // 30% sprout
  return 2; // 10% young_corn
}

export default function MergeGame({ onComplete }: { onComplete: (correct: boolean) => void }) {
  const [items, setItems] = useState<Item[]>([]);
  const [score, setScore] = useState(0);
  const [nextType, setNextType] = useState(randomType());
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState('');
  const animFrameRef = useRef<number>();
  const itemsRef = useRef(items);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Physics simulation
  useEffect(() => {
    if (gameOver) return;

    const simulate = () => {
      const currentItems = [...itemsRef.current];
      let changed = false;

      for (let i = 0; i < currentItems.length; i++) {
        const item = currentItems[i];
        if (item.settled) continue;

        // Apply gravity
        item.vy += GRAVITY;
        item.x += item.vx;
        item.y += item.vy;

        // Wall collisions
        if (item.x - item.radius < 0) {
          item.x = item.radius;
          item.vx *= -BOUNCE;
        }
        if (item.x + item.radius > CONTAINER_WIDTH) {
          item.x = CONTAINER_WIDTH - item.radius;
          item.vx *= -BOUNCE;
        }
        if (item.y + item.radius > CONTAINER_HEIGHT) {
          item.y = CONTAINER_HEIGHT - item.radius;
          item.vy *= -BOUNCE;
          item.vx *= FRICTION;
          if (Math.abs(item.vy) < 1 && Math.abs(item.vx) < 0.5) {
            item.settled = true;
          }
        }

        // Item-item collisions
        for (let j = i + 1; j < currentItems.length; j++) {
          const other = currentItems[j];
          const dx = other.x - item.x;
          const dy = other.y - item.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = item.radius + other.radius;

          if (dist < minDist && dist > 0) {
            // Merge if same type
            if (item.type === other.type && MERGE_RESULT[item.type] !== undefined) {
              const newType = MERGE_RESULT[item.type];
              const newItem = createItem(newType, (item.x + other.x) / 2);
              newItem.y = (item.y + other.y) / 2;
              newItem.vy = -2;
              currentItems.splice(j, 1);
              currentItems.splice(i, 1);
              currentItems.push(newItem);
              setScore(prev => prev + (newType + 1) * 10);
              changed = true;
              break;
            } else {
              // Bounce
              const angle = Math.atan2(dy, dx);
              const overlap = minDist - dist;
              const nx = Math.cos(angle);
              const ny = Math.sin(angle);
              item.x -= nx * overlap * 0.5;
              item.y -= ny * overlap * 0.5;
              other.x += nx * overlap * 0.5;
              other.y += ny * overlap * 0.5;
              const relV = (other.vx - item.vx) * nx + (other.vy - item.vy) * ny;
              item.vx += relV * nx * BOUNCE;
              item.vy += relV * ny * BOUNCE;
              other.vx -= relV * nx * BOUNCE;
              other.vy -= relV * ny * BOUNCE;
            }
          }
        }
      }

      if (changed) {
        setItems(currentItems);
      }

      animFrameRef.current = requestAnimationFrame(simulate);
    };

    animFrameRef.current = requestAnimationFrame(simulate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameOver]);

  // Check game over
  useEffect(() => {
    if (gameOver) return;
    const topY = 50;
    const settledAtTop = items.some(item => item.settled && item.y - item.radius < topY);
    if (settledAtTop && items.length > 5) {
      setGameOver(true);
      setMessage(`เกมจบ! ได้ ${score} แต้ม`);
      setTimeout(() => onComplete(score >= 200), 2000);
    }
  }, [items, gameOver, score, onComplete]);

  const handleDrop = useCallback(() => {
    if (gameOver) return;
    const x = CONTAINER_WIDTH / 2 + (Math.random() - 0.5) * 50;
    const newItem = createItem(nextType, x);
    setItems(prev => [...prev, newItem]);
    setNextType(randomType());
  }, [nextType, gameOver]);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)' }}>
            รวมเมล็ด
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            คลิกเพื่อปล่อยเมล็ด
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.3rem', color: 'var(--color-primary)' }}>
            {score}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            แต้ม
          </p>
        </div>
      </div>

      {/* Next item preview */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>ถัดไป:</span>
        <img
          src={TYPES[nextType].img}
          alt={TYPES[nextType].name}
          style={{ width: 32, height: 32, objectFit: 'contain' }}
        />
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)' }}>
          {TYPES[nextType].name}
        </span>
      </div>

      {/* Container */}
      <div
        onClick={handleDrop}
        style={{
          width: '100%',
          height: CONTAINER_HEIGHT,
          background: 'linear-gradient(180deg, #FEF3C7 0%, #FDE68A 100%)',
          borderRadius: 'var(--radius-lg)',
          border: '3px solid var(--color-border-strong)',
          position: 'relative',
          overflow: 'hidden',
          cursor: gameOver ? 'default' : 'pointer',
          boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        {/* Items */}
        {items.map(item => (
          <img
            key={item.id}
            src={TYPES[item.type].img}
            alt={TYPES[item.type].name}
            style={{
              position: 'absolute',
              left: item.x - item.radius,
              top: item.y - item.radius,
              width: item.radius * 2,
              height: item.radius * 2,
              objectFit: 'contain',
              pointerEvents: 'none',
              transition: 'none',
            }}
          />
        ))}

        {/* Drop indicator */}
        {!gameOver && (
          <div style={{
            position: 'absolute',
            top: 10,
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'var(--color-text-muted)',
            fontSize: '0.75rem',
            textAlign: 'center',
          }}>
            คลิกเพื่อปล่อย
          </div>
        )}

        {/* Game Over overlay */}
        {gameOver && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 8,
          }}>
            <p style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 800 }}>{message}</p>
          </div>
        )}
      </div>

      {/* Progression bar */}
      <div style={{
        display: 'flex',
        gap: 4,
        marginTop: 12,
        padding: 8,
        background: 'var(--color-muted)',
        borderRadius: 'var(--radius-md)',
        justifyContent: 'center',
        flexWrap: 'wrap',
      }}>
        {TYPES.map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <img src={t.img} alt={t.name} style={{ width: 20, height: 20, objectFit: 'contain' }} />
            {i < TYPES.length - 1 && <span style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>→</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
