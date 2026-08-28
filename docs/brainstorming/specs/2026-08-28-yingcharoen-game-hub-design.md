# เกมรวมตลาดยิ่งเจริญ — Design Doc

> สร้างจากสกิล `brainstorming` วันที่ 2026-08-28

## 1. เป้าหมาย (Goal)
สร้างเว็บแอปมือถือ (สแกน QR → เปิดเบราว์เซอร์) ให้ลูกค้าตลาดยิ่งเจริญเล่นมินิเกมรวมได้วันละครั้ง เก็บแต้มสะสม และแลกคูปองสมนาคุณ/ของที่ระลึกในแอป โดยรองรับการเพิ่มเกมและของรางวัลใหม่ได้ในอนาคตโดยไม่ต้องรื้อโครงสร้าง

## 2. บริบทและข้อจำกัด (Context & Constraints)
- **ทำไมถึงจำเป็น:** ตลาดอยากมีกิจกรรมกระตุ้นคนมาเดินตลาด + สะสมแต้มแลกของ สร้างความผูกพันกับชุมชน
- **ข้อจำกัด:**
  - หน้าเว็บต้องเปิดในมือถือลูกค้าได้โดยสแกน QR (mobile-first)
  - ระบุตัวตนด้วยเบอร์โทรศัพท์ เก็บใน DB (กันเล่นซ้ำวันละครั้งได้จริง)
  - ใช้ PostgreSQL (รันผ่าน docker-compose ตามปกติของ repo นี้)
  - ผู้ใช้กำลังเรียน React + TypeScript จึงเขียน frontend ด้วย React+TS (Vite) เพื่อฝึกไปด้วย
  - เขตเวลานับวันตาม `Asia/Bangkok`
- **เกณฑ์ความสำเร็จ (Success criteria):**
  - ลูกค้ากรอกเบอร์ → เล่นมินิเกมที่สุ่มให้วันนั้น → ได้ 1 แต้ม → ยอดสะสมเพิ่ม
  - พรุ่งนี้เล่น又一个เกมได้อีก 1 แต้ม (กันซ้ำวันเดียวสำเร็จ)
  - ดูหน้า "ของรางวัล" ได้ และกดแลก → ได้โค้ดคูปองหักแต้ม
  - เปลี่ยนเครื่อง/รีเฟรช ยอดแต้มและสถานะวันยังคงเดิม (เพราะเก็บใน DB)

## 3. ทางเลือกที่พิจารณา (Approaches Considered)
| ทางเลือก | ข้อดี | ข้อเสีย | สถานะ |
|---------|------|--------|------|
| A (แนะนำ) React+TS(Vite) หน้า + Express + PostgreSQL (raw `pg`) | ฝึก React ตรงตามเป้าหมาย ตัวตนมั่นคง กันซ้ำได้จริง เบาไม่พึ่ง ORM | ต้องเขียน SQL/migration เอง เยอะหน่อย | เลือก |
| B Next.js + SQLite | จุดเดียวจัดการง่าย | เรียน React เจาะลึกน้อยลง + ผู้ใช้ขอ PostgreSQL ไม่ใช่ SQLite | ตัดไป |
| C หน้าเดี่ยว + Sheets/JSON ไม่มี backend | เร็วสุด | กันโกง/ข้ามเครื่องทำไม่ได้ ผิดความต้องการ | ตัดไป |

**เหตุผลเลือก A:** ตรงกับความต้องการระบุตัวตนผ่านเบอร์ + PostgreSQL + ฝึก React ตามที่ผู้ใช้เรียนอยู่

## 4. สถาปัตยกรรม (Architecture)
```
[มือถือ] --QR--> [React SPA :5173] --fetch /api--> [Express :3000] --> [PostgreSQL :5432 (docker)]
```
- Frontend: React + TypeScript + Vite SPA (mobile-first, react-router สำหรับหน้า)
- Backend: Express REST API (`/api/*`) ใช้ `pg` เชื่อม PostgreSQL
- Database: PostgreSQL รันใน docker-compose (มี volume เก็บถาวร)
- โหมด dev: Vite dev server คุย API ผ่าน Vite proxy (`/api` → `localhost:3000`)
- เกมรวมจัดเป็น **registry**: แต่ละเกม = component + `game_id`; เพิ่มเกมใหม่แค่ลงทะเบียนใน registry (เปิดประตูขยาย)

## 5. Components / Files
โครงสร้าง repo (npm workspaces ที่ root):
```
Corn_Project/
  docker-compose.yml              # postgres service + volume
  package.json                    # workspaces: ["server","web"]
  server/
    package.json
    tsconfig.json
    src/index.ts                  # bootstrap express, mount routes
    src/db.ts                     # pg pool + runMigrations()
    src/config.ts                 # PORT, DATABASE_URL, TZ
    src/games.ts                  # รายชื่อ game_id ที่รองรับ (เช็คฝั่ง server)
    src/daily.ts                  # hashDailyGame(phone, dateBKK), dateBKK()
    src/points.ts                 # computeBalance(playerId), generateCoupon()
    src/routes/player.ts          # POST /api/start, GET /api/me
    src/routes/play.ts            # POST /api/play
    src/routes/rewards.ts         # GET /api/rewards, POST /api/redeem
    migrations/01_init.sql        # สร้างตาราง + seed rewards ตัวอย่าง
    tests/daily.test.ts           # vitest: hashDailyGame เสถียรตามวัน
    tests/points.test.ts          # vitest: computeBalance, generateCoupon unique
  web/
    package.json
    tsconfig.json
    vite.config.ts                # proxy /api -> :3000
    index.html
    src/main.tsx                  # entry, Router
    src/api.ts                    # fetch wrapper เรียก /api/*
    src/App.tsx                   # layout + routes
    src/games/registry.ts         # map game_id -> component
    src/games/QuizGame.tsx        # ตอบคำถามชุมชน (คำถาม+ตัวเลือก)
    src/games/ArrangeGame.tsx     # เรียงฝักข้าวโพด (ลาก/กดเรียงลำดับ)
    src/views/PhoneView.tsx       # กรอกเบอร์
    src/views/PlayView.tsx        # แสดงเกมวันนี้ + ผลลัพธ์
    src/views/RewardsView.tsx     # รายการของรางวัล + กดแลก
    src/views/MeView.tsx          # ยอดแต้ม + ประวัติ
    tests/smoke.test.tsx          # render หน้าแรกไม่พัง
```
**ความรับผิดชอบหลัก:**
- `server/src/daily.ts` — คำนวณวันที่ BKK และเลือกเกมวันนี้แบบ deterministic: `hashDailyGame(phone, dateBKK) = games[hashCode(phone+dateBKK) % games.length]` → เกมเดียวตลอดวัน แม้รีเฟรช
- `server/src/points.ts` — `computeBalance` = `SUM(plays.points_awarded) − SUM(redemptions.cost_points)` คำนวณสด; `generateCoupon` = `YJ` + base36 8 ตัว + ตรวจ unique ใน DB (retry ถ้าชน)
- `migrations/01_init.sql` — สร้าง 4 ตาราง + `UNIQUE(player_id, played_on)` เพื่อกันเล่นซ้ำ + seed ของรางวัลตัวอย่าง 3 ชิ้น

## 6. Data Flow
1. กรอกเบอร์ → `POST /api/start {phone}` → คืน `{balance, todayPlayed, todayGame, todayCorrect}`
2. เล่นเกม → `POST /api/play {phone, game_id, payload}` → server ดีรive เกมวันนี้จากเบอร์+วัน; ถ้า `game_id` ไม่ตรง → `400`; ถ้าเล่นวันนี้แล้ว → `409`; else บันทึก `plays` (1 แต้ม) → คืน `{correct, pointsAwarded:1, balance}`
3. หน้า "ของรางวัล" → `GET /api/rewards?phone=` → รายการ + `canAfford`; กดแลก → `POST /api/redeem {phone, reward_id}` → ถ้ายอดพอ สร้าง `coupon_code` หักแต้ม → คืน `{coupon_code, balance}` (ถ้าไม่พอ → `400`)
4. หน้าโปรไฟล์ → `GET /api/me?phone=` → `{balance, history[], redemptions[]}`

## 7. Error Handling
- เล่นซ้ำวันเดียว → `409` → หน้าแจ้ง "วันนี้เล่นแล้ว รอพรุ่งนี้ครับ" + โชว์ยอด
- เบอร์ผิดรูปแบบ (ไม่ใช่ตัวเลข 9–10 หลัก) → `400` + ข้อความไทย
- ส่ง `game_id` ไม่ตรงกับเกมวันนี้ → `400`
- แต้มไม่พอแลก → `400` + บอกว่า "แต้มไม่พอ สะสมอีกนิดนะ"
- DB ดับ/error → `500` + ข้อความ "ระบบชั่วคราวขัดข้อง ลองใหม่อีกครั้ง"
- Frontend: จับ error ทุก call แสดงเป็น banner ภาษาไทย ไม่ปล่อยหน้าว่าง

## 8. Testing / Verification
- **Backend logic (สำคัญสุด)** ด้วย `vitest` (`server`):
  - `daily.test.ts`: `hashDailyGame` ให้ผลเดียวกันภายในวันเดียวกันคนละรีเฟรช, และเปลี่ยนเมื่อเปลี่ยนวัน
  - `points.test.ts`: `computeBalance` คำนวณถูก (บวก play หัก redeem), `generateCoupon` ไม่ซ้ำกัน
  - คาดเห็น `npx vitest run` → 0 failures
- **Frontend smoke**: `web` มี `tests/smoke.test.tsx` render `PhoneView` ได้ (vitest + @testing-library/react)
- **Manual**: `docker compose up -d` → รัน `npm run dev` (server+web) → เปิด mobile viewport → กรอกเบอร์ → เล่นเกม → ได้แต้ม → กดแลกคูปอง → รีเฟรชดูยอดคงที่ → รอจำลองวันถัดไป (หรือแก้เวลาเทสต์) เล่นได้อีก

## 9. ขอบเขตที่ตัดทิ้ง (Out of Scope / YAGNI)
- ระบบตรวจสอบ/สแกนคูปองฝั่งร้านค้า (v1 แค่ generate โค้ดให้ลูกค้าเอาไปให้ร้าน)
- หน้า admin จัดการของรางวัล (v1 seed ของตัวอย่าง 3 ชิ้นผ่าน SQL; เพิ่มทีหลังแค่ INSERT หรือทำ admin ง่ายๆ ภายหลัง — โครงสร้าง `rewards` รองรับแล้ว)
- LINE Login / OAuth (ใช้เบอร์อย่างเดียว)
- หลายภาษา / analytics / leaderboard
- ระบบแต้มตามคะแนนเกม (v1 ตายตัว 1 แต้มต่อวัน)

## 10. ความเสี่ยง (Risks)
| ความเสี่ยง | ผลกระทบ | แผนสำรอง |
|----------|---------|---------|
| เลือกเกมแบบ deterministic ทุกคนที่ hash ตรงกันได้เกมเดียวกัน | ไม่สนุกถ้าทุกคนได้เกมเดียวพร้อมกัน | v1 ยอมรับ; ภายหลังสุ่มด้วย seed + jitter หรือ random วันละอันต่อคน |
| ไม่มี auth นอกเบอร์ ใครทราบเบอร์คนอื่นเอาไปเล่นแทนได้ | อาจโกงแต้ม | ยอมรับสำหรับโปรโมชันตลาด; ถ้าจำเป็นภายหลังเพิ่ม OTP |
| Postgres ใน docker หายเมื่อลบ container | แต้มหาย | ใช้ named volume เก็บถาวร + ทำ dump periodic ภายหลัง |
| ผู้ใช้ยังเรียน React อาจติดขัด syntax | ช้าแต่ไม่พัง | แยกเกมเป็น component เล็ก ๆ อธิบายทีละไฟล์ พร้อมคอมเมนต์ภาษาไทย |

---

*หมายเหตุ: ไม่มี "TBD"/"TODO" ใน doc นี้ — ทุกช่องเติมให้ชัด*
