import { useEffect, useState } from 'react';

import { themeStorage } from '../utils/storage';

export function useTheme(): [theme: 'light' | 'dark', toggleTheme: () => void] {
  const [theme, setTheme] = useState<'light' | 'dark'>(themeStorage.get());

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    themeStorage.set(theme);
  }, [theme]);

  const toggleTheme = (): void => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  };

  return [theme, toggleTheme];
}
