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
    setMsg(''); setRedeeming(reward_id);
    try {
      const r = await api.redeem(phone, reward_id);
      setMsg(r.coupon_code); setIsSuccess(true); load();
    } catch (e: any) { setMsg(e.message); setIsSuccess(false); }
    finally { setRedeeming(null); }
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
      {/* Pill HUD */}
      <div className="points-hud">
        <div style={{ width: 100 }} />
        <div className="points-right">
          <div className="star-icon">⭐</div>
          <div>
            <div className="points-value">{data.balance}</div>
            <div className="points-label">แต้ม</div>
          </div>
        </div>
      </div>

      <h2 className="section-title"><span className="icon">🎁</span> ของรางวัล</h2>
      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-md)' }}>
        แลกแต้มสะสมเป็นของรางวัล
      </p>

      {data.rewards.map((r) => (
        <div key={r.id} className="reward-card">
          <div className="reward-icon">🎁</div>
          <div className="reward-info">
            <p className="reward-name">{r.name}</p>
            <p className="reward-desc">{r.description}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className="reward-cost">⭐ {r.cost_points}</span>
            <button
              className={`btn ${r.canAfford ? 'btn-accent' : 'btn-secondary'} btn-sm`}
              disabled={!r.canAfford || redeeming === r.id}
              onClick={() => redeem(r.id)}
              style={{ marginTop: 'var(--space-xs)', minWidth: 80 }}
            >
              {redeeming === r.id ? '...' : r.canAfford ? 'แลก' : 'ไม่พอ'}
            </button>
          </div>
        </div>
      ))}

      {msg && (
        <div style={{ marginTop: 'var(--space-md)' }}>
          {isSuccess ? (
            <div className="msg-success">
              <p style={{ marginBottom: 'var(--space-sm)' }}>✅ แลกสำเร็จ!</p>
              <p className="coupon-code">{msg}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 'var(--space-sm)' }}>
                แสดงโค้ดนี้ให้ร้านค้าเพื่อรับรางวัล
              </p>
            </div>
          ) : (
            <p className="msg-error">{msg}</p>
          )}
        </div>
      )}

      <div className="nav-row">
        <button className="btn btn-secondary" onClick={() => nav('/me')}>👤 โปรไฟล์</button>
        <button className="btn btn-primary" onClick={() => nav('/play')}>🎮 เล่นเกม</button>
      </div>
    </div>
  );
}
