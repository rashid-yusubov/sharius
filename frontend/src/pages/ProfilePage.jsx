import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import FriendsPage from './FriendsPage.jsx';
import './ProfilePage.css';

function ProfilePage({
  onChangePassword,
  onError,
  onLogout,
  onNotify,
  onProfileUpdate,
  onShareContact,
  token,
  user,
}) {
  const { t } = useTranslation();
  const [displayName, setDisplayName] = useState(user.display_name);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Change password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

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

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError(t('profile.enter_current_password', { defaultValue: 'Please enter your current password.' }));
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError(t('profile.password_min_length', { defaultValue: 'New password must be at least 6 characters.' }));
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(t('profile.passwords_do_not_match', { defaultValue: 'Passwords do not match.' }));
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError(t('profile.new_password_same_as_current', { defaultValue: 'New password must be different from current password.' }));
      return;
    }

    setIsChangingPassword(true);

    try {
      if (onChangePassword) {
        await onChangePassword({ current_password: currentPassword, new_password: newPassword });
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess(t('profile.password_changed_success', { defaultValue: 'Password changed successfully!' }));
    } catch (err) {
      if (err?.code === 'INVALID_CURRENT_PASSWORD') {
        setPasswordError(t('profile.invalid_current_password', { defaultValue: 'Incorrect current password.' }));
      } else if (err?.code === 'SAME_PASSWORD') {
        setPasswordError(t('profile.new_password_same_as_current', { defaultValue: 'New password must be different from current password.' }));
      } else {
        setPasswordError(err?.message || t('profile.change_password_failed', { defaultValue: 'Failed to change password.' }));
      }
      onError?.(err);
    } finally {
      setIsChangingPassword(false);
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
              {t('profile.logout', { defaultValue: 'Log Out' })}
            </button>
          </div>
        </form>
      </section>

      <section className="profile-page__card glass-panel">
        <div className="profile-page__identity">
          <p>{t('profile.security_title', { defaultValue: 'Security' })}</p>
          <h2>{t('profile.change_password_heading', { defaultValue: 'Change Password' })}</h2>
          <span className="profile-page__subtitle">
            {t('profile.change_password_hint', { defaultValue: 'Update your password to keep your account secure' })}
          </span>
        </div>

        <form className="profile-page__form" onSubmit={handlePasswordSubmit}>
          <label>
            {t('profile.current_password_label', { defaultValue: 'Current password' })}
            <input
              autoComplete="current-password"
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder={t('profile.current_password_placeholder', { defaultValue: 'Enter current password' })}
              required
              type="password"
              value={currentPassword}
            />
          </label>

          <label>
            {t('profile.new_password_label', { defaultValue: 'New password' })}
            <input
              autoComplete="new-password"
              minLength="6"
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder={t('profile.new_password_placeholder', { defaultValue: 'Enter new password (min 6 chars)' })}
              required
              type="password"
              value={newPassword}
            />
          </label>

          <label>
            {t('profile.confirm_password_label', { defaultValue: 'Confirm new password' })}
            <input
              autoComplete="new-password"
              minLength="6"
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder={t('profile.confirm_password_placeholder', { defaultValue: 'Repeat new password' })}
              required
              type="password"
              value={confirmPassword}
            />
          </label>

          {passwordError ? <p className="profile-page__error">{passwordError}</p> : null}
          {passwordSuccess ? <p className="profile-page__success">{passwordSuccess}</p> : null}

          <div className="profile-page__actions">
            <button className="profile-page__save" disabled={isChangingPassword} type="submit">
              {isChangingPassword
                ? t('profile.changing_password', { defaultValue: 'Changing password...' })
                : t('profile.change_password_btn', { defaultValue: 'Change Password' })}
            </button>
          </div>
        </form>
      </section>

      <FriendsPage onError={onError} onNotify={onNotify} onShareContact={onShareContact} token={token} />
    </div>
  );
}

export default ProfilePage;


