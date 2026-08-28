// web/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { PhoneProvider } from './PhoneContext';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <PhoneProvider>
        <App />
      </PhoneProvider>
    </HashRouter>
  </React.StrictMode>,
);
