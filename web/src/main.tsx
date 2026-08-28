// web/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { PhoneProvider } from './PhoneContext';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <PhoneProvider>
        <App />
      </PhoneProvider>
    </HashRouter>
  </React.StrictMode>,
);
