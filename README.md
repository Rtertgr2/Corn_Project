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
