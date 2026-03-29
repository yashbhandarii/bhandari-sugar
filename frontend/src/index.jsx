import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import * as serviceWorkerRegistration from './pwa/serviceWorker';
import './pwa/syncManager';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for PWA support (only in production)
if (import.meta.env.PROD) {
  serviceWorkerRegistration.register();
} else {
  // Unregister existing service workers in dev to avoid caching issues
  serviceWorkerRegistration.unregister();
}

