import React from 'react';
import { useTheme } from '../context/ThemeContext';
import '../styles/ThemeToggle.css';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      className={`theme-toggle ${theme}`}
      onClick={toggleTheme}
      title={`Переключить на ${theme === 'dark' ? 'светлую' : 'тёмную'} тему`}
    >
      <div className="theme-toggle-icon">
        {theme === 'dark' ? '☀️' : '🌙'}
      </div>
    </button>
  );
};

export default ThemeToggle;