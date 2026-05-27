import { Link } from 'react-router-dom';
import Logo from './Logo.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import './Header.css';

function Header({ authUser, onLogout, onThemeToggle, theme }) {
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
            <>
              <div className="header__user" title={authUser.login}>
                <span className="header__user-label">Signed in as</span>
                <strong>{authUser.display_name}</strong>
              </div>
              <button className="header__logout" onClick={onLogout} type="button">
                Log Out
              </button>
            </>
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
