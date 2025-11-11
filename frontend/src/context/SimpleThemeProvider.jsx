// SimpleThemeProvider.jsx - Updated to fix export issues
import React, { useState, useEffect } from 'react';
import { SimpleThemeContext } from './themeContext';

const SimpleThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // Use system preference
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      setTheme(systemTheme);
    }
  }, []);

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement;
    const body = document.body;
    root.setAttribute('data-theme', theme);
    
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
    
    // Save to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const value = {
    theme,
    toggleTheme
  };

  return (
    <SimpleThemeContext.Provider value={value}>
      {children}
    </SimpleThemeContext.Provider>
  );
};

export default SimpleThemeProvider;
