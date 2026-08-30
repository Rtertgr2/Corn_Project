// web/src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { usePhone } from './PhoneContext';
import HomeView from './views/HomeView';
import PhoneView from './views/PhoneView';
import GameSelectView from './views/GameSelectView';
import PlayView from './views/PlayView';
import RewardsView from './views/RewardsView';
import MeView from './views/MeView';

function RequirePhone({ children }: { children: JSX.Element }) {
  const { phone } = usePhone();
  return phone ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <>
      <div className="grassland-bg" />
      <div className="floating-corn" style={{ top: '10%', left: '5%', animationDelay: '0s' }}>🌽</div>
      <div className="floating-corn" style={{ top: '30%', right: '8%', animationDelay: '2s' }}>🌽</div>
      <div className="floating-corn" style={{ bottom: '20%', left: '10%', animationDelay: '4s' }}>🌽</div>
      <div className="corn-pattern" />
      
      <div className="app-shell">
        <header className="app-header">
          <div className="mascot">🌽</div>
          <h1>ข้าวนัวโพด</h1>
          <p className="subtitle">เล่นเกมส์ สะสมแต้ม แลกของรางวัล</p>
        </header>
        <Routes>
          <Route path="/" element={<RequirePhone><HomeView /></RequirePhone>} />
          <Route path="/login" element={<PhoneView />} />
          <Route path="/play" element={<RequirePhone><GameSelectView /></RequirePhone>} />
          <Route path="/play/:gameId" element={<RequirePhone><PlayView /></RequirePhone>} />
          <Route path="/rewards" element={<RequirePhone><RewardsView /></RequirePhone>} />
          <Route path="/me" element={<RequirePhone><MeView /></RequirePhone>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
}
