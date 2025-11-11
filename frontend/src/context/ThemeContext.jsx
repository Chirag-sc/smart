// ThemeContext.jsx - Updated to fix export issues
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { ThemeContext } from './themeContext';
import profileAPI from '../services/profileAPI';

const ThemeProvider = ({ children }) => {
  const auth = useAuth();
  const user = auth?.user;
  
  // Safety check for auth context
  if (!auth) {
    console.warn('ThemeProvider: Auth context not available');
  }
  const [theme, setTheme] = useState('light');
  const [accentColor, setAccentColor] = useState('#3B82F6');
  const [fontSize, setFontSize] = useState('medium');
  const [loading, setLoading] = useState(true);

  const loadThemePreferences = useCallback(async () => {
    if (!user) {
      // Set default theme based on system preference
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      setTheme(systemTheme);
      setLoading(false);
      return;
    }

    try {
      const response = await profileAPI.getUserPreferences();
      const data = response.data;
      
      if (data.preferences) {
        setTheme(data.preferences.theme || 'light');
        setAccentColor(data.preferences.accentColor || '#3B82F6');
        setFontSize(data.preferences.fontSize || 'medium');
      }
    } catch (error) {
      console.error('Error loading theme preferences:', error);
      // Fallback to system preference
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      setTheme(systemTheme);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const applyTheme = useCallback(() => {
    const root = document.documentElement;
    const body = document.body;
    
    // Apply theme class
    root.setAttribute('data-theme', theme);
    
    // Apply accent color as CSS custom property
    root.style.setProperty('--accent-color', accentColor);
    root.style.setProperty('--accent-color-light', `${accentColor}20`);
    root.style.setProperty('--accent-color-dark', `${accentColor}80`);
    
    // Apply font size
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px'
    };
    root.style.setProperty('--base-font-size', fontSizeMap[fontSize]);
    
    // Apply theme-specific styles
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      body.classList.add('dark');
      body.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      body.classList.add('light');
      body.classList.remove('dark');
    }
    
    // Force apply theme variables to body
    body.style.setProperty('background-color', 'var(--bg-primary)');
    body.style.setProperty('color', 'var(--text-primary)');
  }, [theme, accentColor, fontSize]);

  // Load theme preferences on mount
  useEffect(() => {
    loadThemePreferences();
  }, [loadThemePreferences]);

  // Apply theme to document
  useEffect(() => {
    applyTheme();
  }, [applyTheme]);

  const updateTheme = async (newTheme) => {
    setTheme(newTheme);
    
    if (user) {
      try {
        await profileAPI.updateUserPreferences({
          preferences: {
            theme: newTheme,
            accentColor,
            fontSize
          }
        });
      } catch (error) {
        console.error('Error saving theme preference:', error);
      }
    }
  };

  const updateAccentColor = async (newColor) => {
    setAccentColor(newColor);
    
    if (user) {
      try {
        await profileAPI.updateUserPreferences({
          preferences: {
            theme,
            accentColor: newColor,
            fontSize
          }
        });
      } catch (error) {
        console.error('Error saving accent color preference:', error);
      }
    }
  };

  const updateFontSize = async (newSize) => {
    setFontSize(newSize);
    
    if (user) {
      try {
        await profileAPI.updateUserPreferences({
          preferences: {
            theme,
            accentColor,
            fontSize: newSize
          }
        });
      } catch (error) {
        console.error('Error saving font size preference:', error);
      }
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    updateTheme(newTheme);
  };

  const value = {
    theme,
    accentColor,
    fontSize,
    loading,
    updateTheme,
    updateAccentColor,
    updateFontSize,
    toggleTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
