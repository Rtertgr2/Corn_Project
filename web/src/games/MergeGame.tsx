// web/src/games/MergeGame.tsx
// เกมรวมเมล็ดแบบ Suika — physics-based merge with kawaii style
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

// 8 ชนิด — chain 0→1→2→3→4→5→6→7
const TYPES = [
  { name: 'เมล็ด', img: '/assets/corn/seed.png', radius: 22, color: '#FBBF24', face: '😊' },
  { name: 'ต้นกล้า', img: '/assets/corn/sprout.png', radius: 28, color: '#34D399', face: '🌱' },
  { name: 'พระอาทิตย์', img: '/assets/corn/ripe_corn.png', radius: 34, color: '#F59E0B', face: '🌞' },
  { name: 'ข้าวโพด', img: '/assets/corn/golden_rice.png', radius: 40, color: '#EAB308', face: '🌽' },
  { name: 'หัวใจ', img: '/assets/corn/brown_rice.png', radius: 34, color: '#EF4444', face: '❤️' },
  { name: 'ต้นข้าวสีทอง', img: '/assets/corn/golden_rice.png', radius: 40, color: '#F4D03F', face: '🌾' },
  { name: 'ไอศครีม', img: '/assets/corn/ice_cream.png', radius: 46, color: '#FFB6C1', face: '🍦' },
  { name: 'คูปอง', img: null, radius: 52, color: '#A855F7', face: '🎫' },
];

const COLORS = ['#FBBF24', '#34D399', '#F59E0B', '#EAB308', '#EF4444', '#F4D03F', '#FFB6C1', '#A855F7'];

const CONTAINER_WIDTH = 320;
const CONTAINER_HEIGHT = 400;
const GRAVITY = 0.35;
const FRICTION = 0.99;
const BOUNCE = 0.5;
const WALL_PADDING = 8;
const TIME_LIMIT = 60;

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
    rotation: (Math.random() - 0.5) * 0.2,
    vRotation: (Math.random() - 0.5) * 0.05,
    scale: 0,
    merging: false,
  };
}

function randomType(): number {
  const rand = Math.random();
  if (rand < 0.45) return 0; // เมล็ด 45%
  if (rand < 0.75) return 1; // ต้นกล้า 30%
  if (rand < 0.9) return 2;  // พระอาทิตย์ 15%
  return 3;                   // ข้าวโพด 10%
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

  useEffect(() => { itemsRef.current = items; }, [items]);
  useEffect(() => { particlesRef.current = particles; }, [particles]);

  // Timer
  useEffect(() => {
    if (gameOver) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameOver(true);
          setMessage(`หมดเวลา! ได้ ${score} แต้ม`);
          setTimeout(() => onComplete(score >= 200), 2000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameOver, score, onComplete]);

  const spawnParticles = useCallback((x: number, y: number, color: string, count: number = 8) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      newParticles.push({
        id: nextId++,
        x, y,
        vx: Math.cos(angle) * (2 + Math.random() * 3),
        vy: Math.sin(angle) * (2 + Math.random() * 3),
        life: 1,
        color,
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  // Physics loop
  useEffect(() => {
    if (gameOver) return;

    const loop = (time: number) => {
      const delta = lastTimeRef.current ? Math.min((time - lastTimeRef.current) / 16, 2) : 1;
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
        p.vy += 0.1 * delta;
        p.life -= 0.025 * delta;
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
          item.scale = Math.min(1, item.scale + 0.1 * delta);
          itemsChanged = true;
        }
        if (item.merging) continue;

        item.vy += GRAVITY * delta;
        item.vx *= FRICTION;
        item.vy *= FRICTION;
        item.x += item.vx * delta;
        item.y += item.vy * delta;
        item.rotation += item.vRotation * delta;

        const leftWall = WALL_PADDING + item.radius;
        const rightWall = CONTAINER_WIDTH - WALL_PADDING - item.radius;
        const floor = CONTAINER_HEIGHT - WALL_PADDING - item.radius;

        if (item.x < leftWall) { item.x = leftWall; item.vx = Math.abs(item.vx) * BOUNCE; item.vRotation = -item.vRotation * 0.5; }
        if (item.x > rightWall) { item.x = rightWall; item.vx = -Math.abs(item.vx) * BOUNCE; item.vRotation = -item.vRotation * 0.5; }
        if (item.y > floor) {
          item.y = floor;
          item.vy = -Math.abs(item.vy) * BOUNCE;
          item.vx *= 0.9;
          item.vRotation *= 0.8;
          if (Math.abs(item.vy) < 0.5) item.vy = 0;
        }

        // Collision with other items
        for (let j = i + 1; j < currentItems.length; j++) {
          const other = currentItems[j];
          if (other.merging) continue;

          const dx = other.x - item.x;
          const dy = other.y - item.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = item.radius + other.radius;

          if (dist < minDist && dist > 0.1) {
            // Merge if same type
            if (item.type === other.type && item.type < TYPES.length - 1) {
              const midX = (item.x + other.x) / 2;
              const midY = (item.y + other.y) / 2;

              item.merging = true;
              other.merging = true;

              // Remove both and create new
              currentItems.splice(j, 1);
              currentItems.splice(i, 1);

              const newItem = createItem(item.type + 1, midX);
              newItem.y = midY - 15;
              newItem.vy = -2.5;
              newItem.scale = 1.2;
              currentItems.push(newItem);

              spawnParticles(midX, midY, COLORS[item.type + 1], 10);

              const points = (item.type + 2) * 10 * (combo + 1);
              setScore(prev => prev + points);
              setCombo(prev => prev + 1);
              setTimeout(() => setCombo(0), 800);

              itemsChanged = true;
              break;
            } else {
              // Bounce off
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
                item.vx += relVn * nx * BOUNCE * 0.8;
                item.vy += relVn * ny * BOUNCE * 0.8;
                other.vx -= relVn * nx * BOUNCE * 0.8;
                other.vy -= relVn * ny * BOUNCE * 0.8;
              }

              item.vRotation = (Math.random() - 0.5) * 0.15;
              other.vRotation = (Math.random() - 0.5) * 0.15;
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

  // Auto-drop
  useEffect(() => {
    if (gameOver) return;
    // Drop immediately
    const x = CONTAINER_WIDTH / 2 + (Math.random() - 0.5) * 80;
    setItems(prev => [...prev, createItem(randomType(), x)]);
    setNextType(randomType());

    const dropInterval = setInterval(() => {
      setItems(prev => {
        if (prev.length < 6) {
          const x = CONTAINER_WIDTH / 2 + (Math.random() - 0.5) * 80;
          return [...prev, createItem(randomType(), x)];
        }
        return prev;
      });
      setNextType(randomType());
    }, 1800);
    return () => clearInterval(dropInterval);
  }, [gameOver]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const dangerLine = items.some(i => i.y < 40);

  return (
    <div style={{ maxWidth: 360, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div>
          <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-text)' }}>
            🌽 รวมเมล็ด
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
            ตัวเดียวกันชนกัน = รวมร่าง!
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.4rem', color: 'var(--color-primary)', lineHeight: 1 }}>
            {score}
          </p>
          <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>แต้ม</p>
        </div>
      </div>

      {/* Timer + Progress */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'center' }}>
        <div style={{
          background: timeLeft <= 10 ? '#EF4444' : 'var(--color-primary)',
          color: '#fff',
          borderRadius: 'var(--radius-full)',
          padding: '5px 12px',
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          fontSize: '0.9rem',
          minWidth: 55,
          textAlign: 'center',
        }}>
          ⏱ {formatTime(timeLeft)}
        </div>
        <div style={{ flex: 1, height: 8, background: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${Math.min(100, (score / 500) * 100)}%`,
            background: score >= 500 ? '#10B981' : 'var(--color-primary)',
            borderRadius: 4,
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      {/* Next item */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, padding: '4px 10px', background: '#F3F4F6', borderRadius: 'var(--radius-md)' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>ถัดไป:</span>
        <span style={{ fontSize: '1.1rem' }}>{TYPES[nextType].face}</span>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text)' }}>{TYPES[nextType].name}</span>
      </div>

      {/* Danger warning */}
      {dangerLine && (
        <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 'var(--radius-md)', padding: '6px 10px', marginBottom: 8, textAlign: 'center' }}>
          <p style={{ color: '#DC2626', fontSize: '0.8rem', fontWeight: 700 }}>⚠️ ระวัง! ของจะล้นกล่อง</p>
        </div>
      )}

      {/* Container */}
      <div style={{
        width: '100%',
        height: CONTAINER_HEIGHT,
        background: 'linear-gradient(180deg, #FEF9C3 0%, #FDE68A 40%, #FCD34D 100%)',
        borderRadius: 'var(--radius-lg)',
        border: '3px solid #D97706',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.1), 0 4px 15px rgba(0,0,0,0.15)',
      }}>
        {/* Glass effect */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 30%)', pointerEvents: 'none', borderRadius: 'var(--radius-lg)' }} />

        {/* Particles */}
        {particles.map(p => (
          <div key={p.id} style={{
            position: 'absolute', left: p.x - 4, top: p.y - 4,
            width: 8, height: 8, borderRadius: '50%', background: p.color, opacity: p.life,
            pointerEvents: 'none', transform: `scale(${p.life})`,
          }} />
        ))}

        {/* Items */}
        {items.map(item => {
          const t = TYPES[item.type];
          return (
            <div key={item.id} style={{
              position: 'absolute',
              left: item.x - item.radius,
              top: item.y - item.radius,
              width: item.radius * 2,
              height: item.radius * 2,
              borderRadius: '50%',
              background: t.img ? `url(${t.img}) center/cover` : t.color,
              pointerEvents: 'none',
              transform: `scale(${item.scale}) rotate(${item.rotation}rad)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: `${item.radius * 0.7}px`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              border: '2px solid rgba(255,255,255,0.5)',
            }}>
              {!t.img && <span style={{ fontSize: `${item.radius * 0.8}px` }}>{t.face}</span>}
            </div>
          );
        })}

        {/* Game over overlay */}
        {gameOver && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, backdropFilter: 'blur(3px)' }}>
            <p style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 800, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{message}</p>
            <p style={{ color: '#FCD34D', fontSize: '1rem', fontWeight: 600 }}>🌽 ขอบคุณที่เล่น!</p>
          </div>
        )}
      </div>

      {/* Chain legend */}
      <div style={{ display: 'flex', gap: 3, marginTop: 10, padding: 8, background: '#F9FAFB', borderRadius: 'var(--radius-md)', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
        {TYPES.map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <span style={{ fontSize: '0.9rem' }}>{t.face}</span>
            {i < TYPES.length - 1 && <span style={{ color: 'var(--color-text-muted)', fontSize: '0.55rem' }}>→</span>}
          </div>
        ))}
      </div>

      {/* How to play */}
      <div style={{ marginTop: 10, padding: 10, background: '#EFF6FF', borderRadius: 'var(--radius-md)', border: '1px solid #BFDBFE' }}>
        <p style={{ fontSize: '0.75rem', color: '#1E40AF', fontWeight: 600, marginBottom: 4 }}>💡 วิธีเล่น</p>
        <p style={{ fontSize: '0.7rem', color: '#3B82F6', lineHeight: 1.5 }}>
          • เมล็ดจะตกลงมาอัตโนมัติ<br/>
          • ตัวเดียวกันชนกัน = รวมร่างเป็นตัวที่ใหญ่กว่า<br/>
          • สะสมแต้มให้ได้มากที่สุดใน 60 วินาที<br/>
          • ระวังอย่าให้ของล้นกล่อง!
        </p>
      </div>
    </div>
  );
}
