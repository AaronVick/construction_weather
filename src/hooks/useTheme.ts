import { useContext, useEffect } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

export interface ThemeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  // Apply the theme to <body>
  useEffect(() => {
    if (context.darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [context.darkMode]);

  return context;
};
