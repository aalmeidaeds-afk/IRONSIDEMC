import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { initGlobalExceptionCapture } from './services/exceptionArchiveService';

// Initialize global automatic exception capture (Módulo 12)
initGlobalExceptionCapture();

// Register PWA service worker immediately for offline screen navigation
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(<App />);
