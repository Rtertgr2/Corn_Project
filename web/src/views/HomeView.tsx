// web/src/views/HomeView.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePhone } from '../PhoneContext';
import { api } from '../api';

type Tab = 'history' | 'rewards';

export default function HomeView() {
  const { phone } = usePhone();
  const nav = useNavigate();
  const [tab, setTab] = useState<Tab>('history');
  const [meData, setMeData] = useState<{ balance: number; history: any[]; redemptions: any[] } | null>(null);
  const [rewardsData, setRewardsData] = useState<{ balance: number; rewards: any[] } | null>(null);
  const [msg, setMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [redeeming, setRedeeming] = useState<number | null>(null);

  useEffect(() => {
    if (!phone) return;
    api.me(phone).then(setMeData).catch((e) => setMsg(e.message));
    api.rewards(phone).then(setRewardsData).catch(() => {});
  }, [phone]);

  const loadRewards = () => {
    if (!phone) return;
    api.rewards(phone).then(setRewardsData).catch(() => {});
  };

  const redeem = async (reward_id: number) => {
    if (!phone) return;
    setMsg(''); setRedeeming(reward_id);
    try {
      const r = await api.redeem(phone, reward_id);
      setMsg(r.coupon_code); setIsSuccess(true);
      loadRewards();
      api.me(phone).then(setMeData).catch(() => {});
    } catch (e: any) { setMsg(e.message); setIsSuccess(false); }
    finally { setRedeeming(null); }
  };

  const level = meData ? Math.floor(meData.balance / 10) + 1 : 1;

  if (!meData) {
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
      {/* Profile Card */}
      <div className="card-3d" style={{ textAlign: 'center', marginBottom: 'var(--space-md)' }}>
        <div style={{
          width: 72, height: 72, borderRadius: 'var(--radius-full)',
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto var(--space-md)', fontSize: '2.2rem', boxShadow: 'var(--shadow-md)',
        }}>
          👤
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{phone}</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)' }}>
          <span className="level-badge">{level}</span>
          <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>ผู้เล่นเลเวล {level}</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="quick-stats" style={{ marginBottom: 'var(--space-md)' }}>
        <div className="quick-stat">
          <div className="stat-value">{meData.balance}</div>
          <div className="stat-label">แต้ม</div>
        </div>
        <div className="quick-stat">
          <div className="stat-value">{meData.history.length}</div>
          <div className="stat-label">เกมที่เล่น</div>
        </div>
        <div className="quick-stat">
          <div className="stat-value">{meData.redemptions.length}</div>
          <div className="stat-label">คูปอง</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
        <button
          className={`btn ${tab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('history')}
          style={{ flex: 1 }}
        >
          📜 ประวัติการเล่น
        </button>
        <button
          className={`btn ${tab === 'rewards' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('rewards')}
          style={{ flex: 1 }}
        >
          🎁 ของสมนาคุณ
        </button>
      </div>

      {/* Tab Content */}
      {tab === 'history' && (
        <div className="card-3d" style={{ marginBottom: 'var(--space-md)' }}>
          <h3 className="section-title" style={{ marginTop: 0 }}><span className="icon">📜</span> ประวัติการเล่น</h3>
          {meData.history.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', padding: 'var(--space-md) 0' }}>ยังไม่เคยเล่น</p>
          ) : (
            meData.history.map((h: any, i: number) => (
              <div key={i} className="history-item">
                <span className="history-date">{h.played_on?.slice(0, 10)}</span>
                <span className="history-game">{h.game_id === 'quiz' ? 'คำถาม' : h.game_id === 'arrange' ? 'จับคู่ข้าวโพด' : h.game_id === 'merge' ? 'ผสานข้าวโพด' : h.game_id}</span>
                <span className={`history-result ${h.correct ? 'correct' : 'wrong'}`}>
                  {h.correct ? '✅' : '❌'} +{h.points_awarded}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'rewards' && (
        <div className="card-3d" style={{ marginBottom: 'var(--space-md)' }}>
          <h3 className="section-title" style={{ marginTop: 0 }}><span className="icon">🎁</span> ของสมนาคุณ</h3>
          {rewardsData?.rewards.map((r) => (
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
        </div>
      )}

      {/* Navigation */}
      <div className="nav-row">
        <button className="btn btn-primary" onClick={() => nav('/play')}>
          🎮 เล่นเกม
        </button>
        <button className="btn btn-secondary" onClick={() => nav('/login')}>
          📱 เปลี่ยนเบอร์
        </button>
      </div>
    </div>
  );
}
