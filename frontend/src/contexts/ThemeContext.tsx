import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useCallback,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ThemeMode,
  ThemeColors,
  lightColors,
  darkColors,
} from '../theme/colors';
import { secureStorage } from '../utils/secureStorage';

const ASYNC_THEME_KEY = '@whatsapp_clone:theme_mode';

interface ThemeState {
  themeMode: ThemeMode;
  isLoaded: boolean;
}

type ThemeAction =
  | { type: 'RESTORE_THEME'; payload: ThemeMode }
  | { type: 'SET_THEME_MODE'; payload: ThemeMode };

function themeReducer(state: ThemeState, action: ThemeAction): ThemeState {
  switch (action.type) {
    case 'RESTORE_THEME':
      return {
        themeMode: action.payload,
        isLoaded: true,
      };
    case 'SET_THEME_MODE':
      return {
        ...state,
        themeMode: action.payload,
      };
    default:
      return state;
  }
}

interface ThemeContextValue {
  themeMode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  isLoaded: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [state, dispatch] = useReducer(themeReducer, {
    themeMode: 'system',
    isLoaded: false,
  });

  useEffect(() => {
    let isMounted = true;

    async function loadPersistedTheme() {
      try {
        const asyncSaved = await AsyncStorage.getItem(ASYNC_THEME_KEY);
        const secureSaved = await secureStorage.getThemeMode();
        const savedMode = asyncSaved || secureSaved;

        if (
          isMounted &&
          (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system')
        ) {
          dispatch({ type: 'RESTORE_THEME', payload: savedMode });
        } else if (isMounted) {
          dispatch({ type: 'RESTORE_THEME', payload: 'system' });
        }
      } catch {
        if (isMounted) {
          dispatch({ type: 'RESTORE_THEME', payload: 'system' });
        }
      }
    }

    loadPersistedTheme();
    return () => {
      isMounted = false;
    };
  }, []);

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    dispatch({ type: 'SET_THEME_MODE', payload: mode });
    await Promise.allSettled([
      AsyncStorage.setItem(ASYNC_THEME_KEY, mode),
      secureStorage.saveThemeMode(mode),
    ]);
  }, []);

  const isDark = useMemo(() => {
    if (state.themeMode === 'system') {
      return systemColorScheme === 'dark';
    }
    return state.themeMode === 'dark';
  }, [state.themeMode, systemColorScheme]);

  const toggleTheme = useCallback(async () => {
    const nextMode: ThemeMode = isDark ? 'light' : 'dark';
    await setThemeMode(nextMode);
  }, [isDark, setThemeMode]);

  const colors = useMemo(() => (isDark ? darkColors : lightColors), [isDark]);

  const value = useMemo(
    () => ({
      themeMode: state.themeMode,
      colors,
      isDark,
      isLoaded: state.isLoaded,
      setThemeMode,
      toggleTheme,
    }),
    [state.themeMode, state.isLoaded, colors, isDark, setThemeMode, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
