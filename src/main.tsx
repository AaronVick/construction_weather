// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';
import App from './App';
import ErrorFallback from './components/ui/ErrorFallback';
import './index.css';

// Register service worker for PWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(error => {
      console.error('Service worker registration failed:', error);
    });
  });
}

// Render app with error boundary
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => window.location.reload()}
      onError={(error, info) => {
        // Log error to monitoring service in production
        console.error('Unhandled error:', error, info);
      }}
    >
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);