// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';
import App from './App';
import ErrorFallback from './components/ui/ErrorFallback';
import './index.css';

console.log('Application initialization started');

// Check for root element early
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Root element not found - critical error');
} else {
  console.log('Root element found, proceeding with initialization');
}

// Enhanced error handler for ErrorBoundary
const handleError = (error: Error, info: ErrorInfo) => {
  console.error('Unhandled error in application:', {
    error,
    message: error.message,
    stack: error.stack,
    componentStack: info.componentStack,
    timestamp: new Date().toISOString()
  });
};

// Track render attempts
let renderAttempts = 0;
const maxRenderAttempts = 3;

// Function to attempt render with retry logic
const attemptRender = () => {
  renderAttempts++;
  console.log(`Attempting to render application (Attempt ${renderAttempts}/${maxRenderAttempts})`);

  try {
    console.log('Creating React root');
    const root = ReactDOM.createRoot(rootElement!);
    
    console.log('Starting application render');
    root.render(
      <React.StrictMode>
        <ErrorBoundary
          FallbackComponent={ErrorFallback}
          onReset={() => {
            console.log('Error boundary reset triggered, reloading page');
            window.location.reload();
          }}
          onError={handleError}
        >
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );

    console.log('Initial render completed successfully');
    
  } catch (error) {
    console.error(`Render attempt ${renderAttempts} failed:`, {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    if (renderAttempts < maxRenderAttempts) {
      console.log(`Retrying render in 1 second... (${maxRenderAttempts - renderAttempts} attempts remaining)`);
      setTimeout(attemptRender, 1000);
    } else {
      console.error('Maximum render attempts reached, application failed to start');
      if (rootElement) {
        rootElement.innerHTML = `
          <div style="padding: 20px; text-align: center;">
            <h1>Application Failed to Load</h1>
            <p>Please refresh the page or contact support if the problem persists.</p>
          </div>
        `;
      }
    }
  }
};

// Start the application
console.log('Starting application render process');
attemptRender();

// Log any unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection:', {
    reason: event.reason,
    promise: event.promise,
    timestamp: new Date().toISOString()
  });
});

// Log any uncaught errors
window.addEventListener('error', (event) => {
  console.error('Uncaught Error:', {
    error: event.error,
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    timestamp: new Date().toISOString()
  });
});