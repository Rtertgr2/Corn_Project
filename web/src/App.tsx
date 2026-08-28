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
    <>
      <div className="floating-corn" style={{ top: '10%', left: '5%', fontSize: '4rem' }}>🌽</div>
      <div className="floating-corn" style={{ top: '30%', right: '8%', fontSize: '3rem', animationDelay: '2s' }}>🌽</div>
      <div className="floating-corn" style={{ bottom: '20%', left: '10%', fontSize: '2.5rem', animationDelay: '4s' }}>🌽</div>
      <div className="corn-pattern" />
      <div className="app-shell">
        <header className="app-header">
          <div className="mascot">🌽</div>
          <h1>ตลาดยิ่งเจริญ</h1>
          <p className="subtitle">เล่นเกมส์ สะสมแต้ม แลกของรางวัล</p>
        </header>
        <Routes>
          <Route path="/" element={<PhoneView />} />
          <Route path="/play" element={<RequirePhone><GameSelectView /></RequirePhone>} />
          <Route path="/play/:gameId" element={<RequirePhone><PlayView /></RequirePhone>} />
          <Route path="/rewards" element={<RequirePhone><RewardsView /></RequirePhone>} />
          <Route path="/me" element={<RequirePhone><MeView /></RequirePhone>} />
        </Routes>
      </div>
    </>
  );
}
