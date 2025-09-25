
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeMode } from '../types';
import { lightColors, darkColors } from '../styles/commonStyles';

const THEME_STORAGE_KEY = 'app_theme_mode';

export const useTheme = () => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        setThemeMode(savedTheme as ThemeMode);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    const newTheme: ThemeMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newTheme);
    
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const colors = themeMode === 'light' ? lightColors : darkColors;

  return {
    themeMode,
    colors,
    toggleTheme,
    isLoading,
  };
};
