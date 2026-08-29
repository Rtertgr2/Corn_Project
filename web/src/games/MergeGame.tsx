// web/src/games/MergeGame.tsx
// เกมรวมเมล็ดแบบ Suika — ไอคอนใหญ่ + จับเวลา 60 วินาที
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

// 8 ชนิด — chain เดียว 0→1→2→3→4→5→6→7
const TYPES = [
  { name: 'เมล็ด', img: '/assets/corn/seed.png', radius: 30, color: '#FBBF24' },
  { name: 'ต้นกล้า', img: '/assets/corn/sprout.png', radius: 38, color: '#34D399' },
  { name: 'พระอาทิตย์', img: '/assets/corn/ripe_corn.png', radius: 46, color: '#F59E0B' },
  { name: 'ข้าวโพด', img: '/assets/corn/golden_rice.png', radius: 54, color: '#EAB308' },
  { name: 'หัวใจ', img: '/assets/corn/brown_rice.png', radius: 38, color: '#EF4444' },
  { name: 'ต้นข้าวสีทอง', img: '/assets/corn/golden_rice.png', radius: 46, color: '#F4D03F' },
  { name: 'ไอศครีม', img: '/assets/corn/ice_cream.png', radius: 54, color: '#FFB6C1' },
  { name: 'คูปอง', img: null, radius: 60, color: '#A855F7' }, // ไม่มีรูป → ใช้ div
];

const COLORS = ['#FBBF24', '#34D399', '#F59E0B', '#EAB308', '#EF4444', '#F4D03F', '#FFB6C1', '#A855F7'];

const CONTAINER_WIDTH = 400;
const CONTAINER_HEIGHT = 500;
const GRAVITY = 0.4;
const FRICTION = 0.98;
const BOUNCE = 0.4;
const WALL_PADDING = 5;
const TIME_LIMIT = 60; // 60 วินาที

let nextId = 0;

function createItem(type: number, x: number): Item {
  return {
    id: nextId++,
    type,
    x,
    y: 40,
    vx: (Math.random() - 0.5) * 3,
    vy: 0,
    radius: TYPES[type].radius,
    rotation: (Math.random() - 0.5) * 0.3,
    vRotation: (Math.random() - 0.5) * 0.1,
    scale: 0,
    merging: false,
  };
}

function randomType(): number {
  const rand = Math.random();
  if (rand < 0.5) return 0;
  if (rand < 0.85) return 1;
  return 2;
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
        p.life -= 0.02 * delta;
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
          item.scale = Math.min(1, item.scale + 0.08 * delta);
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

        for (let j = i + 1; j < currentItems.length; j++) {
          const other = currentItems[j];
          if (other.merging) continue;

          const dx = other.x - item.x;
          const dy = other.y - item.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = item.radius + other.radius;

          if (dist < minDist && dist > 0.1) {
            // ถ้าเหมือนกัน → merge เป็นชั้นถัดไป
            let resultType = -1;
            if (item.type === other.type && item.type < TYPES.length - 1) {
              resultType = item.type + 1;
            } else if (item.type === 3 && other.type === 5) {
              resultType = 6; // ข้าวโพด + ต้นข้าวสีทอง = ไอติม
            } else if (item.type === 5 && other.type === 3) {
              resultType = 6;
            }

            if (resultType >= 0) {
              const midX = (item.x + other.x) / 2;
              const midY = (item.y + other.y) / 2;

              item.merging = true;
              other.merging = true;

              currentItems.splice(j, 1);
              currentItems.splice(i, 1);

              const newItem = createItem(resultType, midX);
              newItem.y = midY - 20;
              newItem.vy = -3;
              newItem.scale = 1.3;
              currentItems.push(newItem);

              spawnParticles(midX, midY, COLORS[resultType], 10);

              const points = (resultType + 1) * 10 * (combo + 1);
              setScore(prev => prev + points);
              setCombo(prev => prev + 1);
              setTimeout(() => setCombo(0), 1000);

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
                item.vx += relVn * nx * BOUNCE;
                item.vy += relVn * ny * BOUNCE;
                other.vx -= relVn * nx * BOUNCE;
                other.vy -= relVn * ny * BOUNCE;
              }

              item.vRotation = (Math.random() - 0.5) * 0.2;
              other.vRotation = (Math.random() - 0.5) * 0.2;
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

  // Auto-drop items every 2 seconds
  useEffect(() => {
    if (gameOver) return;
    // ตกทันทีตอนเริ่ม
    const x = CONTAINER_WIDTH / 2 + (Math.random() - 0.5) * 60;
    setItems(prev => [...prev, createItem(randomType(), x)]);
    
    const dropInterval = setInterval(() => {
      setItems(prev => {
        if (prev.length < 5) {
          const x = CONTAINER_WIDTH / 2 + (Math.random() - 0.5) * 60;
          return [...prev, createItem(randomType(), x)];
        }
        return prev;
      });
    }, 2000);
    return () => clearInterval(dropInterval);
  }, [gameOver]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)' }}>
            รวมเมล็ด
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            คลิกเพื่อปล่อย • จับเวลา 60 วินาที
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

      {/* Timer + Progress */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
        <div style={{
          background: timeLeft <= 10 ? 'var(--color-danger)' : 'var(--color-primary)',
          color: '#fff',
          borderRadius: 'var(--radius-md)',
          padding: '6px 12px',
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          fontSize: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          ⏱️ {formatTime(timeLeft)}
        </div>
        <div style={{ flex: 1, height: 6, background: 'var(--color-muted)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${Math.min(100, (score / 500) * 100)}%`,
            background: score >= 500 ? 'var(--color-accent)' : 'var(--color-primary)',
            borderRadius: 3,
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      {/* Next item */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>ถัดไป:</span>
        {TYPES[nextType].img ? (
          <img src={TYPES[nextType].img} alt="" style={{ width: 36, height: 36, objectFit: 'contain' }} />
        ) : (
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: TYPES[nextType].color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🎫</div>
        )}
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)' }}>{TYPES[nextType].name}</span>
      </div>

      {/* Container */}
      <div
        style={{
          width: '100%',
          height: CONTAINER_HEIGHT,
          background: 'linear-gradient(180deg, #FEF3C7 0%, #FDE68A 50%, #FCD34D 100%)',
          borderRadius: 'var(--radius-lg)',
          border: '3px solid var(--color-border-strong)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.15), var(--shadow-lg)',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 70%, rgba(0,0,0,0.1) 100%)', pointerEvents: 'none' }} />

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
          return t.img ? (
            <img key={item.id} src={t.img} alt="" style={{
              position: 'absolute', left: item.x - item.radius, top: item.y - item.radius,
              width: item.radius * 2, height: item.radius * 2, objectFit: 'contain',
              pointerEvents: 'none', transform: `scale(${item.scale}) rotate(${item.rotation}rad)`,
              filter: item.merging ? 'brightness(1.5)' : 'none',
            }} />
          ) : (
            <div key={item.id} style={{
              position: 'absolute', left: item.x - item.radius, top: item.y - item.radius,
              width: item.radius * 2, height: item.radius * 2, borderRadius: '50%',
              background: t.color, pointerEvents: 'none', transform: `scale(${item.scale})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: `${item.radius * 0.8}px`, fontWeight: 700, color: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}>🎫</div>
          );
        })}

        {!gameOver && (
          <div style={{ position: 'absolute', top: 15, left: '50%', transform: 'translateX(-50%)', color: 'rgba(0,0,0,0.4)', fontSize: '0.75rem', fontWeight: 600, textAlign: 'center', pointerEvents: 'none' }}>
            เมล็ดกำลังตกลงมา...
          </div>
        )}

        {gameOver && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, backdropFilter: 'blur(2px)' }}>
            <p style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 800, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>{message}</p>
          </div>
        )}
      </div>

      {/* Chain legend */}
      <div style={{ display: 'flex', gap: 4, marginTop: 12, padding: 8, background: 'var(--color-muted)', borderRadius: 'var(--radius-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
        {TYPES.map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {t.img ? (
              <img src={t.img} alt={t.name} style={{ width: 20, height: 20, objectFit: 'contain' }} />
            ) : (
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem' }}>🎫</div>
            )}
            {i < TYPES.length - 1 && <span style={{ color: 'var(--color-text-muted)', fontSize: '0.6rem' }}>→</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
