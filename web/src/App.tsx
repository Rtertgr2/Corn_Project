// web/src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { usePhone } from './PhoneContext';
import PhoneView from './views/PhoneView';
import PlayView from './views/PlayView';
import RewardsView from './views/RewardsView';
import MeView from './views/MeView';

function RequirePhone({ children }: { children: JSX.Element }) {
  const { phone } = usePhone();
  return phone ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: 16, fontFamily: 'system-ui, sans-serif' }}>
      <h2 style={{ textAlign: 'center', marginBottom: 16 }}>🌽 ตลาดยิ่งเจริญ</h2>
      <Routes>
        <Route path="/" element={<PhoneView />} />
        <Route path="/play" element={<RequirePhone><PlayView /></RequirePhone>} />
        <Route path="/rewards" element={<RequirePhone><RewardsView /></RequirePhone>} />
        <Route path="/me" element={<RequirePhone><MeView /></RequirePhone>} />
      </Routes>
    </div>
  );
}
