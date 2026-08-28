// web/src/views/PlayView.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePhone } from '../PhoneContext';
import { api } from '../api';
import { registry } from '../games/registry';

export default function PlayView() {
  const { phone } = usePhone();
  const nav = useNavigate();
  const [state, setState] = useState<{
    balance: number;
    todayPlayed: boolean;
    todayGame: string;
    todayCorrect: boolean | null;
  } | null>(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .start(phone)
      .then((r) => {
        setState(r);
        setLoading(false);
      })
      .catch((e) => {
        setMsg(e.message);
        setLoading(false);
      });
  }, [phone]);

  if (loading) return <p>กำลังโหลด...</p>;
  if (!state) return <p style={{ color: 'crimson' }}>{msg}</p>;

  if (state.todayPlayed) {
    return (
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 20 }}>วันนี้เล่นแล้วครับ 🎉</p>
        <p style={{ fontSize: 16 }}>ยอดแต้ม: {state.balance}</p>
        <div style={{ marginTop: 16 }}>
          <button onClick={() => nav('/rewards')} style={btnStyle}>
            🎁 ดูของรางวัล
          </button>
          <button onClick={() => nav('/me')} style={{ ...btnStyle, background: '#2196f3' }}>
            👤 โปรไฟล์
          </button>
        </div>
      </div>
    );
  }

  const Game = registry[state.todayGame];
  if (!Game) return <p>ไม่พบเกมวันนี้</p>;

  const onComplete = async (correct: boolean) => {
    try {
      const r = await api.play(phone, state.todayGame, correct);
      setMsg(`ได้ 1 แต้ม! ยอดรวม ${r.balance}`);
      setState({ ...state, todayPlayed: true, todayCorrect: correct });
    } catch (e: any) {
      setMsg(e.message);
    }
  };

  return (
    <div>
      <p style={{ fontSize: 14, color: '#666' }}>ยอดแต้ม: {state.balance}</p>
      <Game onComplete={onComplete} />
      {msg && <p style={{ color: 'green', marginTop: 12, fontWeight: 'bold' }}>{msg}</p>}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '12px 20px',
  margin: '8px',
  fontSize: 16,
  borderRadius: 8,
  border: 'none',
  background: '#4caf50',
  color: '#fff',
  cursor: 'pointer',
};
