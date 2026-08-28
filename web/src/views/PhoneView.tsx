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
    setErr('');
    setLoading(true);
    try {
      await api.start(phone);
      setPhone(phone.trim());
      nav('/play');
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <p style={{ fontSize: 16 }}>กรอกเบอร์โทรเพื่อเริ่มเล่นเกมวันนี้</p>
      <input
        inputMode="numeric"
        value={phone}
        onChange={(e) => setLocal(e.target.value)}
        placeholder="0812345678"
        style={{ width: '100%', padding: 12, fontSize: 18, borderRadius: 8, border: '1px solid #ccc', boxSizing: 'border-box' }}
      />
      {err && <p style={{ color: 'crimson', marginTop: 8 }}>{err}</p>}
      <button
        disabled={loading || phone.length < 9}
        onClick={submit}
        style={{ width: '100%', padding: 14, marginTop: 12, fontSize: 18, borderRadius: 8, border: 'none', background: '#4caf50', color: '#fff', cursor: 'pointer' }}
      >
        {loading ? 'กำลังโหลด...' : '🌽 เริ่มเล่น'}
      </button>
    </div>
  );
}
