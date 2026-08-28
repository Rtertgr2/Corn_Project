// web/src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { usePhone } from './PhoneContext';
import PhoneView from './views/PhoneView';
import GameSelectView from './views/GameSelectView';
import PlayView from './views/PlayView';
import RewardsView from './views/RewardsView';
import MeView from './views/MeView';

function RequirePhone({ children }: { children: JSX.Element }) {
  const { phone } = usePhone();
  return phone ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>🌽 ตลาดยิ่งเจริญ</h1>
        <p className="subtitle">เล่นเกมสะสมแต้ม แลกของรางวัล</p>
      </header>
      <Routes>
        <Route path="/" element={<PhoneView />} />
        <Route path="/play" element={<RequirePhone><GameSelectView /></RequirePhone>} />
        <Route path="/play/:gameId" element={<RequirePhone><PlayView /></RequirePhone>} />
        <Route path="/rewards" element={<RequirePhone><RewardsView /></RequirePhone>} />
        <Route path="/me" element={<RequirePhone><MeView /></RequirePhone>} />
      </Routes>
    </div>
  );
}
