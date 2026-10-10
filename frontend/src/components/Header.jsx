import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Logo from './Logo.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import LanguageSwitcher from './LanguageSwitcher.jsx';
import './Header.css';

function Header({ authUser, onOpenAuth, onThemeToggle, theme }) {
  const { t } = useTranslation();

  return (
    <header className="header">
      <nav className="header__nav glass-panel" aria-label="Main navigation">
        <Link className="header__brand" to="/" aria-label="Sharius home">
          <Logo />
          <span>Sharius</span>
        </Link>

        <div className="header__actions">
          <LanguageSwitcher />
          <ThemeToggle onToggle={onThemeToggle} theme={theme} />
          {authUser ? (
            <Link className="header__profile" title={authUser.login} to="/profile">
              <span>{t('header.profile')}</span>
              <strong>{authUser.display_name}</strong>
            </Link>
          ) : (
            <>
              <button
                className="header__login"
                onClick={() => onOpenAuth?.('login')}
                type="button"
              >
                {t('header.login')}
              </button>
              <button
                className="header__signup"
                onClick={() => onOpenAuth?.('register')}
                type="button"
              >
                {t('header.signup')}
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Header;
