import { Link } from 'react-router-dom';
import './AuthPage.css';

function SignInPage() {
  const handleSubmit = (event) => {
    event.preventDefault();
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
          <input autoComplete="name" name="name" placeholder="Your name" type="text" />
        </label>

        <label className="auth-page__field">
          Email
          <input autoComplete="email" name="email" placeholder="you@example.com" type="email" />
        </label>

        <label className="auth-page__field">
          Password
          <input autoComplete="new-password" name="password" placeholder="Create password" type="password" />
        </label>

        <button className="auth-page__submit" type="submit">
          Sign In
        </button>

        <p className="auth-page__switch">
          Already have an account? <Link to="/login">Log In</Link>
        </p>
      </form>
    </section>
  );
}

export default SignInPage;
