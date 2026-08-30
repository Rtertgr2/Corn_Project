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
      setLoading(false);
    }).catch((e) => { setMsg(e.message); setLoading(false); });
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

  if (!gameEntry || !Game) return <p className="msg-error">ไม่พบเกมนี้</p>;

  const onComplete = async (correct: boolean) => {
    try {
      const r = await api.play(phone, gameId!, correct);
      setMsg(`ได้ 1 แต้ม! ยอดรวม ${r.balance}`);
      setPlayed(true); setBalance(r.balance);
    } catch (e: any) { setMsg(e.message); }
  };

  return (
    <div>
      {/* Pill HUD — ปุ่มขาว ← เปลี่ยนเกม, ดาวแต้มขวา */}
      <div className="points-hud">
        <button className="btn-back-game" onClick={() => nav('/play')}>← เปลี่ยนเกม</button>
        <div className="points-right">
          <div className="star-icon">⭐</div>
          <div>
            <div className="points-value">{balance}</div>
            <div className="points-label">แต้ม</div>
          </div>
        </div>
      </div>

      <div className="card">
        <Game onComplete={onComplete} />
      </div>

      {msg && <p className="msg-success" style={{ marginTop: 'var(--space-md)' }}>{msg}</p>}
    </div>
  );
}
