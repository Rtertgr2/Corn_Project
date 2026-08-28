// web/src/views/GameSelectView.tsx
// หน้าเลือกเกม — ผู้เล่นเลือกเองได้เลย
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
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <p className="result-text">วันนี้เล่นแล้วครับ!</p>
        <p style={{ color: 'var(--color-muted-foreground)', marginBottom: 'var(--space-md)' }}>กลับมาเล่นใหม่พรุ่งนี้นะ</p>
        <div className="points-badge" style={{ margin: '0 auto var(--space-lg)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          {balance} แต้ม
        </div>
        <div className="nav-row">
          <button className="btn btn-accent" onClick={() => nav('/rewards')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></svg>
            ของรางวัล
          </button>
          <button className="btn btn-secondary" onClick={() => nav('/me')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            โปรไฟล์
          </button>
        </div>
      </div>
    );
  }

  const games = Object.entries(registry);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 600 }}>เลือกเกมที่อยากเล่น</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-muted-foreground)' }}>เล่นได้วันละ 1 เกม</p>
        </div>
        <span className="points-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          {balance} แต้ม
        </span>
      </div>

      {games.map(([id, { name }]) => (
        <button
          key={id}
          className="card"
          onClick={() => nav(`/play/${id}`)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-md)',
            width: '100%',
            textAlign: 'left',
            cursor: 'pointer',
            marginBottom: 'var(--space-md)',
            border: '2px solid var(--color-border)',
            padding: 'var(--space-lg)',
            background: 'var(--color-card)',
            transition: 'all var(--transition-normal)',
          }}
        >
          <span style={{
            width: 56,
            height: 56,
            borderRadius: 'var(--radius-lg)',
            background: id === 'quiz' ? 'linear-gradient(135deg, #7C3AED, #A78BFA)' : 'linear-gradient(135deg, #F59E0B, #FBBF24)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            {id === 'quiz' ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
            )}
          </span>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '1.05rem', color: 'var(--color-foreground)' }}>{name}</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-muted-foreground)', marginTop: 2 }}>
              {id === 'quiz' ? 'ตอบคำถามชุมชนสั้นๆ ได้ 1 แต้ม' : 'จับคู่ข้าวโพดให้ได้ 150 แต้ม'}
            </p>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-muted-foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      ))}

      <div className="nav-row" style={{ marginTop: 'var(--space-sm)' }}>
        <button className="btn btn-secondary" onClick={() => nav('/me')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          โปรไฟล์
        </button>
        <button className="btn btn-outline" onClick={() => nav('/rewards')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></svg>
          ของรางวัล
        </button>
      </div>
    </div>
  );
}
