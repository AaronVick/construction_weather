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
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          150: '#ebedf0',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          650: '#374151',
          700: '#374151',
          750: '#2d3748',
          800: '#1f2937',
          850: '#18212f',
          900: '#111827',
          950: '#0c1322',
        },
      },
      fontFamily: {
        sans: [
          'Inter', 
          'system-ui', 
          'sans-serif',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial'
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
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
    function({ addBase, addComponents, theme }) {
      addBase({
        '.dark': { 'color-scheme': 'dark' },
      });
      addComponents({
        '.scrollbar-thin': {
          '&::-webkit-scrollbar': { width: '6px', height: '6px' },
          '&::-webkit-scrollbar-track': { background: theme('colors.gray.200') },
          '&::-webkit-scrollbar-thumb': { background: theme('colors.gray.400'), borderRadius: '3px' },
          '&::-webkit-scrollbar-thumb:hover': { background: theme('colors.gray.500') },
          '.dark &::-webkit-scrollbar-track': { background: theme('colors.gray.800') },
          '.dark &::-webkit-scrollbar-thumb': { background: theme('colors.gray.600') },
          '.dark &::-webkit-scrollbar-thumb:hover': { background: theme('colors.gray.500') },
        },
      });
    },
  ],
};
