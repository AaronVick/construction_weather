// tailwind.config.js
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
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
      },
    },
  },
  plugins: [forms, typography],
}