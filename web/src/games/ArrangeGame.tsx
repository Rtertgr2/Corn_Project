// web/src/games/ArrangeGame.tsx
// เกมจับคู่ข้าวโพดแนว Candy Crush — สลับตำแหน่งให้ได้ 3 ติดกัน
import { useState, useCallback, useEffect, useRef } from 'react';

type Cell = { type: number; id: number };
type Grid = (Cell | null)[][];
type Pos = { r: number; c: number };

const COLS = 5;
const ROWS = 5;
const TYPES = 5;
const MIN_MATCH = 3;
const MAX_MOVES = 20;
const SCORE_TARGET = 150;
const TIME_LIMIT = 60; // 60 วินาที

// สีข้าวโพดแต่ละชนิด (fill = พื้นหลังช่อง, filter = ปรับสีตัว 🌽)
const COLORS = [
  { fill: '#FBBF24', stroke: '#D97706', filter: 'none', label: 'ข้าวโพดเหลือง' },
  { fill: '#34D399', stroke: '#059669', filter: 'hue-rotate(60deg) saturate(1.4)', label: 'ข้าวโพดหวาน' },
  { fill: '#F87171', stroke: '#DC2626', filter: 'hue-rotate(-45deg) saturate(1.5)', label: 'ข้าวโพดแดง' },
  { fill: '#A78BFA', stroke: '#7C3AED', filter: 'hue-rotate(180deg) saturate(1.2)', label: 'ข้าวโพดม่วง' },
  { fill: '#FB923C', stroke: '#EA580C', filter: 'hue-rotate(-25deg) saturate(1.6)', label: 'ข้าวโพดส้ม' },
];

let nextId = 0;
function makeCell(type?: number): Cell {
  return { type: type ?? Math.floor(Math.random() * TYPES), id: nextId++ };
}

function createGrid(): Grid {
  const grid: Grid = [];
  for (let r = 0; r < ROWS; r++) {
    grid[r] = [];
    for (let c = 0; c < COLS; c++) {
      grid[r][c] = makeCell();
    }
  }
  // ลบ match เริ่มต้น
  let hasMatch = true;
  while (hasMatch) {
    hasMatch = false;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = grid[r][c];
        if (!cell) continue;
        // แนวนอน
        if (c >= 2 && grid[r][c - 1]?.type === cell.type && grid[r][c - 2]?.type === cell.type) {
          grid[r][c] = makeCell();
          hasMatch = true;
        }
        // แนวตั้ง
        if (r >= 2 && grid[r - 1]?.[c]?.type === cell.type && grid[r - 2]?.[c]?.type === cell.type) {
          grid[r][c] = makeCell();
          hasMatch = true;
        }
      }
    }
  }
  return grid;
}

function findMatches(grid: Grid): Set<string> {
  const matched = new Set<string>();
  // แนวนอน
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - MIN_MATCH; c++) {
      const cell = grid[r][c];
      if (!cell) continue;
      let len = 1;
      while (c + len < COLS && grid[r][c + len]?.type === cell.type) len++;
      if (len >= MIN_MATCH) {
        for (let i = 0; i < len; i++) matched.add(`${r},${c + i}`);
      }
    }
  }
  // แนวตั้ง
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - MIN_MATCH; r++) {
      const cell = grid[r][c];
      if (!cell) continue;
      let len = 1;
      while (r + len < ROWS && grid[r + len]?.[c]?.type === cell.type) len++;
      if (len >= MIN_MATCH) {
        for (let i = 0; i < len; i++) matched.add(`${r + i},${c}`);
      }
    }
  }
  return matched;
}

function applyGravity(grid: Grid): Grid {
  const newGrid: Grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  for (let c = 0; c < COLS; c++) {
    let writeRow = ROWS - 1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (grid[r][c]) {
        newGrid[writeRow][c] = grid[r][c];
        writeRow--;
      }
    }
    for (let r = writeRow; r >= 0; r--) {
      newGrid[r][c] = makeCell();
    }
  }
  return newGrid;
}

function isAdjacent(a: Pos, b: Pos): boolean {
  return (Math.abs(a.r - b.r) + Math.abs(a.c - b.c)) === 1;
}

function cloneGrid(grid: Grid): Grid {
  return grid.map(row => row.map(cell => cell ? { ...cell } : null));
}

export default function ArrangeGame({ onComplete }: { onComplete: (correct: boolean) => void }) {
  const [grid, setGrid] = useState<Grid>(() => createGrid());
  const [selected, setSelected] = useState<Pos | null>(null);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(MAX_MOVES);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [animating, setAnimating] = useState(false);
  const [matchedCells, setMatchedCells] = useState<Set<string>>(new Set());
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState('');
  const processingRef = useRef(false);

  // Timer
  useEffect(() => {
    if (gameOver || animating) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameOver(true);
          setMessage('หมดเวลา!');
          setTimeout(() => onComplete(false), 1500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameOver, animating, onComplete]);

  const processMatches = useCallback((currentGrid: Grid, currentScore: number, depth: number = 0): { grid: Grid; score: number } => {
    const matches = findMatches(currentGrid);
    if (matches.size === 0) return { grid: currentGrid, score: currentScore };

    const points = matches.size * 10 * (depth + 1); // combo bonus
    const newScore = currentScore + points;

    // ลบ matched cells
    const g = cloneGrid(currentGrid);
    for (const key of matches) {
      const [r, c] = key.split(',').map(Number);
      g[r][c] = null;
    }

    // gravity + fill
    const filled = applyGravity(g);

    // ตรวจ combo
    return processMatches(filled, newScore, depth + 1);
  }, []);

  const handleCellClick = useCallback((r: number, c: number) => {
    if (animating || gameOver || processingRef.current) return;

    if (!selected) {
      setSelected({ r, c });
      return;
    }

    if (selected.r === r && selected.c === c) {
      setSelected(null);
      return;
    }

    if (!isAdjacent(selected, { r, c })) {
      setSelected({ r, c });
      return;
    }

    // swap
    processingRef.current = true;
    const newGrid = cloneGrid(grid);
    const temp = newGrid[selected.r][selected.c];
    newGrid[selected.r][selected.c] = newGrid[r][c];
    newGrid[r][c] = temp;

    // ตรวจ match
    const matches = findMatches(newGrid);
    if (matches.size === 0) {
      // ไม่มี match → swap กลับ
      processingRef.current = false;
      setSelected(null);
      return;
    }

    // มี match → ดำเนินการ
    setGrid(newGrid);
    setSelected(null);
    setMoves(m => m - 1);
    setAnimating(true);

    setTimeout(() => {
      const result = processMatches(newGrid, score);
      setGrid(result.grid);
      setScore(result.score);
      setAnimating(false);
      setMatchedCells(new Set());

      // ตรวจ game over
      const newMoves = moves - 1;
      if (newMoves <= 0 || result.score >= SCORE_TARGET) {
        setGameOver(true);
        const success = result.score >= SCORE_TARGET;
        setMessage(success ? `ได้ ${result.score} แต้ม! ผ่าน!` : `ได้ ${result.score} แต้ม ไม่ถึง ${SCORE_TARGET}`);
        setTimeout(() => onComplete(success), 1500);
      }

      processingRef.current = false;
    }, 300);
  }, [selected, grid, score, moves, animating, gameOver, processMatches, onComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '1rem', color: 'var(--color-text)' }}>
            จับคู่ข้าวโพด
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            สลับตำแหน่งให้ได้ 3 ติดกัน
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.2rem', color: 'var(--color-primary)' }}>
            {score}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            {moves} ตาเหลือ
          </p>
        </div>
      </div>

      {/* Timer + Progress */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
        {/* Timer */}
        <div style={{
          background: timeLeft <= 10 ? 'var(--color-danger)' : 'var(--color-muted)',
          color: timeLeft <= 10 ? '#fff' : 'var(--color-text)',
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
        {/* Progress bar */}
        <div style={{
          flex: 1,
          height: 6,
          background: 'var(--color-muted)',
          borderRadius: 3,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${Math.min(100, (score / SCORE_TARGET) * 100)}%`,
            background: score >= SCORE_TARGET ? 'var(--color-accent)' : 'var(--color-primary)',
            borderRadius: 3,
            transition: 'width 0.3s ease',
          }} />
        </div>
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
            const isMatched = matchedCells.has(`${r},${c}`);
            const color = cell ? COLORS[cell.type] : COLORS[0];

            return (
              <button
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                disabled={animating || gameOver}
                style={{
                  aspectRatio: '1',
                  border: isSelected ? '3px solid var(--color-primary)' : '2px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  background: cell ? color.fill : 'var(--color-surface)',
                  cursor: animating ? 'default' : 'pointer',
                  transition: 'all 0.15s ease',
                  transform: isSelected ? 'scale(1.1)' : isMatched ? 'scale(0.8)' : 'scale(1)',
                  opacity: isMatched ? 0.3 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  minHeight: 44,
                  boxShadow: isSelected ? '0 0 0 2px rgba(124, 58, 237, 0.3)' : 'var(--shadow-sm)',
                }}
              >
                {cell && (
                  <span style={{ fontSize: '1.8rem', lineHeight: 1, filter: color.filter }}>🌽</span>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        {COLORS.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
            <span style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 24,
              background: c.fill,
              border: '1px solid var(--color-border)',
              fontSize: '0.9rem',
              filter: c.filter,
            }}>🌽</span>
            {c.label}
          </div>
        ))}
      </div>

      {/* Game Over */}
      {gameOver && (
        <div className={score >= SCORE_TARGET ? 'msg-success' : 'msg-error'} style={{ marginTop: 16 }}>
          {message}
        </div>
      )}

      {/* Instructions */}
      {!gameOver && moves === MAX_MOVES && (
        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: 12 }}>
          คลิก 2 ช่องที่อยู่ติดกันเพื่อสลับตำแหน่ง ให้ได้สีเดียวกัน 3 ตัวขึ้นไป
        </p>
      )}
    </div>
  );
}
