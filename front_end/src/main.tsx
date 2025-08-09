// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { ThemeProvider } from './contexts/theme-context'

// Apply theme immediately to prevent white flash
const applyThemeImmediately = () => {
  const savedTheme = localStorage.getItem('darkMode');
  if (savedTheme !== null) {
    const isDark = JSON.parse(savedTheme);
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  } else {
    // Default to dark mode if no preference saved
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  }
};

// Apply theme before React renders
applyThemeImmediately();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
)

