import { useEffect, useState } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState(() =>
    document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'light' ? '#f5f6fc' : '#090e1c');
    try {
      localStorage.setItem('arena-theme', theme);
    } catch {
      // Keep the in-memory choice usable in private/restricted browser contexts.
    }
  }, [theme]);

  useEffect(() => {
    const sync = (event) => {
      if (event.key === 'arena-theme' || event.key === null) {
        setTheme(event.newValue === 'light' ? 'light' : 'dark');
      }
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  return {
    theme,
    toggleTheme: () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')),
  };
}
