import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        // Check for updates every hour
        setInterval(() => registration.update().catch(() => {}), 60 * 60 * 1000);

        // When a new SW takes over, reload once so the user gets the latest version
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (refreshing) return;
          refreshing = true;
          window.location.reload();
        });
      })
      .catch((error) => {
        console.error('[PWA] Service worker registration failed:', error);
      });
  });
} else {
  console.warn('[PWA] Service workers are not supported in this browser.');
}
