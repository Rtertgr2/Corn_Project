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

  return (
    <div>
      {/* Profile Header */}
      <div className="card" style={{ textAlign: 'center', marginBottom: 'var(--space-md)' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto var(--space-sm)' }}>
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-muted-foreground)' }}>{phone}</p>
        <div className="points-badge" style={{ marginTop: 'var(--space-sm)', fontSize: '1.1rem', padding: '8px 20px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          {data.balance} แต้ม
        </div>
      </div>

      {/* Play History */}
      <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
        <h3 className="section-title" style={{ marginTop: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          ประวัติการเล่น
        </h3>
        {data.history.length === 0 ? (
          <p style={{ color: 'var(--color-muted-foreground)', fontSize: '0.9rem', padding: 'var(--space-md) 0' }}>ยังไม่เคยเล่น</p>
        ) : (
          data.history.map((h: any, i: number) => (
            <div key={i} className="history-item">
              <span>{h.played_on?.slice(0, 10)}</span>
              <span style={{ color: 'var(--color-muted-foreground)' }}>{h.game_id === 'quiz' ? 'คำถาม' : 'เรียงลำดับ'}</span>
              <span style={{ color: h.correct ? 'var(--color-accent)' : 'var(--color-destructive)', fontWeight: 500 }}>
                {h.correct ? 'ถูก' : 'ผิด'} (+{h.points_awarded})
              </span>
            </div>
          ))
        )}
      </div>

      {/* Coupons */}
      <div className="card">
        <h3 className="section-title" style={{ marginTop: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></svg>
          คูปองที่แลก
        </h3>
        {data.redemptions.length === 0 ? (
          <p style={{ color: 'var(--color-muted-foreground)', fontSize: '0.9rem', padding: 'var(--space-md) 0' }}>ยังไม่เคยแลก</p>
        ) : (
          data.redemptions.map((r: any, i: number) => (
            <div key={i} className="history-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
              <span style={{ fontWeight: 500 }}>{r.name}</span>
              <span className="coupon-code" style={{ fontSize: '0.9rem' }}>{r.coupon_code}</span>
            </div>
          ))
        )}
      </div>

      {msg && <p className="msg-error" style={{ marginTop: 'var(--space-md)' }}>{msg}</p>}

      <div className="nav-row">
        <button className="btn btn-primary" onClick={() => nav('/play')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          เล่นเกม
        </button>
        <button className="btn btn-accent" onClick={() => nav('/rewards')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></svg>
          ของรางวัล
        </button>
      </div>
    </div>
  );
}
