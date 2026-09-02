
import React, { createContext, useContext, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ModeProvider, useModeContext } from '@/providers/mode-provider';
import { ThemeMode } from '../types';
import { lightColors, darkColors } from '../styles/commonStyles';

interface ThemeContextType {
  themeMode: ThemeMode;
  colors: typeof lightColors;
  toggleTheme: () => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const ThemeConsumer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const modeContext = useModeContext();
  const themeMode: ThemeMode = modeContext?.scheme === 'dark' ? 'dark' : 'light';
  
  const toggleTheme = useCallback(() => {
    const next = themeMode === 'light' ? 'dark' : 'light';
    modeContext?.setMode(next);
  }, [themeMode, modeContext]);

  const colors = useMemo(() => (themeMode === 'dark' ? darkColors : lightColors), [themeMode]);

  const value = useMemo(
    () => ({
      themeMode,
      colors,
      toggleTheme,
      isLoading: false,
    }),
    [themeMode, colors, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ModeProvider storage={AsyncStorage} storageKey="app_theme_mode" defaultMode="system">
      <ThemeConsumer>{children}</ThemeConsumer>
    </ModeProvider>
  );
};

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};

