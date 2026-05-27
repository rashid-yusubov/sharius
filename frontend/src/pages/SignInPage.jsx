import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './AuthPage.css';

function SignInPage({ onRegister }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ display_name: '', login: '', password: '' });
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
      await onRegister({
        display_name: formData.display_name.trim(),
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
        <p className="auth-page__eyebrow">Create access</p>
        <h1 className="auth-page__title">Start sharing in seconds.</h1>
        <p className="auth-page__copy">
          Create a Sharius account for fast device pairing, saved sessions, and private exchange rooms.
        </p>
      </div>

      <form className="auth-page__form" onSubmit={handleSubmit}>
        <div>
          <h1>Sign In</h1>
          <p>Create your Sharius account to save sessions, pair devices faster, and keep your exchanges ready.</p>
        </div>

        <label className="auth-page__field">
          Name
          <input
            autoComplete="name"
            name="display_name"
            onChange={handleChange}
            placeholder="Your name"
            required
            type="text"
            value={formData.display_name}
          />
        </label>

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
            autoComplete="new-password"
            minLength="6"
            name="password"
            onChange={handleChange}
            placeholder="Create password"
            required
            type="password"
            value={formData.password}
          />
        </label>

        {error ? <p className="auth-page__error">{error}</p> : null}

        <button className="auth-page__submit" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Creating Account...' : 'Sign In'}
        </button>

        <p className="auth-page__switch">
          Already have an account? <Link to="/login">Log In</Link>
        </p>
      </form>
    </section>
  );
}

export default SignInPage;
