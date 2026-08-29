// web/src/games/MergeGame.tsx
// เกมรวมเมล็ด — merge chain แบบ TikTok
import { useState, useCallback, useEffect, useRef } from 'react';

type Cell = { type: number; id: number } | null;
type Grid = Cell[][];
type Pos = { r: number; c: number };

const COLS = 5;
const ROWS = 5;

// 7 ชนิด: seed, sprout, young_corn, ripe_corn, golden_rice, brown_rice, ice_cream
const TYPES = [
  { name: 'เมล็ด', img: '/assets/corn/seed.png', level: 0 },
  { name: 'ต้นกล้า', img: '/assets/corn/sprout.png', level: 1 },
  { name: 'ต้นข้าวโพด', img: '/assets/corn/young_corn.png', level: 2 },
  { name: 'ข้าวโพด', img: '/assets/corn/ripe_corn.png', level: 3 },
  { name: 'ต้นข้าวสีทอง', img: '/assets/corn/golden_rice.png', level: 2 },
  { name: 'ข้าวกล้อง', img: '/assets/corn/brown_rice.png', level: 3 },
  { name: 'ไอศครีม', img: '/assets/corn/ice_cream.png', level: 4 },
];

// merge rules: type A + type B → type C
const MERGE_RULES: Record<string, number> = {
  '0,1': 2,   // seed + sprout → young_corn
  '0,0': 1,   // seed + seed → sprout
  '1,1': 3,   // sprout + sprout → ripe_corn (จากต้นกล้า → ข้าวโพด)
  '2,2': 4,   // young_corn + young_corn → golden_rice
  '3,3': 5,   // ripe_corn + ripe_corn → brown_rice
  '4,4': 5,   // golden_rice + golden_rice → brown_rice
  '5,3': 6,   // brown_rice + ripe_corn → ice_cream
  '2,3': 6,   // young_corn + ripe_corn → ice_cream
  '1,2': 3,   // sprout + young_corn → ripe_corn
  '1,3': 5,   // sprout + ripe_corn → brown_rice
  '0,2': 3,   // seed + young_corn → ripe_corn
  '0,3': 5,   // seed + ripe_corn → brown_rice
};

let nextId = 0;

function randomType(): number {
  // สุ่มเมล็ด (0) หรือต้นกล้า (1) เป็นหลัก
  const rand = Math.random();
  if (rand < 0.7) return 0; // 70% seed
  if (rand < 0.95) return 1; // 25% sprout
  return 2; // 5% young_corn
}

function makeCell(type?: number): Cell {
  return type !== null && type !== undefined
    ? { type, id: nextId++ }
    : null;
}

function createGrid(): Grid {
  const grid: Grid = [];
  for (let r = 0; r < ROWS; r++) {
    grid[r] = [];
    for (let c = 0; c < COLS; c++) {
      // เริ่มต้นด้วย 70% มีเมล็ด, 30% ว่าง
      if (Math.random() < 0.7) {
        grid[r][c] = makeCell(randomType());
      } else {
        grid[r][c] = null;
      }
    }
  }
  return grid;
}

function isAdjacent(a: Pos, b: Pos): boolean {
  return (Math.abs(a.r - b.r) + Math.abs(a.c - b.c)) === 1;
}

function cloneGrid(grid: Grid): Grid {
  return grid.map(row => row.map(cell => cell ? { ...cell } : null));
}

function findConnected(grid: Grid, startR: number, startC: number, type: number): Set<string> {
  const visited = new Set<string>();
  const queue: Pos[] = [{ r: startR, c: startC }];
  
  while (queue.length > 0) {
    const { r, c } = queue.shift()!;
    const key = `${r},${c}`;
    if (visited.has(key)) continue;
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;
    const cell = grid[r][c];
    if (!cell || cell.type !== type) continue;
    
    visited.add(key);
    queue.push({ r: r - 1, c });
    queue.push({ r: r + 1, c });
    queue.push({ r, c: c - 1 });
    queue.push({ r, c: c + 1 });
  }
  
  return visited;
}

export default function MergeGame({ onComplete }: { onComplete: (correct: boolean) => void }) {
  const [grid, setGrid] = useState<Grid>(() => createGrid());
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<Pos | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState('');
  const processingRef = useRef(false);

  // ตรวจ game over — ไม่มีทาง merge แล้ว
  const checkGameOver = useCallback((g: Grid): boolean => {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = g[r][c];
        if (!cell) return false; // ยังมีช่องว่าง
        // เช็คว่ามีของเดียวกันอยู่ติดกันไหม
        const key = `${cell.type},${cell.type}`;
        if (MERGE_RULES[key] !== undefined) {
          // เช็ครอบข้าง
          if (r > 0 && g[r-1][c]?.type === cell.type) return false;
          if (r < ROWS-1 && g[r+1][c]?.type === cell.type) return false;
          if (c > 0 && g[r][c-1]?.type === cell.type) return false;
          if (c < COLS-1 && g[r][c+1]?.type === cell.type) return false;
        }
        // เช็คคู่อื่น
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (Math.abs(dr) + Math.abs(dc) !== 1) continue;
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
              const other = g[nr][nc];
              if (other) {
                const key2 = `${cell.type},${other.type}`;
                if (MERGE_RULES[key2] !== undefined) return false;
              }
            }
          }
        }
      }
    }
    return true;
  }, []);

  useEffect(() => {
    if (score >= 500) {
      setGameOver(true);
      setMessage(`ได้ ${score} แต้ม! ผ่าน!`);
      setTimeout(() => onComplete(true), 1500);
    }
  }, [score, onComplete]);

  const handleCellClick = useCallback((r: number, c: number) => {
    if (gameOver || processingRef.current) return;
    const cell = grid[r][c];

    if (!selected) {
      if (cell) {
        setSelected({ r, c });
      }
      return;
    }

    if (selected.r === r && selected.c === c) {
      setSelected(null);
      return;
    }

    if (!isAdjacent(selected, { r, c })) {
      if (cell) setSelected({ r, c });
      else setSelected(null);
      return;
    }

    const srcCell = grid[selected.r][selected.c];
    const dstCell = grid[r][c];

    // ถ้าช่องปลายทางว่าง → ย้าย
    if (!dstCell) {
      const newGrid = cloneGrid(grid);
      newGrid[r][c] = srcCell;
      newGrid[selected.r][selected.c] = null;
      setGrid(newGrid);
      setSelected(null);
      return;
    }

    // ถ้าช่องปลายทางมีของ → เช็ค merge
    if (!srcCell) return;

    const key = `${srcCell.type},${dstCell.type}`;
    const reverseKey = `${dstCell.type},${srcCell.type}`;
    const resultType = MERGE_RULES[key] ?? MERGE_RULES[reverseKey];

    if (resultType === undefined) {
      // merge ไม่ได้ → สลับที่
      const newGrid = cloneGrid(grid);
      newGrid[r][c] = srcCell;
      newGrid[selected.r][selected.c] = dstCell;
      setGrid(newGrid);
      setSelected(null);
      return;
    }

    // merge สำเร็จ!
    processingRef.current = true;
    const newGrid = cloneGrid(grid);
    
    // หา connected group ของ srcCell (รวมตัวเองด้วย)
    const connected = findConnected(newGrid, selected.r, selected.c, srcCell.type);
    const count = connected.size;
    
    // คำนวณคะแนน
    const points = count * 10 * (TYPES[dstCell.type].level + 1);
    const newScore = score + points;

    // ลบ group ทั้งหมด
    for (const key of connected) {
      const [cr, cc] = key.split(',').map(Number);
      newGrid[cr][cc] = null;
    }
    // ลบ dstCell ด้วย
    newGrid[r][c] = null;
    
    // วางผลลัพธ์ ณ ตำแหน่ง dstCell
    newGrid[r][c] = makeCell(resultType);

    setGrid(newGrid);
    setScore(newScore);
    setSelected(null);

    // เติมช่องว่าง
    setTimeout(() => {
      const filled = cloneGrid(newGrid);
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          if (!filled[row][col]) {
            filled[row][col] = makeCell(randomType());
          }
        }
      }
      setGrid(filled);
      
      if (checkGameOver(filled)) {
        setGameOver(true);
        setMessage(`เกมจบ! ได้ ${newScore} แต้ม`);
        setTimeout(() => onComplete(newScore >= 200), 2000);
      }
      processingRef.current = false;
    }, 300);
  }, [selected, grid, gameOver, score, checkGameOver, onComplete]);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)' }}>
            รวมเมล็ด
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            ลาก/คลิกเพื่อรวมเมล็ด
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

      {/* Progress bar */}
      <div style={{
        height: 6,
        background: 'var(--color-muted)',
        borderRadius: 3,
        marginBottom: 12,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${Math.min(100, (score / 500) * 100)}%`,
          background: score >= 500 ? 'var(--color-accent)' : 'var(--color-primary)',
          borderRadius: 3,
          transition: 'width 0.3s ease',
        }} />
      </div>

      {/* Grid 5x5 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${COLS}, 1fr)`,
        gap: 4,
        background: 'var(--color-muted)',
        padding: 4,
        borderRadius: 'var(--radius-md)',
      }}>
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const isSelected = selected?.r === r && selected?.c === c;
            const typeInfo = cell ? TYPES[cell.type] : null;

            return (
              <button
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                style={{
                  aspectRatio: '1',
                  border: isSelected ? '3px solid var(--color-primary)' : '2px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  background: isSelected ? '#F5F0FF' : 'var(--color-surface)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 4,
                  minHeight: 44,
                  boxShadow: isSelected ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                  overflow: 'hidden',
                }}
              >
                {cell && typeInfo && (
                  <img
                    src={typeInfo.img}
                    alt={typeInfo.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      pointerEvents: 'none',
                    }}
                  />
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Legend */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 8,
        marginTop: 12,
        padding: '8px',
        background: 'var(--color-muted)',
        borderRadius: 'var(--radius-md)',
      }}>
        {TYPES.map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
            <img src={t.img} alt={t.name} style={{ width: 20, height: 20, objectFit: 'contain' }} />
            {t.name}
          </div>
        ))}
      </div>

      {/* Game Over */}
      {gameOver && (
        <div className={score >= 500 ? 'msg-success' : 'msg-error'} style={{ marginTop: 16 }}>
          {message}
        </div>
      )}

      {/* Instructions */}
      {!gameOver && score === 0 && (
        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: 12 }}>
          คลิก 2 ช่องที่ติดกันเพื่อรวม — เมล็ด+เมล็ด=ต้นกล้า, ต้นกล้า+ต้นกล้า=ข้าวโพด, ข้าวโพด+ข้าวกล้อง=ไอศครีม
        </p>
      )}
    </div>
  );
}
