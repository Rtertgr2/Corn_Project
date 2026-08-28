// web/src/views/RewardsView.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePhone } from '../PhoneContext';
import { api } from '../api';

export default function RewardsView() {
  const { phone } = usePhone();
  const nav = useNavigate();
  const [data, setData] = useState<{
    balance: number;
    rewards: { id: number; name: string; description: string; cost_points: number; canAfford: boolean }[];
  } | null>(null);
  const [msg, setMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [redeeming, setRedeeming] = useState<number | null>(null);

  const load = () => api.rewards(phone).then(setData).catch((e) => setMsg(e.message));
  useEffect(() => { load(); }, [phone]);

  const redeem = async (reward_id: number) => {
    setMsg('');
    setRedeeming(reward_id);
    try {
      const r = await api.redeem(phone, reward_id);
      setMsg(r.coupon_code);
      setIsSuccess(true);
      load();
    } catch (e: any) {
      setMsg(e.message);
      setIsSuccess(false);
    } finally {
      setRedeeming(null);
    }
  };

  if (!data) {
    return (
      <div>
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-btn" style={{ height: 100 }} />
        <div className="skeleton skeleton-btn" style={{ height: 100 }} />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 600 }}>ของรางวัล</h2>
        <span className="points-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          {data.balance} แต้ม
        </span>
      </div>

      {data.rewards.map((r) => (
        <div key={r.id} className="reward-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <p className="reward-name">{r.name}</p>
              <p className="reward-desc">{r.description}</p>
            </div>
            <span className="reward-cost">{r.cost_points} แต้ม</span>
          </div>
          <button
            className={`btn ${r.canAfford ? 'btn-accent' : 'btn-secondary'} btn-sm`}
            disabled={!r.canAfford || redeeming === r.id}
            onClick={() => redeem(r.id)}
            style={{ marginTop: 'var(--space-sm)', width: '100%' }}
          >
            {redeeming === r.id ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                  <path d="M21 12a9 9 0 11-6.219-8.56"/>
                </svg>
                กำลังแลก...
              </span>
            ) : r.canAfford ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></svg>
                แลกเลย
              </>
            ) : (
              'แต้มไม่พอ'
            )}
          </button>
        </div>
      ))}

      {msg && (
        <div style={{ marginTop: 'var(--space-md)' }}>
          {isSuccess ? (
            <div className="msg-success">
              <p style={{ marginBottom: 'var(--space-sm)' }}>แลกสำเร็จ!</p>
              <p className="coupon-code">{msg}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-muted-foreground)', marginTop: 'var(--space-sm)' }}>
                แสดงโค้ดนี้ให้ร้านค้าเพื่อรับรางวัล
              </p>
            </div>
          ) : (
            <p className="msg-error">{msg}</p>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div className="nav-row">
        <button className="btn btn-secondary" onClick={() => nav('/me')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          โปรไฟล์
        </button>
        <button className="btn btn-primary" onClick={() => nav('/play')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          เล่นเกม
        </button>
      </div>
    </div>
  );
}
