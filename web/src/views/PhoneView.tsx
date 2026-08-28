// web/src/views/PhoneView.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePhone } from '../PhoneContext';
import { api } from '../api';

export default function PhoneView() {
  const { setPhone } = usePhone();
  const [phone, setLocal] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const submit = async () => {
    setErr(''); setLoading(true);
    try {
      await api.start(phone);
      setPhone(phone.trim());
      nav('/play');
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="card" style={{ marginTop: 'var(--space-lg)' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto var(--space-md)' }}>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
          <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
          <line x1="9" y1="9" x2="9.01" y2="9"/>
          <line x1="15" y1="9" x2="15.01" y2="9"/>
        </svg>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)' }}>
          พร้อมเล่นเกมวันนี้หรือยัง?
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: 'var(--space-xs)' }}>
          กรอกเบอร์โทรเพื่อเริ่มสะสมแต้ม
        </p>
      </div>

      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 'var(--space-xs)' }}>
        เบอร์โทรศัพท์
      </label>
      <input
        className="input"
        inputMode="numeric"
        value={phone}
        onChange={(e) => setLocal(e.target.value)}
        placeholder="0812345678"
        maxLength={10}
        onKeyDown={(e) => e.key === 'Enter' && phone.length >= 9 && submit()}
      />

      {err && <p className="msg-error" style={{ marginTop: 'var(--space-md)' }}>{err}</p>}

      <button
        className="btn btn-accent btn-block btn-lg"
        disabled={loading || phone.length < 9}
        onClick={submit}
        style={{ marginTop: 'var(--space-md)' }}
      >
        {loading ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
              <path d="M21 12a9 9 0 11-6.219-8.56"/>
            </svg>
            กำลังโหลด...
          </span>
        ) : (
          '🌽 เริ่มเล่นเกม'
        )}
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
