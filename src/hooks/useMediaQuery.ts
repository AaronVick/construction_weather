// src/hooks/useMediaQuery.ts
import { useState, useEffect } from 'react';

/**
 * Custom hook for responsive design
 * @param query CSS media query string e.g. '(max-width: 768px)'
 * @returns boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    // Initialize on client side only to avoid SSR issues
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    const updateMatches = (e: MediaQueryListEvent) => setMatches(e.matches);
    
    // Set initial value
    setMatches(mediaQuery.matches);
    
    // Add listener for changes
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateMatches);
      return () => mediaQuery.removeEventListener('change', updateMatches);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(updateMatches);
      return () => mediaQuery.removeListener(updateMatches);
    }
  }, [query]);

  return matches;
}