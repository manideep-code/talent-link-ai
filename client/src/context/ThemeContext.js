import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  // Check local storage for preference, default to 'light'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('appTheme') || 'light';
  });

  const toggleTheme = () => {
    setTheme((prev) => {
      const newTheme = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('appTheme', newTheme);
      return newTheme;
    });
  };

  // Optional: Apply a class to the body for global CSS usage
  useEffect(() => {
    // Set body background for non-MUI elements
    document.body.style.backgroundColor = theme === 'dark' ? '#0f172a' : '#f3f4f8';
    // Expose a data-theme attribute on the root for CSS selectors
    try {
      document.documentElement.setAttribute('data-theme', theme);
    } catch (e) {
      // ignore in non-browser environments
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};