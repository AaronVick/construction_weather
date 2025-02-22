<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/src/assets/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#3b82f6" />
    <meta name="description" content="WeatherCrew - Weather-based crew management system" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    
    <!-- ✅ Ensure Manifest is correctly linked -->
    <link rel="manifest" href="/manifest.json">

    <!-- ✅ Use Google Fonts for Inter & JetBrains Mono -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link 
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=JetBrains+Mono:wght@400;700&display=swap"
    />

    <style>
      :root {
        --font-sans: 'Inter', sans-serif;
        --font-mono: 'JetBrains Mono', monospace;
      }

      body {
        font-family: var(--font-sans);
        background-color: #f9fafb;
        color: #333;
        line-height: 1.6;
      }

      *, *::before, *::after {
        box-sizing: border-box;
      }

      .app-loading {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background-color: #f9fafb;
        z-index: 9999;
        transition: opacity 0.2s ease-out;
      }

      .dark .app-loading {
        background-color: #111827;
      }

      .app-loading-logo {
        width: 80px;
        height: 80px;
        margin-bottom: 24px;
      }

      .app-loading-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid rgba(59, 130, 246, 0.2);
        border-radius: 50%;
        border-top-color: #3b82f6;
        animation: spin 1s linear infinite;
      }

      .app-loading-text {
        margin-top: 16px;
        font-family: var(--font-sans);
        font-size: 16px;
        color: #4b5563;
      }

      .dark .app-loading-text {
        color: #9ca3af;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    </style>

    <title>WeatherCrew Dashboard</title>
  </head>
  <body>
    <div id="app-loading" class="app-loading">
      <img src="/src/assets/logo.svg" alt="WeatherCrew Logo" class="app-loading-logo" />
      <div class="app-loading-spinner"></div>
      <p class="app-loading-text">Loading dashboard...</p>
    </div>

    <div id="root"></div>

    <script type="module" src="/src/main.tsx"></script>

    <script>
      document.addEventListener('DOMContentLoaded', () => {
        console.log('✅ DOM Loaded - Checking app initialization...');
        
        const loadingScreen = document.getElementById('app-loading');
        if (loadingScreen) {
          setTimeout(() => {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
              loadingScreen.remove();
            }, 200);
          }, 500);
        }
      });

      if (
        localStorage.getItem('darkMode') === 'true' ||
        (localStorage.getItem('darkMode') === null &&
          window.matchMedia('(prefers-color-scheme: dark)').matches)
      ) {
        document.documentElement.classList.add('dark');
      }
    </script>
  </body>
</html>
