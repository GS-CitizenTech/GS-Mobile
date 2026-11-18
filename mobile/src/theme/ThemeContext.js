import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { getActiveColors, getActiveTheme, setActiveTheme } from './colors';

const ThemeContext = createContext(null);
const THEME_STORAGE_KEY = 'alertacidadao.appearance';

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(getActiveTheme());

  useEffect(() => {
    let mounted = true;

    async function restoreTheme() {
      try {
        const storedMode = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
        const restoredMode = storedMode === 'dark' ? 'dark' : 'light';
        setActiveTheme(restoredMode);
        if (mounted) setMode(restoredMode);
      } catch (error) {
        console.warn('Não foi possível recuperar a preferência de aparência:', error);
      }
    }

    restoreTheme();
    return () => { mounted = false; };
  }, []);

  const setThemeMode = useCallback(async (nextMode) => {
    const normalizedMode = nextMode === 'dark' ? 'dark' : 'light';
    setActiveTheme(normalizedMode);
    setMode(normalizedMode);

    try {
      await SecureStore.setItemAsync(THEME_STORAGE_KEY, normalizedMode);
    } catch (error) {
      console.warn('Não foi possível salvar a preferência de aparência:', error);
    }
  }, []);

  const value = useMemo(() => ({
    mode,
    isDark: mode === 'dark',
    colors: getActiveColors(),
    setThemeMode,
  }), [mode, setThemeMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser utilizado dentro de ThemeProvider.');
  }
  return context;
}
