// web/src/views/PlayView.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePhone } from '../PhoneContext';
import { api } from '../api';
import { registry } from '../games/registry';

export default function PlayView() {
  const { phone } = usePhone();
  const { gameId } = useParams<{ gameId: string }>();
  const nav = useNavigate();
  const [balance, setBalance] = useState(0);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [played, setPlayed] = useState(false);

  const gameEntry = gameId ? registry[gameId] : null;
  const Game = gameEntry?.component;

  useEffect(() => {
    if (!gameId || !gameEntry) {
      nav('/play', { replace: true });
      return;
    }
    api.start(phone).then((r) => {
      setBalance(r.balance);
      if (r.todayPlayed) {
        setPlayed(true);
      }
      setLoading(false);
    }).catch((e) => {
      setMsg(e.message);
      setLoading(false);
    });
  }, [phone, gameId, gameEntry, nav]);

  if (loading) {
    return (
      <div className="card">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-text" style={{ width: '80%' }} />
        <div className="skeleton skeleton-btn" />
      </div>
    );
  }

  if (!gameEntry || !Game) {
    return <p className="msg-error">ไม่พบเกมนี้</p>;
  }

  if (played) {
    return (
      <div className="card result-screen">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <p className="result-text">วันนี้เล่นแล้วครับ!</p>
        <div className="points-badge" style={{ margin: '0 auto var(--space-md)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          {balance} แต้ม
        </div>
        <div className="nav-row">
          <button className="btn btn-accent" onClick={() => nav('/rewards')}>ของรางวัล</button>
          <button className="btn btn-secondary" onClick={() => nav('/me')}>โปรไฟล์</button>
        </div>
      </div>
    );
  }

  const onComplete = async (correct: boolean) => {
    try {
      const r = await api.play(phone, gameId!, correct);
      setMsg(`ได้ 1 แต้ม! ยอดรวม ${r.balance}`);
      setPlayed(true);
      setBalance(r.balance);
    } catch (e: any) {
      setMsg(e.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
        <button className="btn btn-sm btn-secondary" onClick={() => nav('/play')} style={{ padding: '6px 12px', minHeight: 36 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          เปลี่ยนเกม
        </button>
        <span className="points-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          {balance} แต้ม
        </span>
      </div>

      <div className="card">
        <Game onComplete={onComplete} />
      </div>

      {msg && <p className="msg-success" style={{ marginTop: 'var(--space-md)' }}>{msg}</p>}
    </div>
  );
}
