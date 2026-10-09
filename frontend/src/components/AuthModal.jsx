import { useEffect, useState } from 'react';
import { CloseIcon } from './icons.jsx';
import './AuthModal.css';

function AuthModal({ initialMode = 'login', isOpen, onClose, onLogin, onRegister }) {
  const [mode, setMode] = useState(initialMode);
  const [formData, setFormData] = useState({ display_name: '', login: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError('');
    }
  }, [isOpen, initialMode]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleTabSwitch = (nextMode) => {
    setMode(nextMode);
    setError('');
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await onLogin({
          login: formData.login.trim(),
          password: formData.password,
        });
      } else {
        await onRegister({
          display_name: formData.display_name.trim(),
          login: formData.login.trim(),
          password: formData.password,
        });
      }
      onClose();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      aria-labelledby="auth-modal-title"
      aria-modal="true"
      className="auth-modal"
      role="dialog"
    >
      <button
        aria-label="Close modal overlay"
        className="auth-modal__backdrop"
        onClick={onClose}
        type="button"
      />

      <div className="auth-modal__panel glass-panel">
        <button
          aria-label="Close authentication modal"
          className="auth-modal__close"
          onClick={onClose}
          type="button"
        >
          <CloseIcon />
        </button>

        <div className="auth-modal__tabs" role="tablist">
          <button
            aria-selected={mode === 'login'}
            className={`auth-modal__tab ${mode === 'login' ? 'is-active' : ''}`}
            onClick={() => handleTabSwitch('login')}
            role="tab"
            type="button"
          >
            Log In
          </button>
          <button
            aria-selected={mode === 'register'}
            className={`auth-modal__tab ${mode === 'register' ? 'is-active' : ''}`}
            onClick={() => handleTabSwitch('register')}
            role="tab"
            type="button"
          >
            Sign In
          </button>
        </div>

        <div className="auth-modal__header">
          <h2 className="auth-modal__title" id="auth-modal-title">
            {mode === 'login' ? 'Welcome Back' : 'Create Access'}
          </h2>
          <p className="auth-modal__subtitle">
            {mode === 'login'
              ? 'Log in to continue exchanging notes, links, and files across devices.'
              : 'Create your Sharius account to save sessions, pair devices faster, and manage contacts.'}
          </p>
        </div>

        <form className="auth-modal__form" onSubmit={handleSubmit}>
          {mode === 'register' ? (
            <label className="auth-modal__field">
              <span>Name</span>
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
          ) : null}

          <label className="auth-modal__field">
            <span>Login</span>
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

          <label className="auth-modal__field">
            <span>Password</span>
            <input
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={mode === 'register' ? 6 : undefined}
              name="password"
              onChange={handleChange}
              placeholder={mode === 'login' ? 'Enter password' : 'Create password (min 6 chars)'}
              required
              type="password"
              value={formData.password}
            />
          </label>

          {error ? <p className="auth-modal__error">{error}</p> : null}

          <button className="auth-modal__submit" disabled={isSubmitting} type="submit">
            {isSubmitting
              ? mode === 'login'
                ? 'Logging In...'
                : 'Creating Account...'
              : mode === 'login'
                ? 'Log In'
                : 'Sign In'}
          </button>

          <div className="auth-modal__switch">
            {mode === 'login' ? (
              <span>
                Need an account?{' '}
                <button
                  className="auth-modal__switch-button"
                  onClick={() => handleTabSwitch('register')}
                  type="button"
                >
                  Sign In
                </button>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <button
                  className="auth-modal__switch-button"
                  onClick={() => handleTabSwitch('login')}
                  type="button"
                >
                  Log In
                </button>
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default AuthModal;
