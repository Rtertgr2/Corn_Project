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

  if (loading) {
    return (
      <div className="card">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-text" style={{ width: '80%' }} />
        <div className="skeleton skeleton-btn" />
        <div className="skeleton skeleton-btn" />
      </div>
    );
  }

  if (!state) return <p className="msg-error">{msg}</p>;

  if (state.todayPlayed) {
    return (
      <div className="card result-screen">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <p className="result-text">วันนี้เล่นแล้วครับ!</p>
        <div className="points-badge" style={{ margin: '0 auto var(--space-md)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          {state.balance} แต้ม
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

  const gameEntry = registry[state.todayGame];
  if (!gameEntry) return <p className="msg-error">ไม่พบเกมวันนี้</p>;

  const Game = gameEntry.component;

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--color-muted-foreground)' }}>
          เกมวันนี้: {gameEntry.name}
        </span>
        <span className="points-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          {state.balance} แต้ม
        </span>
      </div>

      <div className="card">
        <Game onComplete={onComplete} />
      </div>

      {msg && <p className="msg-success" style={{ marginTop: 'var(--space-md)' }}>{msg}</p>}
    </div>
  );
}
