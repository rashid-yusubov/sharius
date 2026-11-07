import { useTranslation } from 'react-i18next';
import { MonitorIcon, MoonIcon, SunIcon } from './icons.jsx';
import './ThemeToggle.css';

function ThemeToggle({ onToggle, theme }) {
  const { t } = useTranslation();

  const getThemeDetails = () => {
    switch (theme) {
      case 'system':
        return {
          title: t('theme.system', 'System theme'),
          icon: <MonitorIcon />,
        };
      case 'light':
        return {
          title: t('theme.light', 'Light theme'),
          icon: <SunIcon />,
        };
      case 'dark':
      default:
        return {
          title: t('theme.dark', 'Dark theme'),
          icon: <MoonIcon />,
        };
    }
  };

  const { title, icon } = getThemeDetails();

  return (
    <button
      aria-label={title}
      className="theme-toggle"
      onClick={onToggle}
      title={title}
      type="button"
    >
      {icon}
    </button>
  );
}

export default ThemeToggle;
