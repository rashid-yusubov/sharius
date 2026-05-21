import { Link } from 'react-router-dom';
import './AuthPage.css';

function LoginPage() {
  const handleSubmit = (event) => {
    event.preventDefault();
  };

  return (
    <section className="auth-page glass-panel">
      <div className="auth-page__intro">
        <p className="auth-page__eyebrow">Welcome back</p>
        <h1 className="auth-page__title">Pick up your shared space.</h1>
        <p className="auth-page__copy">
          Log in to continue exchanging encrypted notes, links, and files across your devices.
        </p>
      </div>

      <form className="auth-page__form" onSubmit={handleSubmit}>
        <div>
          <h1>Log In</h1>
          <p>Enter your email and password to reopen your Sharius session and continue sharing.</p>
        </div>

        <label className="auth-page__field">
          Email
          <input autoComplete="email" name="email" placeholder="you@example.com" type="email" />
        </label>

        <label className="auth-page__field">
          Password
          <input autoComplete="current-password" name="password" placeholder="Enter password" type="password" />
        </label>

        <button className="auth-page__submit" type="submit">
          Log In
        </button>

        <p className="auth-page__switch">
          Need an account? <Link to="/sign-in">Sign In</Link>
        </p>
      </form>
    </section>
  );
}

export default LoginPage;
