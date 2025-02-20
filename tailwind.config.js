// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class', // Enable class-based dark mode
    theme: {
      extend: {
        colors: {
          // Main brand colors
          primary: {
            50: '#eef2ff',
            100: '#e0e7ff',
            200: '#c7d2fe',
            300: '#a5b4fc',
            400: '#818cf8',
            500: '#6366f1', // Primary color
            600: '#4f46e5',
            700: '#4338ca',
            800: '#3730a3',
            900: '#312e81',
            950: '#1e1b4b',
          },
          // Success colors
          success: {
            50: '#f0fdf4',
            100: '#dcfce7',
            200: '#bbf7d0',
            300: '#86efac',
            400: '#4ade80',
            500: '#22c55e', // Success color
            600: '#16a34a',
            700: '#15803d',
            800: '#166534',
            900: '#14532d',
            950: '#052e16',
          },
          // Warning colors
          warning: {
            50: '#fffbeb',
            100: '#fef3c7',
            200: '#fde68a',
            300: '#fcd34d',
            400: '#fbbf24',
            500: '#f59e0b', // Warning color
            600: '#d97706',
            700: '#b45309',
            800: '#92400e',
            900: '#78350f',
            950: '#451a03',
          },
          // Danger colors
          danger: {
            50: '#fef2f2',
            100: '#fee2e2',
            200: '#fecaca',
            300: '#fca5a5',
            400: '#f87171',
            500: '#ef4444', // Danger color
            600: '#dc2626',
            700: '#b91c1c',
            800: '#991b1b',
            900: '#7f1d1d',
            950: '#450a0a',
          },
          // Gray extended palette for dark mode
          gray: {
            50: '#f9fafb',
            100: '#f3f4f6',
            150: '#ebedf0', // Custom intermediate shade
            200: '#e5e7eb',
            300: '#d1d5db',
            400: '#9ca3af',
            500: '#6b7280',
            600: '#4b5563',
            650: '#374151', // Custom intermediate shade
            700: '#374151',
            750: '#2d3748', // Custom intermediate shade
            800: '#1f2937',
            850: '#18212f', // Custom intermediate shade
            900: '#111827',
            950: '#0c1322', // Extra dark for dark mode
          },
        },
        fontFamily: {
          sans: [
            'Inter var',
            'Inter',
            'ui-sans-serif',
            'system-ui',
            '-apple-system',
            'BlinkMacSystemFont',
            'Segoe UI',
            'Roboto',
            'Helvetica Neue',
            'Arial',
            'sans-serif',
          ],
          mono: [
            'JetBrains Mono',
            'Menlo',
            'Monaco',
            'Consolas',
            'Liberation Mono',
            'Courier New',
            'monospace',
          ],
        },
        boxShadow: {
          'light-ring': '0 0 0 2px rgba(255, 255, 255, 0.1)',
          'dark-ring': '0 0 0 2px rgba(0, 0, 0, 0.05)',
        },
        borderRadius: {
          '4xl': '2rem',
        },
        animation: {
          'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          'fade-in': 'fadeIn 0.5s ease-out',
          'slide-up': 'slideUp 0.3s ease-out',
          'slide-down': 'slideDown 0.3s ease-out',
          'slide-in-right': 'slideInRight 0.3s ease-out',
          'slide-in-left': 'slideInLeft 0.3s ease-out',
          'bounce-once': 'bounce 1s ease-out 1',
        },
        keyframes: {
          fadeIn: {
            '0%': { opacity: '0' },
            '100%': { opacity: '1' },
          },
          slideUp: {
            '0%': { transform: 'translateY(10px)', opacity: '0' },
            '100%': { transform: 'translateY(0)', opacity: '1' },
          },
          slideDown: {
            '0%': { transform: 'translateY(-10px)', opacity: '0' },
            '100%': { transform: 'translateY(0)', opacity: '1' },
          },
          slideInRight: {
            '0%': { transform: 'translateX(20px)', opacity: '0' },
            '100%': { transform: 'translateX(0)', opacity: '1' },
          },
          slideInLeft: {
            '0%': { transform: 'translateX(-20px)', opacity: '0' },
            '100%': { transform: 'translateX(0)', opacity: '1' },
          },
        },
        opacity: {
          '15': '0.15',
          '35': '0.35',
          '85': '0.85',
          '95': '0.95',
        },
        spacing: {
          '18': '4.5rem',
          '112': '28rem',
          '128': '32rem',
          '144': '36rem',
        },
        maxWidth: {
          '8xl': '88rem',
          '9xl': '96rem',
        },
        minHeight: {
          '14': '3.5rem',
        },
        zIndex: {
          '60': '60',
          '70': '70',
          '80': '80',
          '90': '90',
          '100': '100',
        },
        transitionProperty: {
          'height': 'height',
          'spacing': 'margin, padding',
        },
        typography: (theme) => ({
          DEFAULT: {
            css: {
              maxWidth: 'none',
              color: theme('colors.gray.700'),
              a: {
                color: theme('colors.primary.500'),
                '&:hover': {
                  color: theme('colors.primary.600'),
                },
              },
            },
          },
          dark: {
            css: {
              color: theme('colors.gray.300'),
              a: {
                color: theme('colors.primary.400'),
                '&:hover': {
                  color: theme('colors.primary.300'),
                },
              },
              h1: {
                color: theme('colors.gray.100'),
              },
              h2: {
                color: theme('colors.gray.100'),
              },
              h3: {
                color: theme('colors.gray.100'),
              },
              h4: {
                color: theme('colors.gray.100'),
              },
              h5: {
                color: theme('colors.gray.100'),
              },
              h6: {
                color: theme('colors.gray.100'),
              },
              strong: {
                color: theme('colors.gray.100'),
              },
              code: {
                color: theme('colors.gray.200'),
              },
              figcaption: {
                color: theme('colors.gray.400'),
              },
              blockquote: {
                color: theme('colors.gray.300'),
                borderLeftColor: theme('colors.gray.600'),
              },
            },
          },
        }),
      },
    },
    plugins: [
      require('@tailwindcss/forms'),
      require('@tailwindcss/typography'),
      require('@tailwindcss/aspect-ratio'),
      // Custom plugin for dark mode typography
      function({ addBase, addComponents, theme }) {
        addBase({
          '.dark': {
            'color-scheme': 'dark',
          },
        });
        
        // Add components for custom scrollbars
        addComponents({
          '.scrollbar-thin': {
            '&::-webkit-scrollbar': {
              width: '6px',
              height: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: theme('colors.gray.200'),
            },
            '&::-webkit-scrollbar-thumb': {
              background: theme('colors.gray.400'),
              borderRadius: '3px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: theme('colors.gray.500'),
            },
            '.dark &::-webkit-scrollbar-track': {
              background: theme('colors.gray.800'),
            },
            '.dark &::-webkit-scrollbar-thumb': {
              background: theme('colors.gray.600'),
            },
            '.dark &::-webkit-scrollbar-thumb:hover': {
              background: theme('colors.gray.500'),
            },
          },
        });
      },
    ],
    // Support dark mode variant for all utilities
    variants: {
      extend: {
        backgroundColor: ['dark'],
        textColor: ['dark'],
        borderColor: ['dark'],
        ringColor: ['dark'],
        ringOffsetColor: ['dark'],
        opacity: ['dark'],
        typography: ['dark'],
      }
    }
  };