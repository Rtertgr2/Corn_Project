// web/src/views/GameSelectView.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePhone } from '../PhoneContext';
import { api } from '../api';
import { registry } from '../games/registry';

export default function GameSelectView() {
  const { phone } = usePhone();
  const nav = useNavigate();
  const [balance, setBalance] = useState(0);
  const [todayPlayed, setTodayPlayed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.start(phone).then((r) => {
      setBalance(r.balance);
      setTodayPlayed(r.todayPlayed);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [phone]);

  if (loading) {
    return (
      <div>
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-btn" style={{ height: 120 }} />
        <div className="skeleton skeleton-btn" style={{ height: 120 }} />
      </div>
    );
  }

  if (todayPlayed) {
    return (
      <div className="card result-screen">
        <div className="result-icon">✅</div>
        <p className="result-text">วันนี้เล่นแล้วครบ!</p>
        <p className="result-sub">กลับมาเล่นใหม่พรุ่งนี้นะ</p>
        <div className="points-badge" style={{ margin: '0 auto var(--space-xl)' }}>
          ⭐ {balance} แต้ม
        </div>
        <div className="nav-row">
          <button className="btn btn-accent" onClick={() => nav('/rewards')}>
            🎁 ของรางวัล
          </button>
          <button className="btn btn-secondary" onClick={() => nav('/me')}>
            👤 โปรไฟล์
          </button>
        </div>
      </div>
    );
  }

  const games = Object.entries(registry);

  return (
    <div>
      {/* Points HUD */}
      <div className="points-hud">
        <div className="points-left">
          <div className="points-icon">⭐</div>
          <div className="points-info">
            <div className="points-value">{balance}</div>
            <div className="points-label">แต้ม</div>
          </div>
        </div>
        <div className="streak">🔥 1 วัน</div>
      </div>

      <h2 className="section-title"><span className="icon">🎮</span> เลือกเกมที่อยากเล่น</h2>
      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-md)' }}>
        เล่นได้วันละ 1 เกม ได้ 1 แต้มต่อเกม
      </p>

      {games.map(([id, { name, desc }]) => (
        <div
          key={id}
          className="game-option-card"
          onClick={() => nav(`/play/${id}`)}
        >
          <div className={`game-icon ${id}`}>
            {id === 'quiz' ? '❓' : '🧩'}
          </div>
          <div className="game-info">
            <p className="game-name">{name}</p>
            <p className="game-desc">{desc || (id === 'quiz' ? 'ตอบคำถามชุมชนสั้นๆ' : 'จับคู่ข้าวโพดให้ได้ 150 แต้ม')}</p>
          </div>
          <span className="game-arrow">▶</span>
        </div>
      ))}

      <div className="nav-row">
        <button className="btn btn-secondary" onClick={() => nav('/me')}>
          👤 โปรไฟล์
        </button>
        <button className="btn btn-ghost" onClick={() => nav('/rewards')}>
          🎁 ของรางวัล
        </button>
      </div>
    </div>
  );
}
