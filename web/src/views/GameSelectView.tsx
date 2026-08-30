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

  const games = Object.entries(registry);

  return (
    <div>
      {/* Pill HUD — heading + แต้ม */}
      <div className="points-hud">
        <h2 className="section-title" style={{ margin: 0, paddingLeft: 'var(--space-md)', color: 'var(--color-on-primary)', flex: 1 }}>
          <span className="icon">🎮</span> เลือกเกมที่อยากเล่น
        </h2>
        <div className="points-right">
          <div className="star-icon">⭐</div>
          <div>
            <div className="points-value">{balance}</div>
            <div className="points-label">แต้ม</div>
          </div>
        </div>
      </div>

      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-md)' }}>
        เล่นได้วันละ 1 เกม ได้ 1 แต้มต่อเกม
      </p>

      {games.map(([id, { name, desc }]) => (
        <div key={id} className="game-option-card" onClick={() => nav(`/play/${id}`)}>
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
        <button className="btn btn-secondary" onClick={() => nav('/me')}>👤 โปรไฟล์</button>
      </div>
    </div>
  );
}
