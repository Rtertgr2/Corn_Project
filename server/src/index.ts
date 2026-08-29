// server/src/index.ts
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMigrations } from './db.ts';
import { playerRouter } from './routes/player.ts';
import { playRouter } from './routes/play.ts';
import { rewardsRouter } from './routes/rewards.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json());

// API routes
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api', playerRouter);
app.use('/api', playRouter);
app.use('/api', rewardsRouter);

// Serve frontend (production)
const webDist = path.join(__dirname, '..', '..', 'web', 'dist');
app.use(express.static(webDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(webDist, 'index.html'));
});

const PORT = Number(process.env.PORT ?? 3001);

runMigrations()
  .then(() => {
    app.listen(PORT, () => console.log(`[server] listening on :${PORT}`));
  })
  .catch((e) => {
    console.error('[server] failed to start', e);
    process.exit(1);
  });
