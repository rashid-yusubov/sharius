import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Logo from './Logo.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import LanguageSwitcher from './LanguageSwitcher.jsx';
import { ChevronDownIcon, LogoutIcon, SettingsIcon, UserIcon } from './icons.jsx';
import './Header.css';

function Header({ authUser, onLogout, onOpenAuth, onThemeToggle, theme }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSettingsClick = () => {
    setIsMenuOpen(false);
    navigate('/profile');
  };

  const handleLogoutClick = () => {
    setIsMenuOpen(false);
    onLogout?.();
  };

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
            <div className="header__profile-menu-container" ref={menuRef}>
              <button
                aria-expanded={isMenuOpen}
                aria-haspopup="true"
                className={`header__profile ${isMenuOpen ? 'is-active' : ''}`}
                onClick={() => setIsMenuOpen((prev) => !prev)}
                title={authUser.login}
                type="button"
              >
                <span className="header__profile-avatar">
                  <UserIcon />
                </span>
                <span className="header__profile-name">{authUser.display_name || authUser.login}</span>
                <span className={`header__profile-chevron ${isMenuOpen ? 'is-open' : ''}`}>
                  <ChevronDownIcon />
                </span>
              </button>

              {isMenuOpen && (
                <div className="header__dropdown" role="menu">
                  <button
                    className="header__dropdown-item"
                    onClick={handleSettingsClick}
                    role="menuitem"
                    type="button"
                  >
                    <SettingsIcon />
                    <span>{t('header.settings', { defaultValue: 'Настройки' })}</span>
                  </button>
                  <button
                    className="header__dropdown-item header__dropdown-item--logout"
                    onClick={handleLogoutClick}
                    role="menuitem"
                    type="button"
                  >
                    <LogoutIcon />
                    <span>{t('header.logout', { defaultValue: 'Выйти' })}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="header__auth-group">
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
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Header;

