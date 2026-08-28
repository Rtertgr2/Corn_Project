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
