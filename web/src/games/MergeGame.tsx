// web/src/games/MergeGame.tsx
// เกมรวมเมล็ดแบบ Suika — user-controlled drop, no freeze, optimized physics
import { useState, useEffect, useRef, useCallback } from 'react';

type Item = {
  id: number;
  type: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  merging: boolean;
};

const TYPES = [
  { name: 'เมล็ด', img: '/assets/corn/seed.png', radius: 18 },
  { name: 'ต้นกล้า', img: '/assets/corn/sprout.png', radius: 24 },
  { name: 'ต้นอ่อน', img: '/assets/corn/young_corn.png', radius: 30 },
  { name: 'ข้าวโพด', img: '/assets/corn/ripe_corn.png', radius: 36 },
  { name: 'ข้าวสีทอง', img: '/assets/corn/golden_rice.png', radius: 30 },
  { name: 'ข้าวกล้อง', img: '/assets/corn/brown_rice.png', radius: 36 },
  { name: 'ไอศครีม', img: '/assets/corn/ice_cream.png', radius: 42 },
];

const W = 300;
const H = 420;
const GRAVITY = 0.4;
const BOUNCE = 0.3;
const PAD = 6;
const MAX_ITEMS = 8;
const TIME_LIMIT = 60;
const DROP_COOLDOWN = 250; // ms ระหว่างคลิก

let nextId = 0;

function makeItem(type: number, x: number): Item {
  return { id: nextId++, type, x, y: 20, vx: 0, vy: 0, radius: TYPES[type].radius, merging: false };
}

function randType(): number {
  const r = Math.random();
  if (r < 0.4) return 0;
  if (r < 0.7) return 1;
  if (r < 0.85) return 2;
  if (r < 0.95) return 3;
  return 4;
}

export default function MergeGame({ onComplete }: { onComplete: (correct: boolean) => void }) {
  const [renderTick, setRenderTick] = useState(0); // force re-render
  const [score, setScore] = useState(0);
  const [nextType, setNextType] = useState(randType());
  const nextTypeRef = useRef(nextType);
  useEffect(() => { nextTypeRef.current = nextType; }, [nextType]);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [gameOver, setGameOver] = useState(false);
  const [dropX, setDropX] = useState(W / 2);
  const [canDrop, setCanDrop] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>();
  const itemsRef = useRef<Item[]>([]);
  const scoreRef = useRef(0);
  const gameOverRef = useRef(false);
  const renderTickRef = useRef(0);

  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);

  // Timer
  useEffect(() => {
    if (gameOver) return;
    const t = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) {
          clearInterval(t);
          setGameOver(true);
          setTimeout(() => onComplete(scoreRef.current >= 100), 1500);
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [gameOver, onComplete]);

  // Physics loop — mutable items, minimal re-renders
  useEffect(() => {
    let lastTime = 0;
    let frameCount = 0;

    const loop = (time: number) => {
      animRef.current = requestAnimationFrame(loop);

      if (gameOverRef.current) return;

      const dt = lastTime ? Math.min((time - lastTime) / 16, 2) : 1;
      lastTime = time;

      const items = itemsRef.current;
      if (items.length === 0) return;

      let changed = false;

      // Update physics
      for (let i = 0; i < items.length; i++) {
        const a = items[i];
        if (a.merging) continue;

        a.vy += GRAVITY * dt;
        a.y += a.vy * dt;
        a.x += a.vx * dt;
        a.vx *= 0.99;

        // Wall collision
        const left = PAD + a.radius;
        const right = W - PAD - a.radius;
        const floor = H - PAD - a.radius;

        if (a.x < left) { a.x = left; a.vx = Math.abs(a.vx) * BOUNCE; changed = true; }
        if (a.x > right) { a.x = right; a.vx = -Math.abs(a.vx) * BOUNCE; changed = true; }
        if (a.y > floor) {
          a.y = floor;
          a.vy = -Math.abs(a.vy) * BOUNCE * 0.5;
          a.vx *= 0.9;
          if (Math.abs(a.vy) < 0.5) a.vy = 0;
          changed = true;
        }

        // Item collision
        for (let j = i + 1; j < items.length; j++) {
          const b = items[j];
          if (b.merging) continue;

          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = a.radius + b.radius;

          if (dist < minDist && dist > 0.1) {
            if (a.type === b.type && a.type < TYPES.length - 1) {
              // Merge
              const mx = (a.x + b.x) / 2;
              const my = (a.y + b.y) / 2;
              a.merging = true;
              b.merging = true;

              const newItem = makeItem(a.type + 1, mx);
              newItem.y = my - 10;
              newItem.vy = -2;
              items.push(newItem);

              const pts = (a.type + 2) * 10;
              scoreRef.current += pts;
              setScore(scoreRef.current);
              changed = true;
              break;
            } else {
              // Bounce
              const angle = Math.atan2(dy, dx);
              const overlap = minDist - dist;
              const nx = Math.cos(angle);
              const ny = Math.sin(angle);

              a.x -= nx * overlap * 0.5;
              a.y -= ny * overlap * 0.5;
              b.x += nx * overlap * 0.5;
              b.y += ny * overlap * 0.5;

              const relVn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
              if (relVn < 0) {
                a.vx += relVn * nx * BOUNCE * 0.7;
                a.vy += relVn * ny * BOUNCE * 0.7;
                b.vx -= relVn * nx * BOUNCE * 0.7;
                b.vy -= relVn * ny * BOUNCE * 0.7;
              }
              changed = true;
            }
          }
        }
      }

      // Remove merging items
      for (let i = items.length - 1; i >= 0; i--) {
        if (items[i].merging) {
          items.splice(i, 1);
          changed = true;
        }
      }

      // Re-render every 3 frames to reduce DOM updates
      frameCount++;
      if (changed && frameCount % 3 === 0) {
        renderTickRef.current++;
        setRenderTick(renderTickRef.current);
      }
    };

    animRef.current = requestAnimationFrame(loop);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  // Player-controlled drop
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (gameOver || !canDrop) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(PAD + 20, Math.min(W - PAD - 20, e.clientX - rect.left));
    setDropX(x);
  }, [gameOver, canDrop]);

  const handlePointerDown = useCallback(() => {
    if (gameOver || !canDrop) return;
    if (itemsRef.current.length >= MAX_ITEMS) return;

    const newItem = makeItem(nextTypeRef.current, dropX);
    itemsRef.current.push(newItem);
    setCanDrop(false);
    setNextType(randType());
    setTimeout(() => setCanDrop(true), DROP_COOLDOWN);
  }, [gameOver, canDrop, dropX]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const items = itemsRef.current;
  const danger = items.some(i => i.y < 30 && !i.merging);

  return (
    <div style={{ maxWidth: 340, margin: '0 auto', userSelect: 'none', touchAction: 'none' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <p style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text)' }}>🌽 รวมเมล็ด</p>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--color-primary)', lineHeight: 1 }}>{score}</p>
          <p style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)' }}>แต้ม</p>
        </div>
      </div>

      {/* Timer */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
        <div style={{ background: timeLeft <= 10 ? '#EF4444' : 'var(--color-primary)', color: '#fff', borderRadius: 20, padding: '3px 10px', fontWeight: 700, fontSize: '0.8rem', minWidth: 48, textAlign: 'center' }}>
          ⏱ {fmt(timeLeft)}
        </div>
        <div style={{ flex: 1, height: 5, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(100, (score / 400) * 100)}%`, background: 'var(--color-primary)', borderRadius: 3, transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* Next */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, padding: '3px 8px', background: '#F3F4F6', borderRadius: 8 }}>
        <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>ถัดไป:</span>
        <img src={TYPES[nextType].img} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />
        <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>{TYPES[nextType].name}</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.6rem', color: '#9CA3AF' }}>คลิกเพื่อปล่อย</span>
      </div>

      {/* Danger */}
      {danger && (
        <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 8, padding: '3px 8px', marginBottom: 6, textAlign: 'center' }}>
          <p style={{ color: '#DC2626', fontSize: '0.7rem', fontWeight: 700 }}>⚠️ ระวัง! ของจะล้นกล่อง</p>
        </div>
      )}

      {/* Container */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        style={{
          width: '100%',
          height: H,
          background: 'linear-gradient(180deg, #FEF9C3 0%, #FDE68A 40%, #FCD34D 100%)',
          borderRadius: 12,
          border: '3px solid #D97706',
          position: 'relative',
          overflow: 'hidden',
          cursor: 'crosshair',
          boxShadow: 'inset 0 3px 12px rgba(0,0,0,0.08), 0 3px 10px rgba(0,0,0,0.1)',
        }}
      >
        {/* Glass effect */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 20%)', pointerEvents: 'none', borderRadius: 12 }} />

        {/* Preview item at drop position */}
        {canDrop && !gameOver && (
          <img
            src={TYPES[nextType].img}
            alt=""
            style={{
              position: 'absolute',
              left: dropX - TYPES[nextType].radius,
              top: 2,
              width: TYPES[nextType].radius * 2,
              height: TYPES[nextType].radius * 2,
              objectFit: 'contain',
              pointerEvents: 'none',
              opacity: 0.6,
            }}
          />
        )}

        {/* Items */}
        {items.map(item => (
          <img
            key={item.id}
            src={TYPES[item.type].img}
            alt=""
            style={{
              position: 'absolute',
              left: item.x - item.radius,
              top: item.y - item.radius,
              width: item.radius * 2,
              height: item.radius * 2,
              objectFit: 'contain',
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* Game over */}
        {gameOver && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6, borderRadius: 12 }}>
            <p style={{ color: '#fff', fontSize: '1.3rem', fontWeight: 800 }}>หมดเวลา! ได้ {score} แต้ม</p>
            <p style={{ color: '#FCD34D', fontSize: '0.8rem' }}>🌽 ขอบคุณที่เล่น!</p>
          </div>
        )}
      </div>

      {/* Chain */}
      <div style={{ display: 'flex', gap: 2, marginTop: 6, padding: 5, background: '#F9FAFB', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
        {TYPES.map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <img src={t.img} alt={t.name} style={{ width: 16, height: 16, objectFit: 'contain' }} />
            {i < TYPES.length - 1 && <span style={{ color: '#9CA3AF', fontSize: '0.5rem' }}>→</span>}
          </div>
        ))}
      </div>

      {/* How to play */}
      <div style={{ marginTop: 6, padding: 6, background: '#EFF6FF', borderRadius: 8, border: '1px solid #BFDBFE' }}>
        <p style={{ fontSize: '0.65rem', color: '#1E40AF', fontWeight: 600, marginBottom: 2 }}>💡 วิธีเล่น</p>
        <p style={{ fontSize: '0.6rem', color: '#3B82F6', lineHeight: 1.4 }}>
          • ลากนิ้ว/เมาส์ซ้าย-ขวาเพื่อเลื่อนตำแหน่ง<br />
          • คลิก/แตะเพื่อให้เมล็ดตกลงมา<br />
          • ตัวเดียวกันชนกัน = รวมร่าง!<br />
          • สะสมแต้มใน 60 วินาที
        </p>
      </div>
    </div>
  );
}
