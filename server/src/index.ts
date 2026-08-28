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

const PORT = Number(process.env.PORT ?? 3001);

runMigrations()
  .then(() => {
    app.listen(PORT, () => console.log(`[server] listening on :${PORT}`));
  })
  .catch((e) => {
    console.error('[server] failed to start', e);
    process.exit(1);
  });
