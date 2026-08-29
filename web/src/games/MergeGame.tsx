// web/src/games/MergeGame.tsx
// เกมรวมเมล็ดแบบ Suika — ผู้เล่นบังคับตำแหน่งตก + performance ดี
import { useState, useCallback, useEffect, useRef } from 'react';

type Item = {
  id: number;
  type: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  scale: number;
  merging: boolean;
};

// 7 ชนิด — ใช้รูปจาก ComfyUI
const TYPES = [
  { name: 'เมล็ด', img: '/assets/corn/v2_seed_00001__transparent.png', radius: 18 },
  { name: 'ต้นกล้า', img: '/assets/corn/v2_sprout_00001__transparent.png', radius: 24 },
  { name: 'ต้นอ่อน', img: '/assets/corn/v2_young_corn_00001__transparent.png', radius: 30 },
  { name: 'ข้าวโพด', img: '/assets/corn/v2_ripe_corn_00001__transparent.png', radius: 36 },
  { name: 'ข้าวสีทอง', img: '/assets/corn/v2_golden_rice_00001__transparent.png', radius: 30 },
  { name: 'ข้าวกล้อง', img: '/assets/corn/v2_brown_rice_00001__transparent.png', radius: 36 },
  { name: 'ไอศครีม', img: '/assets/corn/v2_ice_cream_00001__transparent.png', radius: 42 },
];

const W = 300;
const H = 420;
const GRAVITY = 0.3;
const BOUNCE = 0.4;
const PAD = 6;
const MAX_ITEMS = 15;
const TIME_LIMIT = 60;

let nextId = 0;

function makeItem(type: number, x: number): Item {
  return { id: nextId++, type, x, y: 20, vx: 0, vy: 0, radius: TYPES[type].radius, scale: 0, merging: false };
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
  const [items, setItems] = useState<Item[]>([]);
  const [score, setScore] = useState(0);
  const [nextType] = useState(randType());
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [gameOver, setGameOver] = useState(false);
  const [combo, setCombo] = useState(0);
  const [dropX, setDropX] = useState(W / 2); // ตำแหน่งที่ผู้เล่นเลือก
  const [canDrop, setCanDrop] = useState(true); // พร้อมปล่อย
  const animRef = useRef<number>();
  const lastTimeRef = useRef(0);
  const itemsRef = useRef(items);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { itemsRef.current = items; }, [items]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { comboRef.current = combo; }, [combo]);

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

  // Physics — optimized, no freeze
  useEffect(() => {
    if (gameOver) return;

    const loop = (time: number) => {
      const dt = lastTimeRef.current ? Math.min((time - lastTimeRef.current) / 16, 2.5) : 1;
      lastTimeRef.current = time;

      const cur = itemsRef.current.map(i => ({ ...i }));
      let changed = false;

      for (let i = 0; i < cur.length; i++) {
        const a = cur[i];
        if (a.scale < 1) { a.scale = Math.min(1, a.scale + 0.15 * dt); changed = true; }
        if (a.merging) continue;

        a.vy += GRAVITY * dt;
        a.vx *= 0.998;
        a.vy *= 0.998;
        a.x += a.vx * dt;
        a.y += a.vy * dt;

        const l = PAD + a.radius, r = W - PAD - a.radius, f = H - PAD - a.radius;
        if (a.x < l) { a.x = l; a.vx = Math.abs(a.vx) * BOUNCE; }
        if (a.x > r) { a.x = r; a.vx = -Math.abs(a.vx) * BOUNCE; }
        if (a.y > f) {
          a.y = f;
          a.vy = -Math.abs(a.vy) * BOUNCE * 0.5;
          a.vx *= 0.85;
          if (Math.abs(a.vy) < 0.3) a.vy = 0;
        }

        for (let j = i + 1; j < cur.length; j++) {
          const b = cur[j];
          if (b.merging) continue;

          const dx = b.x - a.x, dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minD = a.radius + b.radius;

          if (dist < minD && dist > 0.1) {
            if (a.type === b.type && a.type < TYPES.length - 1) {
              const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
              a.merging = true; b.merging = true;
              cur.splice(j, 1); cur.splice(i, 1);
              const ni = makeItem(a.type + 1, mx);
              ni.y = my - 8; ni.vy = -1.5; ni.scale = 1.1;
              cur.push(ni);
              const pts = (a.type + 2) * 10 * (comboRef.current + 1);
              setScore(p => p + pts);
              setCombo(p => p + 1);
              setTimeout(() => setCombo(0), 500);
              changed = true;
              break;
            } else {
              const angle = Math.atan2(dy, dx);
              const overlap = minD - dist;
              const nx = Math.cos(angle), ny = Math.sin(angle);
              a.x -= nx * overlap * 0.5; a.y -= ny * overlap * 0.5;
              b.x += nx * overlap * 0.5; b.y += ny * overlap * 0.5;
              const rvn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
              if (rvn < 0) {
                a.vx += rvn * nx * BOUNCE * 0.6;
                a.vy += rvn * ny * BOUNCE * 0.6;
                b.vx -= rvn * nx * BOUNCE * 0.6;
                b.vy -= rvn * ny * BOUNCE * 0.6;
              }
            }
          }
        }
      }

      const filtered = cur.filter(i => !i.merging);
      if (filtered.length !== cur.length) changed = true;
      if (changed) setItems(filtered);

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [gameOver]);

  // บังคับตำแหน่งตก — ใช้ mouse/touch
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (gameOver || !canDrop) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(PAD + 20, Math.min(W - PAD - 20, e.clientX - rect.left));
    setDropX(x);
  }, [gameOver, canDrop]);

  // ปล่อย item
  const handlePointerUp = useCallback(() => {
    if (gameOver || !canDrop) return;
    if (itemsRef.current.length >= MAX_ITEMS) return;
    
    const ni = makeItem(nextType, dropX);
    setItems(prev => [...prev, ni]);
    setCanDrop(false);
    
    // หน่วงเล็กน้อยก่อนปล่อยตัวถัดไป
    setTimeout(() => setCanDrop(true), 300);
  }, [gameOver, canDrop, nextType, dropX]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
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

      {/* Next + hint */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, padding: '3px 8px', background: '#F3F4F6', borderRadius: 8 }}>
        <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>ถัดไป:</span>
        <img src={TYPES[nextType].img} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />
        <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>{TYPES[nextType].name}</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.6rem', color: '#9CA3AF' }}>← ลากแล้วปล่อย →</span>
      </div>

      {/* Danger */}
      {danger && (
        <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 8, padding: '3px 8px', marginBottom: 6, textAlign: 'center' }}>
          <p style={{ color: '#DC2626', fontSize: '0.7rem', fontWeight: 700 }}>⚠️ ระวัง! ของจะล้นกล่อง</p>
        </div>
      )}

      {/* Container — แตะ/ลากเพื่อบังคับตำแหน่งตก */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          width: '100%', height: H,
          background: 'linear-gradient(180deg, #FEF9C3 0%, #FDE68A 40%, #FCD34D 100%)',
          borderRadius: 12, border: '3px solid #D97706',
          position: 'relative', overflow: 'hidden', cursor: 'crosshair',
          boxShadow: 'inset 0 3px 12px rgba(0,0,0,0.08), 0 3px 10px rgba(0,0,0,0.1)',
        }}
      >
        {/* Glass */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 20%)', pointerEvents: 'none', borderRadius: 12 }} />

        {/* ตัวที่กำลังจะตก — แสดงที่ตำแหน่ง dropX */}
        {canDrop && !gameOver && (
          <img src={TYPES[nextType].img} alt="" style={{
            position: 'absolute', left: dropX - TYPES[nextType].radius, top: 2,
            width: TYPES[nextType].radius * 2, height: TYPES[nextType].radius * 2,
            objectFit: 'contain', pointerEvents: 'none', opacity: 0.7,
            transform: 'scale(0.9)',
          }} />
        )}

        {/* Items */}
        {items.map(item => (
          <img key={item.id} src={TYPES[item.type].img} alt="" style={{
            position: 'absolute',
            left: item.x - item.radius, top: item.y - item.radius,
            width: item.radius * 2, height: item.radius * 2,
            objectFit: 'contain', pointerEvents: 'none',
            transform: `scale(${item.scale})`,
            filter: item.merging ? 'brightness(1.3)' : 'none',
          }} />
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
          • ลากนิ้ว/เมาส์ซ้าย-ขวาเพื่อเลื่อนตำแหน่ง<br/>
          • ปล่อยเพื่อให้เมล็ดตกลงมา<br/>
          • ตัวเดียวกันชนกัน = รวมร่าง!<br/>
          • สะสมแต้มใน 60 วินาที
        </p>
      </div>
    </div>
  );
}
