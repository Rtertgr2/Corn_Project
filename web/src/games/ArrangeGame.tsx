// web/src/games/ArrangeGame.tsx
// เกมจับคู่ข้าวโพดแนว Candy Crush — สลับตำแหน่งให้ได้ 3 ติดกัน
import { useState, useCallback, useEffect, useRef } from 'react';

type Cell = { type: number; id: number };
type Grid = (Cell | null)[][];
type Pos = { r: number; c: number };

const COLS = 6;
const ROWS = 6;
const TYPES = 5;
const MIN_MATCH = 3;
const MAX_MOVES = 20;
const SCORE_TARGET = 150;

// สีข้าวโพดแต่ละชนิด
const COLORS = [
  { bg: '#FBBF24', border: '#D97706', label: 'ข้าวโพดเหลือง' },
  { bg: '#34D399', border: '#059669', label: 'ข้าวโพดหวาน' },
  { bg: '#F87171', border: '#DC2626', label: 'ข้าวโพดแดง' },
  { bg: '#A78BFA', border: '#7C3AED', label: 'ข้าวโพดม่วง' },
  { bg: '#FB923C', border: '#EA580C', label: 'ข้าวโพดส้ม' },
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
  const [animating, setAnimating] = useState(false);
  const [matchedCells, setMatchedCells] = useState<Set<string>>(new Set());
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState('');
  const processingRef = useRef(false);

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

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '1rem', color: 'var(--color-foreground)' }}>
            จับคู่ข้าวโพด
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-muted-foreground)' }}>
            สลับตำแหน่งให้ได้ 3 ติดกัน
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.2rem', color: 'var(--color-primary)' }}>
            {score}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-muted-foreground)' }}>
            {moves} ตาเหลือ
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
          width: `${Math.min(100, (score / SCORE_TARGET) * 100)}%`,
          background: score >= SCORE_TARGET ? 'var(--color-accent)' : 'var(--color-primary)',
          borderRadius: 3,
          transition: 'width 0.3s ease',
        }} />
      </div>

      {/* Grid */}
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
                  border: isSelected ? '3px solid var(--color-primary)' : '2px solid transparent',
                  borderRadius: 'var(--radius-sm)',
                  background: cell ? color.bg : 'var(--color-card)',
                  cursor: animating ? 'default' : 'pointer',
                  transition: 'all 0.15s ease',
                  transform: isSelected ? 'scale(1.1)' : isMatched ? 'scale(0.8)' : 'scale(1)',
                  opacity: isMatched ? 0.3 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  minHeight: 44,
                  boxShadow: isSelected ? '0 0 0 2px rgba(124, 58, 237, 0.3)' : 'none',
                }}
              >
                {cell && (
                  <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                    {/* ใบข้าวโพดซ้าย */}
                    <path d="M10 8 Q6 4 8 1 Q10 4 12 7" fill="#4ADE80" stroke="#16A34A" strokeWidth="0.8"/>
                    {/* ใบข้าวโพดขวา */}
                    <path d="M22 8 Q26 4 24 1 Q22 4 20 7" fill="#4ADE80" stroke="#16A34A" strokeWidth="0.8"/>
                    {/* ฝักข้าวโพด */}
                    <ellipse cx="16" cy="18" rx="7" ry="10" fill={color.bg} stroke={color.border} strokeWidth="1.2"/>
                    {/* เมล็ดแถวซ้าย */}
                    <circle cx="12" cy="14" r="1.8" fill={color.border} opacity="0.5"/>
                    <circle cx="12" cy="18" r="1.8" fill={color.border} opacity="0.5"/>
                    <circle cx="12" cy="22" r="1.8" fill={color.border} opacity="0.5"/>
                    {/* เมล็ดแถวกลาง */}
                    <circle cx="16" cy="13" r="1.8" fill={color.border} opacity="0.5"/>
                    <circle cx="16" cy="17" r="1.8" fill={color.border} opacity="0.5"/>
                    <circle cx="16" cy="21" r="1.8" fill={color.border} opacity="0.5"/>
                    {/* เมล็ดแถวขวา */}
                    <circle cx="20" cy="14" r="1.8" fill={color.border} opacity="0.5"/>
                    <circle cx="20" cy="18" r="1.8" fill={color.border} opacity="0.5"/>
                    <circle cx="20" cy="22" r="1.8" fill={color.border} opacity="0.5"/>
                    {/* ปลายฝัก */}
                    <path d="M14 28 Q16 31 18 28" stroke={color.border} strokeWidth="1" fill="none" strokeLinecap="round"/>
                  </svg>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        {COLORS.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: 'var(--color-muted-foreground)' }}>
            <svg width="14" height="14" viewBox="0 0 32 32" fill="none">
              <path d="M10 8 Q6 4 8 1 Q10 4 12 7" fill="#4ADE80" stroke="#16A34A" strokeWidth="0.8"/>
              <path d="M22 8 Q26 4 24 1 Q22 4 20 7" fill="#4ADE80" stroke="#16A34A" strokeWidth="0.8"/>
              <ellipse cx="16" cy="18" rx="7" ry="10" fill={c.bg} stroke={c.border} strokeWidth="1.2"/>
              <circle cx="14" cy="16" r="1.5" fill={c.border} opacity="0.5"/>
              <circle cx="18" cy="16" r="1.5" fill={c.border} opacity="0.5"/>
              <circle cx="16" cy="20" r="1.5" fill={c.border} opacity="0.5"/>
            </svg>
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
        <p style={{ fontSize: '0.8rem', color: 'var(--color-muted-foreground)', textAlign: 'center', marginTop: 12 }}>
          คลิก 2 ช่องที่อยู่ติดกันเพื่อสลับตำแหน่ง ให้ได้สีเดียวกัน 3 ตัวขึ้นไป
        </p>
      )}
    </div>
  );
}
