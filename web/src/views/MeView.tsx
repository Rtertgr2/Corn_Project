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

  if (!data) return <p>กำลังโหลด...</p>;
  return (
    <div>
      <p>เบอร์: {phone}</p>
      <p style={{ fontSize: 18, fontWeight: 'bold' }}>ยอดแต้ม: {data.balance}</p>

      <h4 style={{ marginTop: 16 }}>📜 ประวัติการเล่น</h4>
      {data.history.length === 0 ? (
        <p style={{ color: '#999' }}>ยังไม่เคยเล่น</p>
      ) : (
        data.history.map((h: any, i: number) => (
          <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid #eee' }}>
            {h.played_on?.slice(0, 10)} — {h.game_id} — {h.correct ? '✅ ถูก' : '❌ ผิด'} (+{h.points_awarded})
          </div>
        ))
      )}

      <h4 style={{ marginTop: 16 }}>🎫 คูปองที่แลก</h4>
      {data.redemptions.length === 0 ? (
        <p style={{ color: '#999' }}>ยังไม่เคยแลก</p>
      ) : (
        data.redemptions.map((r: any, i: number) => (
          <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid #eee' }}>
            {r.name} — โค้ด <strong>{r.coupon_code}</strong>
          </div>
        ))
      )}

      {msg && <p style={{ color: 'crimson' }}>{msg}</p>}

      <div style={{ marginTop: 16 }}>
        <button onClick={() => nav('/play')} style={btnStyle}>
          🎮 เล่นเกม
        </button>
        <button onClick={() => nav('/rewards')} style={{ ...btnStyle, background: '#ff9800' }}>
          🎁 ของรางวัล
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
