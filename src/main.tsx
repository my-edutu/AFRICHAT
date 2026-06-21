import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import AfriAIApp from './AfriAIApp.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AfriAIApp />
  </StrictMode>,
);

if (import.meta.env.PROD && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  });
}
