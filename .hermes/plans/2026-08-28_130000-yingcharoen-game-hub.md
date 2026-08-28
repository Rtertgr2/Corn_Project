# เกมรวมตลาดยิ่งเจริญ (v1) — Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** สร้างเว็บแอปมือถือ (React+TS+Vite) ที่ให้ลูกค้ากรอกเบอร์ → เล่นมินิเกมวันละครั้ง → ได้ 1 แต้ม → สะสมและแลกคูปองในแอป โดยมี backend Express + PostgreSQL (รันผ่าน docker-compose)

**Architecture:** Monorepo npm-workspaces แบ่ง `server/` (Express REST + `pg` + vitest) และ `web/` (React SPA + Vite). เกมรวมจัดเป็น registry (แต่ละเกม = component + `game_id`); เลือกเกมวันละอันแบบ deterministic จาก hash(เบอร์+วันBKK) ฝั่ง server. แต้มคำนวณสดจาก `plays` หัก `redemptions`. Postgres รันใน docker-compose มี volume ถาวร.

**Tech Stack:** Node 26, TypeScript, Express 4, `pg`, vitest, React 18, react-router-dom 6, Vite 5, @testing-library/react, Docker/PostgreSQL 16.

**Spec อ้างอิง:** `docs/brainstorming/specs/2026-08-28-yingcharoen-game-hub-design.md`

---

## สภาพแวดล้อมที่ต้องมี (Assumptions)
- Node v26.7.0, Docker 29.7.2 ติดตั้งแล้ว (ยืนยันจากการสำรวจ)
- ไม่มี psql CLI ในเครื่อง — Postgres จะรันใน docker เท่านั้น (ใช้ `docker compose exec` เพื่อดู DB ถ้าจำเป็น)
- Repo อยู่ที่ `/run/media/teerametr/D1/Project/Corn_Project` (มี git init แล้ว, ว่างเปล่าของโค้ด)
- ผู้ใช้กำลังเรียน React+TS — โค้ดหน้าเว็บเขียนอธิบายทีละไฟล์ คอมเมนต์ภาษาไทย

---

## Task 1: สร้างโครงสร้าง repo + docker-compose

**Objective:** เตรียม monorepo workspace, .gitignore, และ Postgres ใน docker

**Files:**
- Create: `package.json` (root)
- Create: `.gitignore`
- Create: `docker-compose.yml`
- Create: `README.md`

**Step 1: Root package.json (workspaces)**
```json
{
  "name": "corn-project",
  "private": true,
  "version": "1.0.0",
  "workspaces": ["server", "web"],
  "scripts": {
    "dev": "npm-run-all --parallel dev:server dev:web",
    "dev:server": "npm --workspace server run dev",
    "dev:web": "npm --workspace web run dev",
    "test": "npm --workspace server run test && npm --workspace web run test",
    "up": "docker compose up -d",
    "down": "docker compose down"
  },
  "devDependencies": {
    "npm-run-all": "^4.1.5"
  }
}
```

**Step 2: .gitignore**
```
node_modules/
dist/
*.log
.env
.DS_Store
```

**Step 3: docker-compose.yml (Postgres + volume ถาวร)**
```yaml
services:
  postgres:
    image: postgres:16
    container_name: corn_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: corn
    ports:
      - "5432:5432"
    volumes:
      - corn_pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d corn"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  corn_pgdata:
```

**Step 4: README.md (สั้นๆ อธิบายการรัน)**
```markdown
# เกมรวมตลาดยิ่งเจริญ (Yingcharoen Game Hub)

เว็บแอปมือถือ: ลูกค้ากรอกเบอร์ → เล่นมินิเกมวันละครั้ง → ได้แต้ม → แลกคูปอง

## เริ่มรัน
1. `npm install` (ติดตั้ง workspace ทั้งหมด)
2. `npm run up` (รัน PostgreSQL ใน docker)
3. `npm run dev` (รัน server :3000 + web :5173)
4. เปิด http://localhost:5173 บน mobile viewport / สแกน QR

## โครงสร้าง
- `server/` — Express API + PostgreSQL
- `web/` — React SPA (Vite)
```

**Step 5: สร้างโฟลเดอร์ว่างให้ workspace หาเจอ**
```bash
mkdir -p server/src server/tests server/migrations web/src web/tests
```
(ไฟล์จริงจะสร้างใน Task ถัดไป)

**Step 6: Commit**
```bash
git add package.json .gitignore docker-compose.yml README.md
git commit -m "chore: scaffold monorepo + postgres docker-compose"
```

---

## Task 2: ติดตั้ง dependency ของ server

**Objective:** เตรียม package.json + tsconfig ของ server

**Files:**
- Create: `server/package.json`
- Create: `server/tsconfig.json`

**Step 1: server/package.json**
```json
{
  "name": "server",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "tsx src/index.ts",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.19.2",
    "pg": "^8.12.0"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/node": "^20.14.0",
    "@types/pg": "^8.11.6",
    "tsx": "^4.16.0",
    "typescript": "^5.5.0",
    "vitest": "^2.0.0"
  }
}
```

**Step 2: server/tsconfig.json**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "types": ["node"],
    "outDir": "dist"
  },
  "include": ["src", "tests"]
}
```

**Step 3: ติดตั้ง**
```bash
npm install
```
Expected: ติดตั้ง workspace server + web (web ยังไม่มี package.json — ข้ามไปก่อน หรือสร้าง web/package.json ว่างก่อน; แนะนำสร้าง web/package.json ใน Task 11 ก่อนรันรวม)

**Step 4: Commit**
```bash
git add server/package.json server/tsconfig.json package-lock.json
git commit -m "chore: add server deps + tsconfig"
```

---

## Task 3: util.ts — ตรวจเบอร์ + hashCode (พร้อม TDD)

**Objective:** ฟังก์ชันช่วย: ตรวจรูปเบอร์โทร และ hash สตริง deterministic

**Files:**
- Create: `server/src/util.ts`
- Create: `server/tests/util.test.ts`

**Step 1: เขียน failing test**
```ts
// server/tests/util.test.ts
import { describe, it, expect } from 'vitest';
import { validatePhone, hashCode } from '../src/util.ts';

describe('validatePhone', () => {
  it('accepts 10-digit Thai mobile', () => {
    expect(validatePhone('0812345678')).toBe(true);
  });
  it('rejects too short', () => {
    expect(validatePhone('08123')).toBe(false);
  });
  it('rejects non-digits', () => {
    expect(validatePhone('08a2345678')).toBe(false);
  });
  it('accepts 9-digit', () => {
    expect(validatePhone('812345678')).toBe(true);
  });
});

describe('hashCode', () => {
  it('is deterministic and non-negative', () => {
    expect(hashCode('0812345678|2026-08-28')).toBe(hashCode('0812345678|2026-08-28'));
    expect(hashCode('x')).toBeGreaterThanOrEqual(0);
  });
});
```

**Step 2: รันดู fail**
```bash
cd server && npx vitest run tests/util.test.ts
```
Expected: FAIL — module `../src/util.ts` ไม่มี

**Step 3: เขียน implementation**
```ts
// server/src/util.ts
/** ตรวจเบอร์โทรไทย 9-10 หลัก ตัวเลขล้วน */
export function validatePhone(phone: string): boolean {
  return /^\d{9,10}$/.test(phone.trim());
}

/** hash สตริงแบบ deterministic คืนค่า non-negative int (ใช้เลือกเกมวันละอัน) */
export function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return h >>> 0; // ทำให้เป็น unsigned
}
```

**Step 4: รันดู pass**
```bash
npx vitest run tests/util.test.ts
```
Expected: PASS (4 tests)

**Step 5: Commit**
```bash
git add server/src/util.ts server/tests/util.test.ts
git commit -m "feat(server): add validatePhone + hashCode utils"
```

---

## Task 4: daily.ts — วันที่ BKK + เลือกเกมวันละอัน (TDD)

**Objective:** คำนวณวันที่ตาม Asia/Bangkok และสุ่มเลือกเกมแบบเสถียรตลอดวัน

**Files:**
- Create: `server/src/daily.ts`
- Create: `server/tests/daily.test.ts`

**Step 1: เขียน failing test**
```ts
// server/tests/daily.test.ts
import { describe, it, expect } from 'vitest';
import { dateBKK, hashDailyGame } from '../src/daily.ts';

describe('dateBKK', () => {
  it('returns YYYY-MM-DD in Asia/Bangkok for a fixed UTC time', () => {
    // 2026-08-28T20:00:00Z = 2026-08-29T03:00 in BKK
    const d = new Date('2026-08-28T20:00:00Z');
    expect(dateBKK(d)).toBe('2026-08-29');
  });
});

describe('hashDailyGame', () => {
  const games = ['quiz', 'arrange'] as const;
  it('is stable within the same day', () => {
    const a = hashDailyGame('0812345678', '2026-08-28', games);
    const b = hashDailyGame('0812345678', '2026-08-28', games);
    expect(a).toBe(b);
    expect(games).toContain(a);
  });
  it('can differ across days', () => {
    const a = hashDailyGame('0812345678', '2026-08-28', games);
    const b = hashDailyGame('0812345678', '2026-08-29', games);
    // ไม่รับประกันต่างเสมอ แต่ต้องอยู่ในชุด
    expect(games).toContain(b);
  });
  it('varies by phone', () => {
    const a = hashDailyGame('0812345678', '2026-08-28', games);
    const b = hashDailyGame('0899999999', '2026-08-28', games);
    expect(games).toContain(a);
    expect(games).toContain(b);
  });
});
```

**Step 2: รันดู fail**
```bash
npx vitest run tests/daily.test.ts
```
Expected: FAIL — module ไม่มี

**Step 3: เขียน implementation**
```ts
// server/src/daily.ts
import { hashCode } from './util.ts';

/** คืนวันที่ YYYY-MM-DD ตามเขตเวลา Asia/Bangkok */
export function dateBKK(now: Date = new Date()): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(now); // en-CA => YYYY-MM-DD
}

/**
 * เลือก game_id วันละอันแบบ deterministic จากเบอร์ + วัน
 * ทำให้เกมเดียวตลอดวัน แม้รีเฟรช (ไม่ต้องเก็บสถานะเพิ่ม)
 */
export function hashDailyGame(
  phone: string,
  dateStr: string,
  gameIds: readonly string[],
): string {
  const idx = hashCode(`${phone}|${dateStr}`) % gameIds.length;
  return gameIds[idx];
}
```

**Step 4: รันดู pass**
```bash
npx vitest run tests/daily.test.ts
```
Expected: PASS

**Step 5: Commit**
```bash
git add server/src/daily.ts server/tests/daily.test.ts
git commit -m "feat(server): add BKK date + deterministic daily game picker"
```

---

## Task 5: points.ts — คำนวณยอดแต้ม + สร้างรหัสคูปอง (TDD)

**Objective:** แยก logic บริสุทธิ์: คำนวณยอดจากแถว DB และสร้างรหัสคูปอง

**Files:**
- Create: `server/src/points.ts`
- Create: `server/tests/points.test.ts`

**Step 1: เขียน failing test**
```ts
// server/tests/points.test.ts
import { describe, it, expect } from 'vitest';
import { computeBalanceFromRows, generateCouponCode, COUPON_PREFIX } from '../src/points.ts';

describe('computeBalanceFromRows', () => {
  it('sums plays minus redemptions', () => {
    const plays = [{ points_awarded: 1 }, { points_awarded: 1 }, { points_awarded: 1 }];
    const reds = [{ cost_points: 10 }, { cost_points: 5 }];
    expect(computeBalanceFromRows(plays, reds)).toBe(3 - 15); // -12
  });
  it('is 0 when empty', () => {
    expect(computeBalanceFromRows([], [])).toBe(0);
  });
});

describe('generateCouponCode', () => {
  it('starts with prefix and is 10 chars, uppercased, unique-ish', () => {
    const a = generateCouponCode();
    const b = generateCouponCode();
    expect(a.startsWith(COUPON_PREFIX)).toBe(true);
    expect(a.length).toBe(10);
    expect(a).toBe(a.toUpperCase());
    expect(a).not.toBe(b); // สุ่มต่างกันแทบแน่นอน
  });
});
```

**Step 2: รันดู fail**
```bash
npx vitest run tests/points.test.ts
```
Expected: FAIL

**Step 3: เขียน implementation**
```ts
// server/src/points.ts
export const COUPON_PREFIX = 'YJ'; // Yingcharoen

/** ยอดแต้ม = รวมที่ได้ - รวมที่แลก (คำนวณสด ไม่มี ledger แยก) */
export function computeBalanceFromRows(
  plays: { points_awarded: number }[],
  redemptions: { cost_points: number }[],
): number {
  const earned = plays.reduce((s, p) => s + p.points_awarded, 0);
  const spent = redemptions.reduce((s, r) => s + r.cost_points, 0);
  return earned - spent;
}

/** สร้างรหัสคูปอง เช่น YJ-7F3K9Q2X (prefix + base36 8 ตัว) */
export function generateCouponCode(): string {
  const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
  const padded = (rand + '00000000').slice(0, 8);
  return `${COUPON_PREFIX}-${padded}`;
}
```

> หมายเหตุ: `generateCouponCode` เป็น pure-random; ความ unique จริงจะตรวจซ้ำใน route `/api/redeem` ผ่าน DB `UNIQUE(coupon_code)` + retry.

**Step 4: รันดู pass**
```bash
npx vitest run tests/points.test.ts
```
Expected: PASS

**Step 5: Commit**
```bash
git add server/src/points.ts server/tests/points.test.ts
git commit -m "feat(server): add balance + coupon code logic"
```

---

## Task 6: db.ts + migration 01 (schema + seed)

**Objective:** เชื่อม Postgres ด้วย pg pool และรัน migration สร้างตาราง + seed ของรางวัล

**Files:**
- Create: `server/src/db.ts`
- Create: `server/migrations/01_init.sql`

**Step 1: server/src/db.ts**
```ts
// server/src/db.ts
import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const pool = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL ??
    'postgres://postgres:postgres@localhost:5432/corn',
});

/** รันไฟล์ SQL ใน migrations/ ตามลำดับ ครั้งเดียว (ติดตามใน _migrations) */
export async function runMigrations(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  const dir = path.join(__dirname, '..', 'migrations');
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  for (const file of files) {
    const { rows } = await pool.query(
      'SELECT 1 FROM _migrations WHERE name = $1',
      [file],
    );
    if (rows.length > 0) continue;
    const sql = fs.readFileSync(path.join(dir, file), 'utf8');
    await pool.query(sql);
    await pool.query('INSERT INTO _migrations(name) VALUES ($1)', [file]);
    console.log(`[migrate] applied ${file}`);
  }
}
```

**Step 2: server/migrations/01_init.sql**
```sql
CREATE TABLE IF NOT EXISTS players (
  id SERIAL PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS plays (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id),
  game_id TEXT NOT NULL,
  played_on DATE NOT NULL,
  points_awarded INTEGER NOT NULL DEFAULT 1,
  correct BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (player_id, played_on)
);

CREATE TABLE IF NOT EXISTS rewards (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  cost_points INTEGER NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS redemptions (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id),
  reward_id INTEGER NOT NULL REFERENCES rewards(id),
  coupon_code TEXT UNIQUE NOT NULL,
  cost_points INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO rewards (name, description, cost_points)
SELECT 'ถุงผ้าตลาดยิ่งเจริญ', 'ถุงผ้าผ้าแคนวาส พิมพ์ลายตลาด', 10
WHERE NOT EXISTS (SELECT 1 FROM rewards WHERE name = 'ถุงผ้าตลาดยิ่งเจริญ');

INSERT INTO rewards (name, description, cost_points)
SELECT 'คูปองส่วนลดค่าเดินทาง', 'ส่วนลด 20 บาท สำหรับร้านในตลาด', 20
WHERE NOT EXISTS (SELECT 1 FROM rewards WHERE name = 'คูปองส่วนลดค่าเดินทาง');

INSERT INTO rewards (name, description, cost_points)
SELECT 'คูปองร้านค้าพิเศษ', 'คูปองมูลค่า 50 บาท ใช้กับร้านร่วมรายการ', 30
WHERE NOT EXISTS (SELECT 1 FROM rewards WHERE name = 'คูปองร้านค้าพิเศษ');
```

**Step 3: เริ่ม Postgres แล้วทดสอบ migrate (manual)**
```bash
npm run up
cd server && npx tsx -e "import('./src/db.ts').then(m=>m.runMigrations().then(()=>process.exit(0)))"
```
Expected: พิมพ์ `[migrate] applied 01_init.sql` แล้วจบ

**Step 4: Commit**
```bash
git add server/src/db.ts server/migrations/01_init.sql
git commit -m "feat(server): postgres pool + init migration with reward seeds"
```

---

## Task 7: games.ts — รายชื่อ game_id

**Objective:** กำหนดชุด game_id ที่ server รองรับ (ต้องตรงกับ web registry)

**Files:**
- Create: `server/src/games.ts`

**Step 1: เขียนไฟล์**
```ts
// server/src/games.ts
export const GAME_IDS = ['quiz', 'arrange'] as const;
export type GameId = (typeof GAME_IDS)[number];

/** ตรวจว่า game_id อยู่ในชุดที่รองรับ */
export function isValidGameId(id: string): id is GameId {
  return (GAME_IDS as readonly string[]).includes(id);
}
```

**Step 2: Commit**
```bash
git add server/src/games.ts
git commit -m "feat(server): define supported game ids"
```

---

## Task 8: routes/player.ts — ลงทะเบียน + โปรไฟล์

**Objective:** endpoint กรอกเบอร์เริ่มเกม และดูโปรไฟล์/ยอดแต้ม

**Files:**
- Create: `server/src/routes/player.ts`

**Step 1: เขียน router**
```ts
// server/src/routes/player.ts
import { Router } from 'express';
import { pool } from '../db.ts';
import { validatePhone } from '../util.ts';
import { dateBKK, hashDailyGame } from '../daily.ts';
import { computeBalanceFromRows } from '../points.ts';
import { GAME_IDS } from '../games.ts';

export const playerRouter = Router();

// POST /api/start  { phone }
playerRouter.post('/start', async (req, res) => {
  const phone = String(req.body?.phone ?? '').trim();
  if (!validatePhone(phone)) {
    return res.status(400).json({ error: 'เบอร์โทรไม่ถูกต้อง (ต้องเป็นตัวเลข 9-10 หลัก)' });
  }
  const today = dateBKK();
  const { rows: p } = await pool.query(
    `INSERT INTO players (phone) VALUES ($1)
     ON CONFLICT (phone) DO UPDATE SET phone = EXCLUDED.phone
     RETURNING id`,
    [phone],
  );
  const playerId = p[0].id;

  const { rows: todayPlays } = await pool.query(
    'SELECT game_id, correct FROM plays WHERE player_id=$1 AND played_on=$2',
    [playerId, today],
  );
  const playedToday = todayPlays.length > 0;
  const todayGame = playedToday ? todayPlays[0].game_id : hashDailyGame(phone, today, GAME_IDS);

  const { rows: plays } = await pool.query('SELECT points_awarded FROM plays WHERE player_id=$1', [playerId]);
  const { rows: reds } = await pool.query('SELECT cost_points FROM redemptions WHERE player_id=$1', [playerId]);
  const balance = computeBalanceFromRows(plays, reds);

  res.json({
    balance,
    todayPlayed: playedToday,
    todayGame,
    todayCorrect: playedToday ? todayPlays[0].correct : null,
  });
});

// GET /api/me?phone=xxx
playerRouter.get('/me', async (req, res) => {
  const phone = String(req.query.phone ?? '').trim();
  if (!validatePhone(phone)) return res.status(400).json({ error: 'เบอร์โทรไม่ถูกต้อง' });
  const { rows: p } = await pool.query('SELECT id FROM players WHERE phone=$1', [phone]);
  if (p.length === 0) return res.json({ balance: 0, history: [], redemptions: [] });
  const playerId = p[0].id;

  const { rows: plays } = await pool.query(
    'SELECT game_id, played_on, points_awarded, correct FROM plays WHERE player_id=$1 ORDER BY played_on DESC',
    [playerId],
  );
  const { rows: reds } = await pool.query(
    `SELECT r.coupon_code, rw.name, rd.cost_points, rd.created_at
     FROM redemptions rd JOIN rewards rw ON rw.id = rd.reward_id
     WHERE rd.player_id=$1 ORDER BY rd.created_at DESC`,
    [playerId],
  );
  const balance = computeBalanceFromRows(plays, reds);
  res.json({ balance, history: plays, redemptions: reds });
});
```

**Step 2: Commit**
```bash
git add server/src/routes/player.ts
git commit -m "feat(server): player start + me routes"
```

---

## Task 9: routes/play.ts — เล่นเกมวันละครั้ง

**Objective:** บันทึกการเล่นวันละครั้ง ได้ 1 แต้ม และกันซ้ำ

**Files:**
- Create: `server/src/routes/play.ts`

**Step 1: เขียน router**
```ts
// server/src/routes/play.ts
import { Router } from 'express';
import { pool } from '../db.ts';
import { validatePhone } from '../util.ts';
import { dateBKK, hashDailyGame } from '../daily.ts';
import { computeBalanceFromRows } from '../points.ts';
import { isValidGameId, GAME_IDS } from '../games.ts';

export const playRouter = Router();

// POST /api/play  { phone, game_id, correct }
playRouter.post('/play', async (req, res) => {
  const phone = String(req.body?.phone ?? '').trim();
  const gameId = String(req.body?.game_id ?? '');
  const correct = Boolean(req.body?.correct);

  if (!validatePhone(phone)) return res.status(400).json({ error: 'เบอร์โทรไม่ถูกต้อง' });
  if (!isValidGameId(gameId)) return res.status(400).json({ error: 'game_id ไม่รู้จัก' });

  const today = dateBKK();
  const expected = hashDailyGame(phone, today, GAME_IDS);
  if (gameId !== expected) {
    return res.status(400).json({ error: 'เกมวันนี้ไม่ตรงกับที่กำหนด' });
  }

  const { rows: p } = await pool.query('SELECT id FROM players WHERE phone=$1', [phone]);
  if (p.length === 0) return res.status(400).json({ error: 'กรุณากรอกเบอร์ก่อนเล่น' });
  const playerId = p[0].id;

  const { rows: existing } = await pool.query(
    'SELECT 1 FROM plays WHERE player_id=$1 AND played_on=$2',
    [playerId, today],
  );
  if (existing.length > 0) {
    return res.status(409).json({ error: 'วันนี้เล่นแล้ว รอพรุ่งนี้ครับ', alreadyPlayed: true });
  }

  try {
    await pool.query(
      'INSERT INTO plays (player_id, game_id, played_on, points_awarded, correct) VALUES ($1,$2,$3,1,$4)',
      [playerId, gameId, today, correct],
    );
  } catch (e: any) {
    if (e?.code === '23505') {
      return res.status(409).json({ error: 'วันนี้เล่นแล้ว รอพรุ่งนี้ครับ', alreadyPlayed: true });
    }
    throw e;
  }

  const { rows: plays } = await pool.query('SELECT points_awarded FROM plays WHERE player_id=$1', [playerId]);
  const { rows: reds } = await pool.query('SELECT cost_points FROM redemptions WHERE player_id=$1', [playerId]);
  const balance = computeBalanceFromRows(plays, reds);

  res.json({ correct, pointsAwarded: 1, balance, todayPlayed: true });
});
```

**Step 2: Commit**
```bash
git add server/src/routes/play.ts
git commit -m "feat(server): play route with daily 1-point guard"
```

---

## Task 10: routes/rewards.ts — รายการของรางวัล + แลกคูปอง

**Objective:** ดึงรายการรางวัล และกดแลกสร้างโค้ดคูปองหักแต้ม

**Files:**
- Create: `server/src/routes/rewards.ts`

**Step 1: เขียน router**
```ts
// server/src/routes/rewards.ts
import { Router } from 'express';
import { pool } from '../db.ts';
import { validatePhone } from '../util.ts';
import { computeBalanceFromRows, generateCouponCode } from '../points.ts';

export const rewardsRouter = Router();

// GET /api/rewards?phone=xxx
rewardsRouter.get('/rewards', async (req, res) => {
  const phone = String(req.query.phone ?? '').trim();
  if (!validatePhone(phone)) return res.status(400).json({ error: 'เบอร์โทรไม่ถูกต้อง' });

  const { rows: rewards } = await pool.query(
    'SELECT id, name, description, cost_points FROM rewards WHERE active=true ORDER BY cost_points',
  );
  let balance = 0;
  const { rows: p } = await pool.query('SELECT id FROM players WHERE phone=$1', [phone]);
  if (p.length > 0) {
    const playerId = p[0].id;
    const { rows: plays } = await pool.query('SELECT points_awarded FROM plays WHERE player_id=$1', [playerId]);
    const { rows: reds } = await pool.query('SELECT cost_points FROM redemptions WHERE player_id=$1', [playerId]);
    balance = computeBalanceFromRows(plays, reds);
  }
  res.json({
    balance,
    rewards: rewards.map((r) => ({ ...r, canAfford: balance >= r.cost_points })),
  });
});

// POST /api/redeem  { phone, reward_id }
rewardsRouter.post('/redeem', async (req, res) => {
  const phone = String(req.body?.phone ?? '').trim();
  const rewardId = Number(req.body?.reward_id);
  if (!validatePhone(phone)) return res.status(400).json({ error: 'เบอร์โทรไม่ถูกต้อง' });
  if (!Number.isInteger(rewardId)) return res.status(400).json({ error: 'reward_id ไม่ถูกต้อง' });

  const { rows: p } = await pool.query('SELECT id FROM players WHERE phone=$1', [phone]);
  if (p.length === 0) return res.status(400).json({ error: 'กรุณากรอกเบอร์ก่อนแลก' });
  const playerId = p[0].id;

  const { rows: rw } = await pool.query('SELECT id, cost_points FROM rewards WHERE id=$1 AND active=true', [rewardId]);
  if (rw.length === 0) return res.status(400).json({ error: 'ไม่พบของรางวัลนี้' });
  const cost = rw[0].cost_points;

  const { rows: plays } = await pool.query('SELECT points_awarded FROM plays WHERE player_id=$1', [playerId]);
  const { rows: reds } = await pool.query('SELECT cost_points FROM redemptions WHERE player_id=$1', [playerId]);
  const balance = computeBalanceFromRows(plays, reds);
  if (balance < cost) {
    return res.status(400).json({ error: 'แต้มไม่พอ สะสมอีกนิดนะ', balance, cost });
  }

  // สร้างโค้ด ค้นหาซ้ำใน DB แล้ว retry
  let code = generateCouponCode();
  for (let i = 0; i < 5; i++) {
    try {
      await pool.query(
        'INSERT INTO redemptions (player_id, reward_id, coupon_code, cost_points) VALUES ($1,$2,$3,$4)',
        [playerId, rewardId, code, cost],
      );
      break;
    } catch (e: any) {
      if (e?.code === '23505') { code = generateCouponCode(); continue; }
      throw e;
    }
  }

  const newBalance = balance - cost;
  res.json({ coupon_code: code, balance: newBalance });
});
```

**Step 2: Commit**
```bash
git add server/src/routes/rewards.ts
git commit -m "feat(server): rewards list + redeem with coupon"
```

---

## Task 11: index.ts — bootstrap server + mount routes

**Objective:** สร้าง Express app, รัน migration ตอนบูต, เปิด port

**Files:**
- Create: `server/src/index.ts`

**Step 1: เขียน bootstrap**
```ts
// server/src/index.ts
import express from 'express';
import cors from 'cors';
import { runMigrations } from './db.ts';
import { playerRouter } from './routes/player.ts';
import { playRouter } from './routes/play.ts';
import { rewardsRouter } from './routes/rewards.ts';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api', playerRouter);
app.use('/api', playRouter);
app.use('/api', rewardsRouter);

const PORT = Number(process.env.PORT ?? 3000);

runMigrations()
  .then(() => {
    app.listen(PORT, () => console.log(`[server] listening on :${PORT}`));
  })
  .catch((e) => {
    console.error('[server] failed to start', e);
    process.exit(1);
  });
```

**Step 2: รัน server ทดสอบ health**
```bash
cd server && npm run dev
# แยกเทอร์มินอล:
curl localhost:3000/api/health
```
Expected: `{"ok":true}` และ console พิมพ์ `[migrate] applied 01_init.sql` ครั้งแรก

**Step 3: ทดสอบ flow ผ่าน curl**
```bash
curl -s -X POST localhost:3000/api/start -H 'Content-Type: application/json' -d '{"phone":"0812345678"}'
curl -s -X POST localhost:3000/api/play -H 'Content-Type: application/json' -d '{"phone":"0812345678","game_id":"quiz","correct":true}'
curl -s "localhost:3000/api/rewards?phone=0812345678"
curl -s -X POST localhost:3000/api/redeem -H 'Content-Type: application/json' -d '{"phone":"0812345678","reward_id":1}'
curl -s "localhost:3000/api/me?phone=0812345678"
```
Expected: แต่ละอันคืน JSON ถูกต้อง; เล่นซ้ำครั้งที่ 2 ได้ `409 alreadyPlayed`

**Step 4: Commit**
```bash
git add server/src/index.ts
git commit -m "feat(server): bootstrap express + mount routes"
```

---

## Task 12: รัน server tests ครบ + commit

**Objective:** ยืนยัน unit test ทั้งหมดผ่าน

**Step 1: รัน**
```bash
cd server && npx vitest run
```
Expected: PASS ทั้งหมด (util, daily, points)

**Step 2: Commit ถ้ามีแก้ไขเพิ่ม**
```bash
git add -A && git commit -m "test(server): green unit tests" || echo "nothing to commit"
```

---

## Task 13: web scaffold (package.json, vite, tsconfig, index.html)

**Objective:** เตรียม React+Vite โปรเจกต์ฝั่งหน้าเว็บ

**Files:**
- Create: `web/package.json`
- Create: `web/vite.config.ts`
- Create: `web/tsconfig.json`
- Create: `web/tsconfig.node.json`
- Create: `web/index.html`

**Step 1: web/package.json**
```json
{
  "name": "web",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0"
  },
  "devDependencies": {
    "@testing-library/react": "^16.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "jsdom": "^24.0.0",
    "vite": "^5.4.0",
    "vitest": "^2.0.0"
  }
}
```

**Step 2: web/vite.config.ts** (proxy /api → :3000 + test jsdom)
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
```

**Step 3: web/tsconfig.json**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "Bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "types": ["vitest/globals"]
  },
  "include": ["src", "tests"]
}
```

**Step 4: web/index.html**
```html
<!doctype html>
<html lang="th">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
    <title>เกมตลาดยิ่งเจริญ</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Step 5: ติดตั้ง**
```bash
npm install
```

**Step 6: Commit**
```bash
git add web/package.json web/vite.config.ts web/tsconfig.json web/tsconfig.node.json web/index.html package-lock.json
git commit -m "chore(web): scaffold React+Vite project"
```

---

## Task 14: web/src/api.ts + main.tsx + App.tsx + phone context

**Objective:** ฟังก์ชันเรียก API และโครงร่าง router + เก็บเบอร์ใน context

**Files:**
- Create: `web/src/api.ts`
- Create: `web/src/main.tsx`
- Create: `web/src/App.tsx`
- Create: `web/src/PhoneContext.tsx`

**Step 1: web/src/api.ts**
```ts
// เรียก API ผ่าน proxy /api
async function req<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'เกิดข้อผิดพลาด');
  }
  return res.json() as Promise<T>;
}

export const api = {
  start: (phone: string) => req('/api/start', { method: 'POST', body: JSON.stringify({ phone }) }),
  play: (phone: string, game_id: string, correct: boolean) =>
    req('/api/play', { method: 'POST', body: JSON.stringify({ phone, game_id, correct }) }),
  rewards: (phone: string) => req(`/api/rewards?phone=${encodeURIComponent(phone)}`),
  redeem: (phone: string, reward_id: number) =>
    req('/api/redeem', { method: 'POST', body: JSON.stringify({ phone, reward_id }) }),
  me: (phone: string) => req(`/api/me?phone=${encodeURIComponent(phone)}`),
};
```

**Step 2: web/src/PhoneContext.tsx**
```tsx
import { createContext, useContext, useState, ReactNode } from 'react';

const PhoneCtx = createContext<{ phone: string; setPhone: (p: string) => void }>({
  phone: '',
  setPhone: () => {},
});

export function PhoneProvider({ children }: { children: ReactNode }) {
  const [phone, setPhone] = useState('');
  return <PhoneCtx.Provider value={{ phone, setPhone }}>{children}</PhoneCtx.Provider>;
}

export const usePhone = () => useContext(PhoneCtx);
```

**Step 3: web/src/main.tsx**
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { PhoneProvider } from './PhoneContext';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <PhoneProvider>
        <App />
      </PhoneProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
```

**Step 4: web/src/App.tsx**
```tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { usePhone } from './PhoneContext';
import PhoneView from './views/PhoneView';
import PlayView from './views/PlayView';
import RewardsView from './views/RewardsView';
import MeView from './views/MeView';

function RequirePhone({ children }: { children: JSX.Element }) {
  const { phone } = usePhone();
  return phone ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: 16, fontFamily: 'system-ui' }}>
      <h2 style={{ textAlign: 'center' }}>🌽 ตลาดยิ่งเจริญ</h2>
      <Routes>
        <Route path="/" element={<PhoneView />} />
        <Route path="/play" element={<RequirePhone><PlayView /></RequirePhone>} />
        <Route path="/rewards" element={<RequirePhone><RewardsView /></RequirePhone>} />
        <Route path="/me" element={<RequirePhone><MeView /></RequirePhone>} />
      </Routes>
    </div>
  );
}
```

**Step 5: Commit**
```bash
git add web/src/api.ts web/src/PhoneContext.tsx web/src/main.tsx web/src/App.tsx
git commit -m "feat(web): api client + app shell + phone context"
```

---

## Task 15: web games — registry + QuizGame + ArrangeGame

**Objective:** เกมรวม 2 เกม (คำถามชุมชน + เรียงฝักข้าวโพด) และ registry

**Files:**
- Create: `web/src/games/registry.ts`
- Create: `web/src/games/QuizGame.tsx`
- Create: `web/src/games/ArrangeGame.tsx`

**Step 1: web/src/games/registry.ts**
```ts
import QuizGame from './QuizGame';
import ArrangeGame from './ArrangeGame';

// ต้องตรงกับ server/src/games.ts (GAME_IDS)
export const registry: Record<string, React.ComponentType<{ onComplete: (correct: boolean) => void }>> = {
  quiz: QuizGame,
  arrange: ArrangeGame,
};
```

**Step 2: web/src/games/QuizGame.tsx**
```tsx
// เกมตอบคำถามชุมชนสั้นๆ (v1: คำถามตัวอย่าง 1 ข้อ)
const QUESTION = 'ตลาดยิ่งเจริญตั้งอยู่ที่เขตใด?';
const OPTIONS = ['จตุจักร', 'บางเขน', 'บึงกุ่ม', 'ห้วยขวาง'];
const ANSWER_INDEX = 1; // บางเขน

export default function QuizGame({ onComplete }: { onComplete: (correct: boolean) => void }) {
  return (
    <div>
      <h3>{QUESTION}</h3>
      {OPTIONS.map((opt, i) => (
        <button key={i} style={{ display: 'block', width: '100%', margin: '8px 0', padding: 12 }} onClick={() => onComplete(i === ANSWER_INDEX)}>
          {opt}
        </button>
      ))}
    </div>
  );
}
```

**Step 3: web/src/games/ArrangeGame.tsx**
```tsx
// เกมเรียงลำดับขั้นตอนการปลูกข้าวโพด (คลิกเรียงตามลำดับที่ถูกต้อง)
const STEPS = ['ปลูกเมล็ด', 'รดน้ำดูแล', 'เก็บเกี่ยว', 'ขายในตลาด'];
const SOLUTION = [...STEPS]; // ลำดับถูกต้องคือตามนี้

import { useState } from 'react';

export default function ArrangeGame({ onComplete }: { onComplete: (correct: boolean) => void }) {
  const [order, setOrder] = useState<number[]>(() => [...STEPS.keys()].sort(() => Math.random() - 0.5));
  const [picked, setPicked] = useState<number[]>([]);

  const click = (i: number) => {
    if (picked.includes(i)) return;
    const next = [...picked, i];
    setPicked(next);
    if (next.length === STEPS.length) {
      const correct = next.every((v, idx) => STEPS[v] === SOLUTION[idx]);
      onComplete(correct);
    }
  };

  return (
    <div>
      <p>คลิกเรียงลำดับขั้นตอนให้ถูกต้อง:</p>
      {order.map((i) => (
        <button key={i} disabled={picked.includes(i)} style={{ display: 'block', width: '100%', margin: '8px 0', padding: 12 }} onClick={() => click(i)}>
          {STEPS[i]} {picked.includes(i) ? `(${picked.indexOf(i) + 1})` : ''}
        </button>
      ))}
    </div>
  );
}
```

**Step 4: Commit**
```bash
git add web/src/games/
git commit -m "feat(web): quiz + arrange games + registry"
```

---

## Task 16: web views — PhoneView, PlayView, RewardsView, MeView

**Objective:** หน้าจอทั้ง 4 หน้าให้เล่นจริงได้

**Files:**
- Create: `web/src/views/PhoneView.tsx`
- Create: `web/src/views/PlayView.tsx`
- Create: `web/src/views/RewardsView.tsx`
- Create: `web/src/views/MeView.tsx`

**Step 1: web/src/views/PhoneView.tsx**
```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePhone } from '../PhoneContext';
import { api } from '../api';

export default function PhoneView() {
  const { setPhone } = usePhone();
  const [phone, setLocal] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const submit = async () => {
    setErr(''); setLoading(true);
    try {
      await api.start(phone);
      setPhone(phone.trim());
      nav('/play');
    } catch (e: any) {
      setErr(e.message);
    } finally { setLoading(false); }
  };

  return (
    <div>
      <p>กรอกเบอร์โทรเพื่อเริ่มเล่นเกมวันนี้</p>
      <input inputMode="numeric" value={phone} onChange={(e) => setLocal(e.target.value)} placeholder="0812345678" style={{ width: '100%', padding: 12, fontSize: 16 }} />
      {err && <p style={{ color: 'crimson' }}>{err}</p>}
      <button disabled={loading} onClick={submit} style={{ width: '100%', padding: 12, marginTop: 8 }}>
        {loading ? 'กำลังโหลด...' : 'เริ่มเล่น'}
      </button>
    </div>
  );
}
```

**Step 2: web/src/views/PlayView.tsx**
```tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePhone } from '../PhoneContext';
import { api } from '../api';
import { registry } from '../games/registry';

export default function PlayView() {
  const { phone } = usePhone();
  const nav = useNavigate();
  const [state, setState] = useState<{ balance: number; todayPlayed: boolean; todayGame: string; todayCorrect: boolean | null } | null>(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.start(phone).then((r) => { setState(r); setLoading(false); }).catch((e) => { setMsg(e.message); setLoading(false); });
  }, [phone]);

  if (loading) return <p>กำลังโหลด...</p>;
  if (!state) return <p style={{ color: 'crimson' }}>{msg}</p>;

  if (state.todayPlayed) {
    return (
      <div>
        <p>วันนี้เล่นแล้วครับ 🎉 (ยอดแต้ม {state.balance})</p>
        <button onClick={() => nav('/rewards')}>ดูของรางวัล</button>
        <button onClick={() => nav('/me')}>โปรไฟล์ของฉัน</button>
      </div>
    );
  }

  const Game = registry[state.todayGame];
  if (!Game) return <p>ไม่พบเกมวันนี้</p>;

  const onComplete = async (correct: boolean) => {
    try {
      const r = await api.play(phone, state.todayGame, correct);
      setMsg(`ได้ 1 แต้ม! ยอดรวม ${r.balance}`);
      setState({ ...state, todayPlayed: true, todayCorrect: correct });
    } catch (e: any) {
      setMsg(e.message);
    }
  };

  return (
    <div>
      <p>ยอดแต้ม: {state.balance}</p>
      <Game onComplete={onComplete} />
      {msg && <p style={{ color: 'green' }}>{msg}</p>}
    </div>
  );
}
```

**Step 3: web/src/views/RewardsView.tsx**
```tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePhone } from '../PhoneContext';
import { api } from '../api';

export default function RewardsView() {
  const { phone } = usePhone();
  const nav = useNavigate();
  const [data, setData] = useState<{ balance: number; rewards: any[] } | null>(null);
  const [msg, setMsg] = useState('');

  const load = () => api.rewards(phone).then(setData).catch((e) => setMsg(e.message));
  useEffect(load, [phone]);

  const redeem = async (reward_id: number) => {
    setMsg('');
    try {
      const r = await api.redeem(phone, reward_id);
      setMsg(`แลกสำเร็จ! โค้ดคูปอง: ${r.coupon_code} (ยอดเหลือ ${r.balance})`);
      load();
    } catch (e: any) { setMsg(e.message); }
  };

  if (!data) return <p>กำลังโหลด...</p>;
  return (
    <div>
      <p>แต้มของคุณ: {data.balance}</p>
      {data.rewards.map((r) => (
        <div key={r.id} style={{ border: '1px solid #ccc', borderRadius: 8, padding: 12, margin: '8px 0' }}>
          <strong>{r.name}</strong> — {r.cost_points} แต้ม
          <p style={{ fontSize: 13, color: '#666' }}>{r.description}</p>
          <button disabled={!r.canAfford} onClick={() => redeem(r.id)}>
            {r.canAfford ? 'แลกเลย' : 'แต้มไม่พอ'}
          </button>
        </div>
      ))}
      {msg && <p style={{ color: 'green' }}>{msg}</p>}
      <button onClick={() => nav('/me')}>โปรไฟล์</button>
      <button onClick={() => nav('/play')}>เล่นเกม</button>
    </div>
  );
}
```

**Step 4: web/src/views/MeView.tsx**
```tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePhone } from '../PhoneContext';
import { api } from '../api';

export default function MeView() {
  const { phone } = usePhone();
  const nav = useNavigate();
  const [data, setData] = useState<any>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.me(phone).then(setData).catch((e) => setMsg(e.message));
  }, [phone]);

  if (!data) return <p>กำลังโหลด...</p>;
  return (
    <div>
      <p>เบอร์: {phone}</p>
      <p>ยอดแต้ม: {data.balance}</p>
      <h4>ประวัติการเล่น</h4>
      {data.history.length === 0 ? <p>ยังไม่เคยเล่น</p> :
        data.history.map((h: any, i: number) => (
          <div key={i}>{h.played_on} — {h.game_id} — {h.correct ? 'ถูก' : 'ผิด'} (+{h.points_awarded})</div>
        ))}
      <h4>คูปองที่แลก</h4>
      {data.redemptions.length === 0 ? <p>ยังไม่เคยแลก</p> :
        data.redemptions.map((r: any, i: number) => (
          <div key={i}>{r.name} — โค้ด {r.coupon_code}</div>
        ))}
      {msg && <p style={{ color: 'crimson' }}>{msg}</p>}
      <button onClick={() => nav('/play')}>เล่นเกม</button>
      <button onClick={() => nav('/rewards')}>ของรางวัล</button>
    </div>
  );
}
```

**Step 5: Commit**
```bash
git add web/src/views/
git commit -m "feat(web): phone/play/rewards/me views"
```

---

## Task 17: web smoke test (render ไม่พัง)

**Objective:** ทดสอบว่าเรนเดอร์หน้าแรกได้โดยไม่ crash

**Files:**
- Create: `web/tests/smoke.test.tsx`

**Step 1: เขียน test**
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PhoneView from '../src/views/PhoneView';
import { PhoneProvider } from '../src/PhoneContext';

describe('PhoneView', () => {
  it('renders phone input', () => {
    render(
      <MemoryRouter>
        <PhoneProvider>
          <PhoneView />
        </PhoneProvider>
      </MemoryRouter>,
    );
    expect(screen.getByPlaceholderText('0812345678')).toBeTruthy();
  });
});
```

**Step 2: รัน**
```bash
cd web && npx vitest run
```
Expected: PASS

**Step 3: Commit**
```bash
git add web/tests/smoke.test.tsx
git commit -m "test(web): smoke render PhoneView"
```

---

## Task 18: ตรวจสอบรวม (Integration) + QR

**Objective:** รันทั้งระบบจริงและทดสอบ flow บน mobile viewport

**Step 1: เริ่มทุกอย่าง**
```bash
npm install
npm run up            # postgres
npm run dev           # server :3000 + web :5173
```

**Step 2: เปิด http://localhost:5173 บน mobile viewport (DevTools responsive)**
- กรอกเบอร์ → หน้าเล่น → เล่นเกม → ได้ 1 แต้ม
- รีเฟรช → ยังได้เกมเดิม + ยอดคงที่
- เล่นอีกครั้ง → แจ้ง "วันนี้เล่นแล้ว"
- ไปหน้า "ของรางวัล" → กดแลก → ได้โค้ด
- หน้า "โปรไฟล์" → เห็นยอด + ประวัติ + คูปอง
- เปลี่ยนเบอร์ → ยอดเริ่มใหม่ (คนละตัวตน)

**Step 3: ทดสอบ "วันถัดไป" (จำลอง)**
```bash
# ในฐานข้อมูล ปรับ played_on เป็นเมื่อวาน เพื่อให้เล่นได้อีกวัน
docker compose exec postgres psql -U postgres -d corn -c "UPDATE plays SET played_on = played_on - INTERVAL '1 day';"
```
Expected: หน้า play กลับมาเล่นได้อีกครั้ง (และอาจได้เกมคนละเกม)

**Step 4: QR (สำหรับใช้งานจริงหน้างาน)**
-  deploy แล้วชี้ QR ไปที่ URL สาธารณะของ web; ในเครื่องใช้ `http://<ip-เครื่อง>:5173`
- (ไม่บังคับใน v1) สร้างไฟล์ `public/qr.png` ทีหลังเมื่อมี URL จริง

**Step 5: Commit ไฟล์ที่เหลือทั้งหมด**
```bash
git add -A && git commit -m "feat: complete v1 game hub (server + web)" || echo "nothing"
```

---

## Files Likely To Change (สรุป)
- `package.json` (root, workspaces)
- `docker-compose.yml`
- `server/src/{util,daily,points,db,games,index}.ts`
- `server/src/routes/{player,play,rewards}.ts`
- `server/migrations/01_init.sql`
- `server/tests/{util,daily,points}.test.ts`
- `web/src/{api,App,PhoneContext,main}.ts(x)`
- `web/src/games/{registry,QuizGame,ArrangeGame}.tsx`
- `web/src/views/{PhoneView,PlayView,RewardsView,MeView}.tsx`
- `web/tests/smoke.test.tsx`

## Tests / Validation
- `cd server && npx vitest run` → 0 failures (util, daily, points)
- `cd web && npx vitest run` → 0 failures (smoke)
- `curl localhost:3000/api/health` → `{"ok":true}`
- curl flow ทดสอบ start/play/rewards/redeem/me ครบ
- เปิด http://localhost:5173 บน mobile viewport ทดสอบมือ human

## Risks / Tradeoffs / Open Questions
- **เลือกเกม deterministic**: ทุกคนที่ hash ตรงกันได้เกมเดียวกันในวันเดียวกัน — ยอมรับสำหรับ v1 (ระบุใน spec Risks)
- **correct flag เชื่อฝั่ง client**: 因为 scoring ตายตัว 1 แต้ม ไม่มีผลต่อแต้ม จึงรับได้; ถ้าภายหลังอยากนับคะแนนจริงต้องย้าย logic มา server
- **ไม่มี auth นอกเบอร์**: ใครรู้เบอร์คนอื่นเอาไปเล่นแทนได้ — ยอมรับสำหรับโปรโมชันตลาด
- **Postgres volume**: ใช้ named volume ถาวร; ถ้าลบ volume แต้มหาย (ระบุใน spec)
- **เพิ่มเกมใหม่**: ต้องเพิ่มใน `server/src/games.ts` (GAME_IDS) และ `web/src/games/registry.ts` ให้ตรงกัน — ประตูขยายเปิดแล้ว
- **เพิ่มของรางวัล**: INSERT ลงตาราง `rewards` โดยตรง (หรือทำ admin ง่ายๆ ภายหลัง) — โครงสร้างรองรับแล้ว
