import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import FriendsPage from './FriendsPage.jsx';
import './ProfilePage.css';

function ProfilePage({ onError, onLogout, onNotify, onProfileUpdate, onShareContact, token, user }) {
  const { t } = useTranslation();
  const [displayName, setDisplayName] = useState(user.display_name);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDisplayName(user.display_name);
  }, [user.display_name]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextDisplayName = displayName.trim();
    if (!nextDisplayName) {
      setError(t('profile.name_empty_error'));
      return;
    }

    setError('');
    setIsSaving(true);

    try {
      await onProfileUpdate({ display_name: nextDisplayName });
    } catch (submitError) {
      setError(submitError.message || t('profile.update_failed'));
      onError(submitError);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <section className="profile-page__summary glass-panel">
        <div className="profile-page__identity">
          <p>{t('profile.title')}</p>
          <h1>{user.display_name}</h1>
          <span>@{user.login}</span>
        </div>

        <form className="profile-page__form" onSubmit={handleSubmit}>
          <label>
            {t('profile.display_name_label')}
            <input
              maxLength="255"
              onChange={(event) => setDisplayName(event.target.value)}
              type="text"
              value={displayName}
            />
          </label>
          {error ? <p className="profile-page__error">{error}</p> : null}
          <div className="profile-page__actions">
            <button className="profile-page__save" disabled={isSaving} type="submit">
              {isSaving ? t('profile.saving') : t('profile.save')}
            </button>
            <button className="profile-page__logout" onClick={onLogout} type="button">
              Log Out
            </button>
          </div>
        </form>
      </section>

      <FriendsPage onError={onError} onNotify={onNotify} onShareContact={onShareContact} token={token} />
    </div>
  );
}

export default ProfilePage;

