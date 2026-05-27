import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './AuthPage.css';

function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ login: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError('');
    setIsSubmitting(true);

    try {
      await onLogin({
        login: formData.login.trim(),
        password: formData.password,
      });
      navigate('/');
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
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
          <p>Enter your login and password to reopen your Sharius session and continue sharing.</p>
        </div>

        <label className="auth-page__field">
          Login
          <input
            autoComplete="username"
            name="login"
            onChange={handleChange}
            placeholder="your_login"
            required
            type="text"
            value={formData.login}
          />
        </label>

        <label className="auth-page__field">
          Password
          <input
            autoComplete="current-password"
            name="password"
            onChange={handleChange}
            placeholder="Enter password"
            required
            type="password"
            value={formData.password}
          />
        </label>

        {error ? <p className="auth-page__error">{error}</p> : null}

        <button className="auth-page__submit" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Logging In...' : 'Log In'}
        </button>

        <p className="auth-page__switch">
          Need an account? <Link to="/sign-in">Sign In</Link>
        </p>
      </form>
    </section>
  );
}

export default LoginPage;
