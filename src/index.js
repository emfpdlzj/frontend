import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { AuthProvider } from './auth/AuthContext';
import { applyAccessibilityPreferences, readAccessibilityPreferences } from './config/accessibilityPreferences';
import reportWebVitals from './reportWebVitals';

const CHUNK_RELOAD_STORAGE_KEY = 'bridgework:chunk-reload-attempted';
const chunkLoadErrorPattern = /Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk \d+ failed/i;

const recoverFromChunkLoadError = (error) => {
  const message = error?.message || String(error || '');

  if (!chunkLoadErrorPattern.test(message)) {
    return;
  }

  const reloadKey = `${CHUNK_RELOAD_STORAGE_KEY}:${window.location.pathname}`;

  if (window.sessionStorage.getItem(reloadKey) === 'true') {
    return;
  }

  window.sessionStorage.setItem(reloadKey, 'true');
  window.location.reload();
};

window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  recoverFromChunkLoadError(event.payload);
});

window.addEventListener('unhandledrejection', (event) => {
  recoverFromChunkLoadError(event.reason);
});

applyAccessibilityPreferences(readAccessibilityPreferences());

const root = ReactDOM.createRoot(document.getElementById('root'));
const app = (
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);

root.render(process.env.NODE_ENV === 'development' ? app : <React.StrictMode>{app}</React.StrictMode>);

reportWebVitals();
