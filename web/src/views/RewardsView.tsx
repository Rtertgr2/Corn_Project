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
  const [redeeming, setRedeeming] = useState<number | null>(null);

  const load = () => api.rewards(phone).then(setData).catch((e) => setMsg(e.message));
  useEffect(load, [phone]);

  const redeem = async (reward_id: number) => {
    setMsg('');
    setRedeeming(reward_id);
    try {
      const r = await api.redeem(phone, reward_id);
      setMsg(`แลกสำเร็จ! โค้ดคูปอง: ${r.coupon_code} (ยอดเหลือ ${r.balance})`);
      load();
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setRedeeming(null);
    }
  };

  if (!data) return <p>กำลังโหลด...</p>;
  return (
    <div>
      <p style={{ fontSize: 16, fontWeight: 'bold' }}>แต้มของคุณ: {data.balance}</p>
      {data.rewards.map((r) => (
        <div
          key={r.id}
          style={{ border: '1px solid #ccc', borderRadius: 8, padding: 12, margin: '10px 0' }}
        >
          <strong>{r.name}</strong> — {r.cost_points} แต้ม
          <p style={{ fontSize: 13, color: '#666', margin: '4px 0' }}>{r.description}</p>
          <button
            disabled={!r.canAfford || redeeming === r.id}
            onClick={() => redeem(r.id)}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: 'none',
              background: r.canAfford ? '#ff9800' : '#ccc',
              color: '#fff',
              cursor: r.canAfford ? 'pointer' : 'default',
            }}
          >
            {redeeming === r.id ? 'กำลังแลก...' : r.canAfford ? '🎁 แลกเลย' : 'แต้มไม่พอ'}
          </button>
        </div>
      ))}
      {msg && (
        <p style={{ color: msg.includes('สำเร็จ') ? 'green' : 'crimson', marginTop: 12, fontWeight: 'bold' }}>
          {msg}
        </p>
      )}
      <div style={{ marginTop: 16 }}>
        <button onClick={() => nav('/me')} style={btnStyle}>
          👤 โปรไฟล์
        </button>
        <button onClick={() => nav('/play')} style={{ ...btnStyle, background: '#2196f3' }}>
          🎮 เล่นเกม
        </button>
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '10px 16px',
  margin: '4px',
  fontSize: 14,
  borderRadius: 8,
  border: 'none',
  background: '#4caf50',
  color: '#fff',
  cursor: 'pointer',
};
