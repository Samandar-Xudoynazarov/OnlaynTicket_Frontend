import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n';
import { loadRuntimeConfig } from './lib/config.ts';

async function initializeApp() {
  try {
    await loadRuntimeConfig();
    console.log('Runtime configuration loaded successfully');
  } catch (error) {
    console.warn(
      'Failed to load runtime configuration, using defaults:',
      error
    );
  }

  // Render the app
  createRoot(document.getElementById('root')!).render(<App />);
}

// Initialize the app
initializeApp();
