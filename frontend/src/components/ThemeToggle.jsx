import { MoonIcon, SunIcon } from './icons.jsx';
import './ThemeToggle.css';

function ThemeToggle({ onToggle, theme }) {
  const isDark = theme === 'dark';

  return (
    <button
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className="theme-toggle"
      onClick={onToggle}
      title={isDark ? 'Light theme' : 'Dark theme'}
      type="button"
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

export default ThemeToggle;
