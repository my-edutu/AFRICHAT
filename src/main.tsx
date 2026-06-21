import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AfriAIApp from './AfriAIApp.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AfriAIApp />
  </StrictMode>,
);
