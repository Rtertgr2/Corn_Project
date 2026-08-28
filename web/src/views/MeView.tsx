// web/src/views/MeView.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePhone } from '../PhoneContext';
import { api } from '../api';

export default function MeView() {
  const { phone } = usePhone();
  const nav = useNavigate();
  const [data, setData] = useState<{ balance: number; history: any[]; redemptions: any[] } | null>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.me(phone).then(setData).catch((e) => setMsg(e.message));
  }, [phone]);

  if (!data) {
    return (
      <div>
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-text" />
        <div className="skeleton skeleton-text" style={{ width: '70%' }} />
      </div>
    );
  }

  const level = Math.floor(data.balance / 10) + 1;

  return (
    <div>
      {/* Profile Header */}
      <div className="card" style={{ textAlign: 'center', marginBottom: 'var(--space-md)' }}>
        <div style={{ 
          width: 64, 
          height: 64, 
          borderRadius: 'var(--radius-full)', 
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto var(--space-md)',
          fontSize: '2rem',
          boxShadow: 'var(--shadow-md)',
        }}>
          👤
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{phone}</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)' }}>
          <span className="level-badge">{level}</span>
          <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>
            ผู้เล่นเลเวล {level}
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="quick-stat">
          <div className="stat-value">{data.balance}</div>
          <div className="stat-label">แต้ม</div>
        </div>
        <div className="quick-stat">
          <div className="stat-value">{data.history.length}</div>
          <div className="stat-label">เกมที่เล่น</div>
        </div>
        <div className="quick-stat">
          <div className="stat-value">{data.redemptions.length}</div>
          <div className="stat-label">คูปอง</div>
        </div>
      </div>

      {/* Play History */}
      <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
        <h3 className="section-title" style={{ marginTop: 0 }}><span className="icon">📜</span> ประวัติการเล่น</h3>
        {data.history.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', padding: 'var(--space-md) 0' }}>ยังไม่เคยเล่น</p>
        ) : (
          data.history.map((h: any, i: number) => (
            <div key={i} className="history-item">
              <span className="history-date">{h.played_on?.slice(0, 10)}</span>
              <span className="history-game">{h.game_id === 'quiz' ? 'คำถาม' : 'จับคู่ข้าวโพด'}</span>
              <span className={`history-result ${h.correct ? 'correct' : 'wrong'}`}>
                {h.correct ? '✅' : '❌'} +{h.points_awarded}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Coupons */}
      <div className="card">
        <h3 className="section-title" style={{ marginTop: 0 }}><span className="icon">🎫</span> คูปองที่แลก</h3>
        {data.redemptions.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', padding: 'var(--space-md) 0' }}>ยังไม่เคยแลก</p>
        ) : (
          data.redemptions.map((r: any, i: number) => (
            <div key={i} className="history-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
              <span style={{ fontWeight: 600 }}>{r.name}</span>
              <span className="coupon-code" style={{ fontSize: '0.9rem' }}>{r.coupon_code}</span>
            </div>
          ))
        )}
      </div>

      {msg && <p className="msg-error" style={{ marginTop: 'var(--space-md)' }}>{msg}</p>}

      <div className="nav-row">
        <button className="btn btn-primary" onClick={() => nav('/play')}>
          🎮 เล่นเกม
        </button>
        <button className="btn btn-accent" onClick={() => nav('/rewards')}>
          🎁 ของรางวัล
        </button>
      </div>
    </div>
  );
}
