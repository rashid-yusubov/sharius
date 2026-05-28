import { Link } from 'react-router-dom';
import Logo from './Logo.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import './Header.css';

function Header({ authUser, onThemeToggle, theme }) {
  return (
    <header className="header">
      <nav className="header__nav glass-panel" aria-label="Main navigation">
        <Link className="header__brand" to="/" aria-label="Sharius home">
          <Logo />
          <span>Sharius</span>
        </Link>

        <div className="header__actions">
          <ThemeToggle onToggle={onThemeToggle} theme={theme} />
          {authUser ? (
            <Link className="header__profile" title={authUser.login} to="/profile">
              <span>Profile</span>
              <strong>{authUser.display_name}</strong>
            </Link>
          ) : (
            <>
              <Link className="header__login" to="/login">
                Log In
              </Link>
              <Link className="header__signup" to="/sign-in">
                Sign In
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Header;
