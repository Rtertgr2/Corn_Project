// web/src/games/MergeGame.tsx
// เกมรวมเมล็ดแบบ Suika — physics-based, no delay, uses real images
import { useState, useCallback, useEffect, useRef } from 'react';

type Item = {
  id: number;
  type: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  vRotation: number;
  scale: number;
  merging: boolean;
};

type Particle = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
};

// 7 ชนิด — ใช้รูปจาก ComfyUi/output_transparent เท่านั้น
const TYPES = [
  { name: 'เมล็ด', img: '/assets/corn/v2_seed_00001__transparent.png', radius: 20, color: '#FBBF24' },
  { name: 'ต้นกล้า', img: '/assets/corn/v2_sprout_00001__transparent.png', radius: 26, color: '#34D399' },
  { name: 'ต้นอ่อน', img: '/assets/corn/v2_young_corn_00001__transparent.png', radius: 32, color: '#6EE7B7' },
  { name: 'ข้าวโพด', img: '/assets/corn/v2_ripe_corn_00001__transparent.png', radius: 38, color: '#EAB308' },
  { name: 'ข้าวสีทอง', img: '/assets/corn/v2_golden_rice_00001__transparent.png', radius: 32, color: '#F4D03F' },
  { name: 'ข้าวกล้อง', img: '/assets/corn/v2_brown_rice_00001__transparent.png', radius: 38, color: '#92400E' },
  { name: 'ไอศครีม', img: '/assets/corn/v2_ice_cream_00001__transparent.png', radius: 44, color: '#FFB6C1' },
];

const COLORS = ['#FBBF24', '#34D399', '#6EE7B7', '#EAB308', '#F4D03F', '#92400E', '#FFB6C1'];

const CONTAINER_WIDTH = 320;
const CONTAINER_HEIGHT = 420;
const GRAVITY = 0.25;
const FRICTION = 0.995;
const BOUNCE = 0.45;
const WALL_PADDING = 6;
const TIME_LIMIT = 60;
const DROP_INTERVAL = 600; // ตกทุก0.6วินาที — ไม่มี delay

let nextId = 0;

function createItem(type: number, x: number): Item {
  return {
    id: nextId++,
    type,
    x,
    y: 25,
    vx: (Math.random() - 0.5) * 1.5,
    vy: 0,
    radius: TYPES[type].radius,
    rotation: (Math.random() - 0.5) * 0.15,
    vRotation: (Math.random() - 0.5) * 0.03,
    scale: 0,
    merging: false,
  };
}

function randomType(): number {
  const rand = Math.random();
  if (rand < 0.4) return 0;  // เมล็ด 40%
  if (rand < 0.7) return 1;  // ต้นกล้า 30%
  if (rand < 0.85) return 2; // ต้นอ่อน 15%
  if (rand < 0.95) return 3; // ข้าวโพด 10%
  return 4;                   // ข้าวสีทอง 5%
}

export default function MergeGame({ onComplete }: { onComplete: (correct: boolean) => void }) {
  const [items, setItems] = useState<Item[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [score, setScore] = useState(0);
  const [nextType, setNextType] = useState(randomType());
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState('');
  const [combo, setCombo] = useState(0);
  const animRef = useRef<number>();
  const lastTimeRef = useRef(0);
  const itemsRef = useRef(items);
  const particlesRef = useRef(particles);
  const scoreRef = useRef(0);

  useEffect(() => { itemsRef.current = items; }, [items]);
  useEffect(() => { particlesRef.current = particles; }, [particles]);
  useEffect(() => { scoreRef.current = score; }, [score]);

  // Timer
  useEffect(() => {
    if (gameOver) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameOver(true);
          setMessage(`หมดเวลา! ได้ ${scoreRef.current} แต้ม`);
          setTimeout(() => onComplete(scoreRef.current >= 100), 2000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameOver, onComplete]);

  const spawnParticles = useCallback((x: number, y: number, color: string, count: number = 6) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      newParticles.push({
        id: nextId++,
        x, y,
        vx: Math.cos(angle) * (1.5 + Math.random() * 2),
        vy: Math.sin(angle) * (1.5 + Math.random() * 2),
        life: 1,
        color,
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  // Physics loop — continuous, smooth
  useEffect(() => {
    if (gameOver) return;

    const loop = (time: number) => {
      const elapsed = lastTimeRef.current ? time - lastTimeRef.current : 16;
      const delta = Math.min(elapsed / 16, 2.5);
      lastTimeRef.current = time;

      const currentItems = itemsRef.current.map(i => ({ ...i }));
      const currentParticles = particlesRef.current.map(p => ({ ...p }));
      let itemsChanged = false;
      let particlesChanged = false;

      // Update particles
      for (let i = currentParticles.length - 1; i >= 0; i--) {
        const p = currentParticles[i];
        p.x += p.vx * delta;
        p.y += p.vy * delta;
        p.vy += 0.08 * delta;
        p.life -= 0.03 * delta;
        if (p.life <= 0) {
          currentParticles.splice(i, 1);
          particlesChanged = true;
        } else {
          particlesChanged = true;
        }
      }

      // Update items
      for (let i = 0; i < currentItems.length; i++) {
        const item = currentItems[i];
        if (item.scale < 1) {
          item.scale = Math.min(1, item.scale + 0.12 * delta);
          itemsChanged = true;
        }
        if (item.merging) continue;

        // Gravity
        item.vy += GRAVITY * delta;
        item.vx *= Math.pow(FRICTION, delta);
        item.vy *= Math.pow(FRICTION, delta);
        item.x += item.vx * delta;
        item.y += item.vy * delta;
        item.rotation += item.vRotation * delta;

        const leftWall = WALL_PADDING + item.radius;
        const rightWall = CONTAINER_WIDTH - WALL_PADDING - item.radius;
        const floor = CONTAINER_HEIGHT - WALL_PADDING - item.radius;

        // Wall bounce
        if (item.x < leftWall) { item.x = leftWall; item.vx = Math.abs(item.vx) * BOUNCE; item.vRotation = -item.vRotation * 0.3; }
        if (item.x > rightWall) { item.x = rightWall; item.vx = -Math.abs(item.vx) * BOUNCE; item.vRotation = -item.vRotation * 0.3; }
        if (item.y > floor) {
          item.y = floor;
          item.vy = -Math.abs(item.vy) * BOUNCE * 0.7;
          item.vx *= 0.85;
          item.vRotation *= 0.6;
          if (Math.abs(item.vy) < 0.3) item.vy = 0;
        }

        // Collision
        for (let j = i + 1; j < currentItems.length; j++) {
          const other = currentItems[j];
          if (other.merging) continue;

          const dx = other.x - item.x;
          const dy = other.y - item.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = item.radius + other.radius;

          if (dist < minDist && dist > 0.1) {
            if (item.type === other.type && item.type < TYPES.length - 1) {
              // Merge!
              const midX = (item.x + other.x) / 2;
              const midY = (item.y + other.y) / 2;
              item.merging = true;
              other.merging = true;

              currentItems.splice(j, 1);
              currentItems.splice(i, 1);

              const newItem = createItem(item.type + 1, midX);
              newItem.y = midY - 10;
              newItem.vy = -2;
              newItem.scale = 1.15;
              currentItems.push(newItem);

              spawnParticles(midX, midY, COLORS[item.type + 1], 8);
              const points = (item.type + 2) * 10 * (combo + 1);
              setScore(prev => prev + points);
              setCombo(prev => prev + 1);
              setTimeout(() => setCombo(0), 600);

              itemsChanged = true;
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

              const relVx = other.vx - item.vx;
              const relVy = other.vy - item.vy;
              const relVn = relVx * nx + relVy * ny;

              if (relVn < 0) {
                item.vx += relVn * nx * BOUNCE * 0.7;
                item.vy += relVn * ny * BOUNCE * 0.7;
                other.vx -= relVn * nx * BOUNCE * 0.7;
                other.vy -= relVn * ny * BOUNCE * 0.7;
              }
              item.vRotation = (Math.random() - 0.5) * 0.1;
              other.vRotation = (Math.random() - 0.5) * 0.1;
            }
          }
        }
      }

      const filteredItems = currentItems.filter(i => !i.merging);
      if (filteredItems.length !== currentItems.length) itemsChanged = true;

      if (itemsChanged) setItems(filteredItems);
      if (particlesChanged) setParticles(currentParticles);

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [gameOver, combo, spawnParticles]);

  // Auto-drop — no delay, continuous
  useEffect(() => {
    if (gameOver) return;

    // ตกทันทีตัวแรก
    const firstX = CONTAINER_WIDTH / 2 + (Math.random() - 0.5) * 60;
    setItems([createItem(randomType(), firstX)]);
    setNextType(randomType());

    const dropInterval = setInterval(() => {
      setItems(prev => {
        if (prev.length < 8) {
          const x = WALL_PADDING + 30 + Math.random() * (CONTAINER_WIDTH - WALL_PADDING * 2 - 60);
          return [...prev, createItem(randomType(), x)];
        }
        return prev;
      });
      setNextType(randomType());
    }, DROP_INTERVAL);

    return () => clearInterval(dropInterval);
  }, [gameOver]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const dangerLine = items.some(i => i.y < 35 && !i.merging);

  return (
    <div style={{ maxWidth: 360, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div>
          <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1rem', color: 'var(--color-text)' }}>🌽 รวมเมล็ด</p>
          <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: 1 }}>ตัวเดียวกันชนกัน = รวมร่าง!</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.3rem', color: 'var(--color-primary)', lineHeight: 1 }}>{score}</p>
          <p style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>แต้ม</p>
        </div>
      </div>

      {/* Timer */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
        <div style={{
          background: timeLeft <= 10 ? '#EF4444' : 'var(--color-primary)',
          color: '#fff', borderRadius: 'var(--radius-full)', padding: '4px 10px',
          fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.85rem', minWidth: 50, textAlign: 'center',
        }}>⏱ {formatTime(timeLeft)}</div>
        <div style={{ flex: 1, height: 6, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(100, (score / 400) * 100)}%`, background: score >= 400 ? '#10B981' : 'var(--color-primary)', borderRadius: 3, transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* Next */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, padding: '3px 8px', background: '#F3F4F6', borderRadius: 'var(--radius-md)' }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>ถัดไป:</span>
        <img src={TYPES[nextType].img} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} />
        <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>{TYPES[nextType].name}</span>
      </div>

      {/* Danger */}
      {dangerLine && (
        <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 'var(--radius-md)', padding: '4px 8px', marginBottom: 6, textAlign: 'center' }}>
          <p style={{ color: '#DC2626', fontSize: '0.75rem', fontWeight: 700 }}>⚠️ ระวัง! ของจะล้นกล่อง</p>
        </div>
      )}

      {/* Container */}
      <div style={{
        width: '100%', height: CONTAINER_HEIGHT,
        background: 'linear-gradient(180deg, #FEF9C3 0%, #FDE68A 40%, #FCD34D 100%)',
        borderRadius: 'var(--radius-lg)', border: '3px solid #D97706',
        position: 'relative', overflow: 'hidden',
        boxShadow: 'inset 0 4px 15px rgba(0,0,0,0.08), 0 3px 10px rgba(0,0,0,0.12)',
      }}>
        {/* Glass effect */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, transparent 25%)', pointerEvents: 'none', borderRadius: 'var(--radius-lg)' }} />

        {/* Particles */}
        {particles.map(p => (
          <div key={p.id} style={{
            position: 'absolute', left: p.x - 3, top: p.y - 3,
            width: 6, height: 6, borderRadius: '50%', background: p.color, opacity: p.life,
            pointerEvents: 'none', transform: `scale(${p.life})`,
          }} />
        ))}

        {/* Items */}
        {items.map(item => (
          <img key={item.id} src={TYPES[item.type].img} alt="" style={{
            position: 'absolute',
            left: item.x - item.radius,
            top: item.y - item.radius,
            width: item.radius * 2,
            height: item.radius * 2,
            objectFit: 'contain',
            pointerEvents: 'none',
            transform: `scale(${item.scale}) rotate(${item.rotation}rad)`,
            filter: item.merging ? 'brightness(1.3)' : 'none',
          }} />
        ))}

        {/* Game over */}
        {gameOver && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, backdropFilter: 'blur(2px)' }}>
            <p style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 800 }}>{message}</p>
            <p style={{ color: '#FCD34D', fontSize: '0.9rem' }}>🌽 ขอบคุณที่เล่น!</p>
          </div>
        )}
      </div>

      {/* Chain */}
      <div style={{ display: 'flex', gap: 2, marginTop: 8, padding: 6, background: '#F9FAFB', borderRadius: 'var(--radius-md)', justifyContent: 'center', alignItems: 'center' }}>
        {TYPES.map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <img src={t.img} alt={t.name} style={{ width: 18, height: 18, objectFit: 'contain' }} />
            {i < TYPES.length - 1 && <span style={{ color: 'var(--color-text-muted)', fontSize: '0.5rem' }}>→</span>}
          </div>
        ))}
      </div>

      {/* How to play */}
      <div style={{ marginTop: 8, padding: 8, background: '#EFF6FF', borderRadius: 'var(--radius-md)', border: '1px solid #BFDBFE' }}>
        <p style={{ fontSize: '0.7rem', color: '#1E40AF', fontWeight: 600, marginBottom: 3 }}>💡 วิธีเล่น</p>
        <p style={{ fontSize: '0.65rem', color: '#3B82F6', lineHeight: 1.5 }}>
          • เมล็ดจะตกลงมาเรื่อยๆ<br/>
          • ตัวเดียวกันชนกัน = รวมร่าง!<br/>
          • สะสมแต้มให้ได้มากที่สุดใน 60 วินาที
        </p>
      </div>
    </div>
  );
}
