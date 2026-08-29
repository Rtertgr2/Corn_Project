// web/src/games/MergeGame.tsx
// เกมรวมเมล็ดแบบ Suika — physics-based + smooth animations
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
  mergingWith?: number;
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

const TYPES = [
  { name: 'เมล็ด', img: '/assets/corn/seed.png', radius: 18, color: '#FBBF24' },
  { name: 'ต้นกล้า', img: '/assets/corn/sprout.png', radius: 24, color: '#34D399' },
  { name: 'ต้นข้าวโพด', img: '/assets/corn/young_corn.png', radius: 30, color: '#81C784' },
  { name: 'ข้าวโพด', img: '/assets/corn/ripe_corn.png', radius: 36, color: '#F59E0B' },
  { name: 'ต้นข้าวสีทอง', img: '/assets/corn/golden_rice.png', radius: 30, color: '#F4D03F' },
  { name: 'ข้าวกล้อง', img: '/assets/corn/brown_rice.png', radius: 36, color: '#A0522D' },
  { name: 'ไอศครีม', img: '/assets/corn/ice_cream.png', radius: 42, color: '#FFB6C1' },
];

const MERGE_RESULT: Record<number, number> = {
  0: 1, 1: 2, 2: 3, 3: 5, 4: 5, 5: 6,
};

const CONTAINER_WIDTH = 320;
const CONTAINER_HEIGHT = 450;
const GRAVITY = 0.4;
const FRICTION = 0.98;
const BOUNCE = 0.4;
const WALL_PADDING = 5;

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
  if (rand < 0.55) return 0;
  if (rand < 0.85) return 1;
  return 2;
}

export default function MergeGame({ onComplete }: { onComplete: (correct: boolean) => void }) {
  const [items, setItems] = useState<Item[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [score, setScore] = useState(0);
  const [nextType, setNextType] = useState(randomType());
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState('');
  const [combo, setCombo] = useState(0);
  const animRef = useRef<number>();
  const lastTimeRef = useRef(0);
  const itemsRef = useRef(items);
  const particlesRef = useRef(particles);

  useEffect(() => { itemsRef.current = items; }, [items]);
  useEffect(() => { particlesRef.current = particles; }, [particles]);

  // Spawn particles on merge
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

        // Scale animation (spawn)
        if (item.scale < 1) {
          item.scale = Math.min(1, item.scale + 0.08 * delta);
          itemsChanged = true;
        }

        // Skip physics if merging
        if (item.merging) continue;

        // Gravity
        item.vy += GRAVITY * delta;
        item.vx *= FRICTION;
        item.vy *= FRICTION;

        // Apply velocity
        item.x += item.vx * delta;
        item.y += item.vy * delta;
        item.rotation += item.vRotation * delta;

        // Wall collisions
        const leftWall = WALL_PADDING + item.radius;
        const rightWall = CONTAINER_WIDTH - WALL_PADDING - item.radius;
        const floor = CONTAINER_HEIGHT - WALL_PADDING - item.radius;

        if (item.x < leftWall) {
          item.x = leftWall;
          item.vx = Math.abs(item.vx) * BOUNCE;
          item.vRotation = -item.vRotation * 0.5;
        }
        if (item.x > rightWall) {
          item.x = rightWall;
          item.vx = -Math.abs(item.vx) * BOUNCE;
          item.vRotation = -item.vRotation * 0.5;
        }
        if (item.y > floor) {
          item.y = floor;
          item.vy = -Math.abs(item.vy) * BOUNCE;
          item.vx *= 0.9;
          item.vRotation *= 0.8;
          if (Math.abs(item.vy) < 0.5) item.vy = 0;
        }

        // Item-item collisions
        for (let j = i + 1; j < currentItems.length; j++) {
          const other = currentItems[j];
          if (other.merging) continue;

          const dx = other.x - item.x;
          const dy = other.y - item.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = item.radius + other.radius;

          if (dist < minDist && dist > 0.1) {
            // Merge if same type
            if (item.type === other.type && MERGE_RESULT[item.type] !== undefined) {
              const newType = MERGE_RESULT[item.type];
              const midX = (item.x + other.x) / 2;
              const midY = (item.y + other.y) / 2;

              // Mark as merging
              item.merging = true;
              other.merging = true;

              // Remove both and create new
              currentItems.splice(j, 1);
              currentItems.splice(i, 1);

              const newItem = createItem(newType, midX);
              newItem.y = midY - 20;
              newItem.vy = -3;
              newItem.scale = 1.3;
              currentItems.push(newItem);

              // Particles
              spawnParticles(midX, midY, TYPES[newType].color, 10);

              // Score
              const points = (newType + 1) * 10 * (combo + 1);
              setScore(prev => prev + points);
              setCombo(prev => prev + 1);
              setTimeout(() => setCombo(0), 1000);

              itemsChanged = true;
              break;
            } else {
              // Bounce off each other
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

      // Remove merged items
      const filteredItems = currentItems.filter(i => !i.merging);
      if (filteredItems.length !== currentItems.length) {
        itemsChanged = true;
      }

      if (itemsChanged) setItems(filteredItems);
      if (particlesChanged) setParticles(currentParticles);

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [gameOver, combo, spawnParticles]);

  // Check game over
  useEffect(() => {
    if (gameOver) return;
    const topY = 60;
    const overflow = items.some(item => !item.merging && item.y - item.radius < topY && Math.abs(item.vy) < 1);
    if (overflow && items.length > 3) {
      setGameOver(true);
      setMessage(`เกมจบ! ได้ ${score} แต้ม`);
      setTimeout(() => onComplete(score >= 200), 2000);
    }
  }, [items, gameOver, score, onComplete]);

  const handleDrop = useCallback(() => {
    if (gameOver) return;
    const x = CONTAINER_WIDTH / 2 + (Math.random() - 0.5) * 60;
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

      {/* Combo indicator */}
      {combo > 0 && (
        <div style={{
          position: 'absolute',
          top: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--color-gold)',
          color: '#78350F',
          padding: '4px 12px',
          borderRadius: 'var(--radius-full)',
          fontWeight: 700,
          fontSize: '0.85rem',
          zIndex: 10,
          animation: 'pulse 0.3s ease',
        }}>
          COMBO x{combo + 1}!
        </div>
      )}

      {/* Next item preview */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>ถัดไป:</span>
        <img src={TYPES[nextType].img} alt={TYPES[nextType].name} style={{ width: 36, height: 36, objectFit: 'contain' }} />
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)' }}>{TYPES[nextType].name}</span>
      </div>

      {/* Container */}
      <div
        onClick={handleDrop}
        style={{
          width: '100%',
          height: CONTAINER_HEIGHT,
          background: 'linear-gradient(180deg, #FEF3C7 0%, #FDE68A 50%, #FCD34D 100%)',
          borderRadius: 'var(--radius-lg)',
          border: '3px solid var(--color-border-strong)',
          position: 'relative',
          overflow: 'hidden',
          cursor: gameOver ? 'default' : 'pointer',
          boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.15), var(--shadow-lg)',
        }}
      >
        {/* Container inner shadow */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, transparent 70%, rgba(0,0,0,0.1) 100%)',
          pointerEvents: 'none',
        }} />

        {/* Particles */}
        {particles.map(p => (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: p.x - 4,
              top: p.y - 4,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: p.color,
              opacity: p.life,
              pointerEvents: 'none',
              transform: `scale(${p.life})`,
            }}
          />
        ))}

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
              transform: `scale(${item.scale}) rotate(${item.rotation}rad)`,
              transition: 'none',
              filter: item.merging ? 'brightness(1.5)' : 'none',
            }}
          />
        ))}

        {/* Drop indicator */}
        {!gameOver && (
          <div style={{
            position: 'absolute',
            top: 15,
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'rgba(0,0,0,0.4)',
            fontSize: '0.75rem',
            fontWeight: 600,
            textAlign: 'center',
            pointerEvents: 'none',
          }}>
            คลิกเพื่อปล่อย
          </div>
        )}

        {/* Game Over overlay */}
        {gameOver && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 8,
            backdropFilter: 'blur(2px)',
          }}>
            <p style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 800, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
              {message}
            </p>
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
