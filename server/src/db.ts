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
