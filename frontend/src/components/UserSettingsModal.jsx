import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getAvatarUrl } from '../api/client.js';
import {
  acceptContactRequest,
  createContactRequest,
  deleteContact,
  getContacts,
  getIncomingContactRequests,
  rejectContactRequest,
  searchUsers,
} from '../api/contacts.js';
import {
  CameraIcon,
  CloseIcon,
  LogoutIcon,
  SettingsIcon,
  SyncIcon,
  TrashIcon,
  UserIcon,
  UsersIcon,
} from './icons.jsx';
import './UserSettingsModal.css';

const SEARCH_DELAY_MS = 350;

function UserAvatar({ user, className = '' }) {
  const [imgFailed, setImgFailed] = useState(false);
  const avatarSrc = getAvatarUrl(user.avatar_url, user.updated_at);

  return (
    <div className={`user-modal__avatar ${className}`}>
      {avatarSrc && !imgFailed ? (
        <img
          alt=""
          className="user-modal__avatar-img"
          onError={() => setImgFailed(true)}
          src={avatarSrc}
        />
      ) : (
        <UserIcon />
      )}
    </div>
  );
}

function UserSettingsModal({
  authUser,
  initialTab = 'settings',
  isOpen,
  onAvatarDelete,
  onAvatarUpload,
  onChangePassword,
  onClose,
  onError,
  onLogout,
  onNotify,
  onProfileUpdate,
  onShareContact,
  token,
}) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(initialTab);

  // Settings states
  const fileInputRef = useRef(null);
  const [displayName, setDisplayName] = useState(authUser?.display_name || '');
  const [nameError, setNameError] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  // Avatar states
  const [isAvatarLoading, setIsAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [localPreviewUrl, setLocalPreviewUrl] = useState(null);

  // Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Friends states
  const [contacts, setContacts] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [contactPendingDeleteId, setContactPendingDeleteId] = useState('');

  const contactIds = useMemo(() => new Set(contacts.map((c) => c.id)), [contacts]);

  // Sync tab on open or prop change
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Sync user display name
  useEffect(() => {
    if (authUser?.display_name) {
      setDisplayName(authUser.display_name);
    }
  }, [authUser?.display_name]);

  // Reset errors when avatar changes
  useEffect(() => {
    setImgFailed(false);
    setAvatarError('');
  }, [authUser?.avatar_url, authUser?.updated_at]);

  // Clean local blob preview
  useEffect(() => {
    return () => {
      if (localPreviewUrl && localPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  // Keyboard navigation (Escape to close) and body scroll lock
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Load friends data when modal opens or token changes
  const loadFriendsData = useCallback(async () => {
    if (!token) return;
    setIsLoadingFriends(true);
    try {
      const [nextContacts, nextRequests] = await Promise.all([
        getContacts(token),
        getIncomingContactRequests(token),
      ]);
      setContacts(nextContacts);
      setIncomingRequests(nextRequests);
    } catch (err) {
      onError?.(err);
    } finally {
      setIsLoadingFriends(false);
    }
  }, [onError, token]);

  useEffect(() => {
    if (isOpen && token) {
      loadFriendsData();
    }
  }, [isOpen, token, loadFriendsData]);

  // User search debounce
  useEffect(() => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery || !token) {
      setSearchResults([]);
      setIsSearching(false);
      return undefined;
    }

    setIsSearching(true);
    const searchTimeout = window.setTimeout(() => {
      searchUsers(normalizedQuery, token)
        .then(setSearchResults)
        .catch((err) => onError?.(err))
        .finally(() => setIsSearching(false));
    }, SEARCH_DELAY_MS);

    return () => window.clearTimeout(searchTimeout);
  }, [onError, query, token]);

  if (!isOpen || !authUser) return null;

  // Avatar handlers
  const handleAvatarFile = async (file) => {
    if (!file) return;
    setAvatarError('');

    if (!file.type.startsWith('image/')) {
      setAvatarError(t('profile.avatar_invalid_type', { defaultValue: 'Поддерживаются только изображения (JPEG, PNG, WEBP, GIF).' }));
      return;
    }

    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setAvatarError(t('profile.avatar_too_large', { defaultValue: 'Размер файла не должен превышать 5 МБ.' }));
      return;
    }

    if (localPreviewUrl && localPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(localPreviewUrl);
    }
    const objectUrl = URL.createObjectURL(file);
    setLocalPreviewUrl(objectUrl);
    setImgFailed(false);
    setIsAvatarLoading(true);

    try {
      if (onAvatarUpload) {
        await onAvatarUpload(file);
      }
      setImgFailed(false);
      onNotify?.(t('profile.avatar_updated', { defaultValue: 'Аватарка успешно обновлена!' }));
    } catch (err) {
      setLocalPreviewUrl(null);
      const isNetworkError =
        err?.message?.includes('NetworkError') ||
        err?.message?.includes('Failed to fetch') ||
        err?.name === 'TypeError';
      setAvatarError(
        isNetworkError
          ? t('profile.avatar_network_error', { defaultValue: 'Сбой подключения. Проверьте интернет-соединение.' })
          : err?.message || t('profile.avatar_upload_failed', { defaultValue: 'Не удалось загрузить аватарку.' })
      );
    } finally {
      setIsAvatarLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAvatarRemove = async () => {
    setIsAvatarLoading(true);
    setAvatarError('');
    try {
      if (onAvatarDelete) {
        await onAvatarDelete();
      }
      if (localPreviewUrl && localPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(localPreviewUrl);
      }
      setLocalPreviewUrl(null);
      setImgFailed(false);
      onNotify?.(t('profile.avatar_removed', { defaultValue: 'Аватарка удалена.' }));
    } catch (err) {
      setAvatarError(err?.message || t('profile.avatar_remove_failed', { defaultValue: 'Не удалось удалить аватарку.' }));
    } finally {
      setIsAvatarLoading(false);
    }
  };

  // Name submit handler
  const handleNameSubmit = async (event) => {
    event.preventDefault();
    const nextName = displayName.trim();
    if (!nextName) {
      setNameError(t('profile.name_empty_error', { defaultValue: 'Имя не может быть пустым.' }));
      return;
    }

    setNameError('');
    setIsSavingName(true);
    try {
      await onProfileUpdate?.({ display_name: nextName });
      onNotify?.(t('app.profile_updated', { defaultValue: 'Профиль обновлен' }));
    } catch (err) {
      setNameError(err?.message || t('profile.update_failed', { defaultValue: 'Ошибка обновления профиля.' }));
    } finally {
      setIsSavingName(false);
    }
  };

  // Password submit handler
  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError(t('profile.enter_current_password', { defaultValue: 'Введите текущий пароль.' }));
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError(t('profile.password_min_length', { defaultValue: 'Новый пароль должен содержать не менее 6 символов.' }));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t('profile.passwords_do_not_match', { defaultValue: 'Пароли не совпадают.' }));
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError(t('profile.new_password_same_as_current', { defaultValue: 'Новый пароль должен отличаться от текущего.' }));
      return;
    }

    setIsChangingPassword(true);
    try {
      await onChangePassword?.({ current_password: currentPassword, new_password: newPassword });
      setPasswordSuccess(t('profile.password_changed_success', { defaultValue: 'Пароль успешно изменен!' }));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      if (err?.code === 'INVALID_CURRENT_PASSWORD' || err?.message === 'INVALID_CURRENT_PASSWORD') {
        setPasswordError(t('profile.invalid_current_password', { defaultValue: 'Неверный текущий пароль.' }));
      } else {
        setPasswordError(err?.message || t('profile.change_password_failed', { defaultValue: 'Не удалось сменить пароль.' }));
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Friends handlers
  const handleSendContactRequest = async (user) => {
    setBusyId(user.id);
    try {
      await createContactRequest(user.id, token);
      onNotify?.(t('friends.request_sent', { name: user.display_name, defaultValue: `Запрос отправлен ${user.display_name}` }));
      await loadFriendsData();
    } catch (err) {
      onError?.(err);
    } finally {
      setBusyId('');
    }
  };

  const handleAcceptRequest = async (request) => {
    setBusyId(request.id);
    try {
      await acceptContactRequest(request.id, token);
      onNotify?.(t('friends.added_to_friends', { name: request.from_user.display_name, defaultValue: `${request.from_user.display_name} добавлен в друзья` }));
      await loadFriendsData();
    } catch (err) {
      onError?.(err);
    } finally {
      setBusyId('');
    }
  };

  const handleRejectRequest = async (request) => {
    setBusyId(request.id);
    try {
      await rejectContactRequest(request.id, token);
      onNotify?.(t('friends.request_declined', { name: request.from_user.display_name, defaultValue: `Запрос от ${request.from_user.display_name} отклонен` }));
      await loadFriendsData();
    } catch (err) {
      onError?.(err);
    } finally {
      setBusyId('');
    }
  };

  const handleDeleteContact = async (contact) => {
    setBusyId(contact.id);
    try {
      await deleteContact(contact.id, token);
      setContactPendingDeleteId('');
      onNotify?.(t('friends.removed_from_friends', { name: contact.display_name, defaultValue: `${contact.display_name} удален из друзей` }));
      await loadFriendsData();
    } catch (err) {
      onError?.(err);
    } finally {
      setBusyId('');
    }
  };

  const handleShareWithContact = (contact) => {
    onShareContact?.(contact);
    onClose();
  };

  const avatarSrc = localPreviewUrl || getAvatarUrl(authUser.avatar_url, authUser.updated_at);

  return (
    <div
      aria-labelledby="user-modal-title"
      aria-modal="true"
      className="user-modal"
      role="dialog"
    >
      <button
        aria-label="Close modal overlay"
        className="user-modal__backdrop"
        onClick={onClose}
        type="button"
      />
      <div className="user-modal__panel glass-panel">
        {/* Header Tabs */}
        <div className="user-modal__header">
          <div className="user-modal__tabs" role="tablist">
            <button
              aria-selected={activeTab === 'settings'}
              className={`user-modal__tab ${activeTab === 'settings' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('settings')}
              role="tab"
              type="button"
            >
              <SettingsIcon />
              <span>{t('header.settings', { defaultValue: 'Настройки' })}</span>
            </button>
            <button
              aria-selected={activeTab === 'friends'}
              className={`user-modal__tab ${activeTab === 'friends' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('friends')}
              role="tab"
              type="button"
            >
              <UsersIcon />
              <span>{t('friends.title', { defaultValue: 'Друзья' })}</span>
              {incomingRequests.length > 0 && (
                <span className="user-modal__badge">{incomingRequests.length}</span>
              )}
            </button>
          </div>

          <button
            aria-label={t('friends.cancel_btn', { defaultValue: 'Закрыть' })}
            className="user-modal__close"
            onClick={onClose}
            type="button"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Modal Body */}
        <div className="user-modal__body">
          {activeTab === 'settings' ? (
            <div className="user-modal__settings">
              {/* Profile summary with Avatar */}
              <div className="user-modal__card">
                <div className="user-modal__profile-header">
                  <div className="user-modal__avatar-section">
                    <div
                      className={`user-modal__avatar-wrapper ${isDragOver ? 'is-drag-over' : ''}`}
                      onClick={() => fileInputRef.current?.click()}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setIsDragOver(false);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragOver(true);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragOver(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleAvatarFile(file);
                      }}
                      role="button"
                      tabIndex={0}
                      title={t('profile.change_avatar', { defaultValue: 'Сменить аватарку' })}
                    >
                      {avatarSrc && !imgFailed ? (
                        <img
                          alt=""
                          className="user-modal__avatar-img"
                          onError={() => setImgFailed(true)}
                          src={avatarSrc}
                        />
                      ) : (
                        <div className="user-modal__avatar-placeholder">
                          <UserIcon />
                        </div>
                      )}
                      <div className="user-modal__avatar-overlay">
                        <CameraIcon />
                        <span>{t('profile.change_photo_short', { defaultValue: 'Изменить' })}</span>
                      </div>
                      {isAvatarLoading && (
                        <div className="user-modal__avatar-spinner-overlay">
                          <span className="user-modal__avatar-spinner" />
                        </div>
                      )}
                    </div>

                    <input
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleAvatarFile(file);
                      }}
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      type="file"
                    />

                    <div className="user-modal__avatar-actions">
                      <button
                        className="user-modal__btn user-modal__btn--secondary user-modal__btn--sm"
                        disabled={isAvatarLoading}
                        onClick={() => fileInputRef.current?.click()}
                        type="button"
                      >
                        {authUser.avatar_url || localPreviewUrl
                          ? t('profile.change_avatar_btn', { defaultValue: 'Сменить' })
                          : t('profile.upload_avatar_btn', { defaultValue: 'Загрузить' })}
                      </button>
                      {(authUser.avatar_url || localPreviewUrl) && (
                        <button
                          className="user-modal__btn user-modal__btn--danger user-modal__btn--sm"
                          disabled={isAvatarLoading}
                          onClick={handleAvatarRemove}
                          title={t('profile.remove_avatar_title', { defaultValue: 'Удалить аватарку' })}
                          type="button"
                        >
                          <TrashIcon />
                          <span>{t('profile.remove_avatar_btn', { defaultValue: 'Удалить' })}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="user-modal__profile-info">
                    <span className="user-modal__subtitle">{t('profile.title', { defaultValue: 'Профиль' })}</span>
                    <h2 className="user-modal__name">{authUser.display_name}</h2>
                    <span className="user-modal__login">@{authUser.login}</span>
                    <span className="user-modal__hint">
                      {t('profile.avatar_size_hint', { defaultValue: 'PNG, JPG, WEBP или GIF до 5 МБ' })}
                    </span>
                    {avatarError && <p className="user-modal__error">{avatarError}</p>}
                  </div>
                </div>

                <form className="user-modal__form" onSubmit={handleNameSubmit}>
                  <label className="user-modal__label">
                    <span>{t('profile.display_name_label', { defaultValue: 'Имя' })}</span>
                    <input
                      className="user-modal__input"
                      maxLength={255}
                      onChange={(e) => setDisplayName(e.target.value)}
                      type="text"
                      value={displayName}
                    />
                  </label>
                  {nameError && <p className="user-modal__error">{nameError}</p>}
                  <div className="user-modal__form-actions">
                    <button
                      className="user-modal__btn user-modal__btn--primary"
                      disabled={isSavingName}
                      type="submit"
                    >
                      {isSavingName
                        ? t('profile.saving', { defaultValue: 'Сохранение...' })
                        : t('profile.save', { defaultValue: 'Сохранить' })}
                    </button>
                  </div>
                </form>
              </div>

              {/* Password card */}
              <div className="user-modal__card">
                <div className="user-modal__card-header">
                  <span className="user-modal__subtitle">{t('profile.security_title', { defaultValue: 'Безопасность' })}</span>
                  <h3 className="user-modal__heading">{t('profile.change_password_heading', { defaultValue: 'Смена пароля' })}</h3>
                </div>

                <form className="user-modal__form" onSubmit={handlePasswordSubmit}>
                  <label className="user-modal__label">
                    <span>{t('profile.current_password_label', { defaultValue: 'Текущий пароль' })}</span>
                    <input
                      autoComplete="current-password"
                      className="user-modal__input"
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder={t('profile.current_password_placeholder', { defaultValue: 'Введите текущий пароль' })}
                      required
                      type="password"
                      value={currentPassword}
                    />
                  </label>

                  <label className="user-modal__label">
                    <span>{t('profile.new_password_label', { defaultValue: 'Новый пароль' })}</span>
                    <input
                      autoComplete="new-password"
                      className="user-modal__input"
                      minLength={6}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={t('profile.new_password_placeholder', { defaultValue: 'Придумайте новый пароль (мин. 6 символов)' })}
                      required
                      type="password"
                      value={newPassword}
                    />
                  </label>

                  <label className="user-modal__label">
                    <span>{t('profile.confirm_password_label', { defaultValue: 'Подтверждение пароля' })}</span>
                    <input
                      autoComplete="new-password"
                      className="user-modal__input"
                      minLength={6}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t('profile.confirm_password_placeholder', { defaultValue: 'Повторите новый пароль' })}
                      required
                      type="password"
                      value={confirmPassword}
                    />
                  </label>

                  {passwordError && <p className="user-modal__error">{passwordError}</p>}
                  {passwordSuccess && <p className="user-modal__success">{passwordSuccess}</p>}

                  <div className="user-modal__form-actions">
                    <button
                      className="user-modal__btn user-modal__btn--primary"
                      disabled={isChangingPassword}
                      type="submit"
                    >
                      {isChangingPassword
                        ? t('profile.changing_password', { defaultValue: 'Смена пароля...' })
                        : t('profile.change_password_btn', { defaultValue: 'Сменить пароль' })}
                    </button>
                  </div>
                </form>
              </div>

              {/* Logout button */}
              <div className="user-modal__logout-section">
                <button
                  className="user-modal__btn user-modal__btn--danger user-modal__btn--logout"
                  onClick={() => {
                    onClose();
                    onLogout?.();
                  }}
                  type="button"
                >
                  <LogoutIcon />
                  <span>{t('profile.logout', { defaultValue: 'Выйти из системы' })}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="user-modal__friends">
              {/* Incoming requests (if any) */}
              {incomingRequests.length > 0 && (
                <div className="user-modal__card user-modal__card--highlight">
                  <div className="user-modal__card-header">
                    <span className="user-modal__subtitle">{t('friends.contacts_eyebrow', { defaultValue: 'Контакты' })}</span>
                    <h3 className="user-modal__heading">
                      {t('friends.incoming_title', { defaultValue: 'Входящие запросы' })} ({incomingRequests.length})
                    </h3>
                  </div>

                  <div className="user-modal__list">
                    {incomingRequests.map((request) => (
                      <div className="user-modal__friend-item" key={request.id}>
                        <div className="user-modal__friend-info">
                          <UserAvatar user={request.from_user} />
                          <div>
                            <strong>{request.from_user.display_name}</strong>
                            <span>@{request.from_user.login}</span>
                          </div>
                        </div>

                        <div className="user-modal__friend-actions">
                          <button
                            className="user-modal__btn user-modal__btn--primary user-modal__btn--sm"
                            disabled={busyId === request.id}
                            onClick={() => handleAcceptRequest(request)}
                            type="button"
                          >
                            {t('friends.accept_btn', { defaultValue: 'Принять' })}
                          </button>
                          <button
                            className="user-modal__btn user-modal__btn--secondary user-modal__btn--sm"
                            disabled={busyId === request.id}
                            onClick={() => handleRejectRequest(request)}
                            type="button"
                          >
                            {t('friends.decline_btn', { defaultValue: 'Отклонить' })}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Search / Add Friends */}
              <div className="user-modal__card">
                <div className="user-modal__card-header">
                  <h3 className="user-modal__heading">{t('friends.add_friend_title', { defaultValue: 'Добавить друга' })}</h3>
                </div>

                <div className="user-modal__search-box">
                  <input
                    className="user-modal__input user-modal__search-input"
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t('friends.search_placeholder', { defaultValue: 'Поиск по логину или имени' })}
                    type="search"
                    value={query}
                  />
                  {isSearching && <span className="user-modal__search-hint">{t('friends.searching', { defaultValue: 'Поиск...' })}</span>}
                </div>

                {query.trim() && (
                  <div className="user-modal__search-results">
                    {searchResults.length === 0 && !isSearching ? (
                      <p className="user-modal__empty-text">{t('friends.no_users_found', { defaultValue: 'Пользователи не найдены.' })}</p>
                    ) : (
                      <div className="user-modal__list">
                        {searchResults.map((user) => {
                          const isFriend = contactIds.has(user.id);
                          const isSelf = user.id === authUser.id;

                          return (
                            <div className="user-modal__friend-item" key={user.id}>
                              <div className="user-modal__friend-info">
                                <UserAvatar user={user} />
                                <div>
                                  <strong>{user.display_name}</strong>
                                  <span>@{user.login}</span>
                                </div>
                              </div>

                              <div className="user-modal__friend-actions">
                                {isSelf ? (
                                  <span className="user-modal__tag">{t('profile.title', { defaultValue: 'Вы' })}</span>
                                ) : isFriend ? (
                                  <span className="user-modal__tag user-modal__tag--success">
                                    {t('friends.title', { defaultValue: 'В друзьях' })}
                                  </span>
                                ) : (
                                  <button
                                    className="user-modal__btn user-modal__btn--primary user-modal__btn--sm"
                                    disabled={busyId === user.id}
                                    onClick={() => handleSendContactRequest(user)}
                                    type="button"
                                  >
                                    {t('friends.add_btn', { defaultValue: 'Добавить' })}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Friends list */}
              <div className="user-modal__card">
                <div className="user-modal__card-header user-modal__card-header--row">
                  <div>
                    <h3 className="user-modal__heading">
                      {t('friends.your_friends_title', { defaultValue: 'Ваши друзья' })} ({contacts.length})
                    </h3>
                  </div>
                  <button
                    className="user-modal__btn user-modal__btn--secondary user-modal__btn--sm"
                    disabled={isLoadingFriends}
                    onClick={loadFriendsData}
                    title={t('friends.refresh', { defaultValue: 'Обновить' })}
                    type="button"
                  >
                    <SyncIcon />
                    <span>{t('friends.refresh', { defaultValue: 'Обновить' })}</span>
                  </button>
                </div>

                {contacts.length === 0 ? (
                  <p className="user-modal__empty-text">
                    {t('friends.your_contacts_empty', { defaultValue: 'Здесь появятся ваши контакты.' })}
                  </p>
                ) : (
                  <div className="user-modal__list">
                    {contacts.map((contact) => {
                      const isConfirmingDelete = contactPendingDeleteId === contact.id;

                      return (
                        <div className="user-modal__friend-item" key={contact.id}>
                          <div className="user-modal__friend-info">
                            <UserAvatar user={contact} />
                            <div>
                              <strong>{contact.display_name}</strong>
                              <span>@{contact.login}</span>
                            </div>
                          </div>

                          <div className="user-modal__friend-actions">
                            {isConfirmingDelete ? (
                              <div className="user-modal__delete-confirm">
                                <span>{t('friends.remove_confirm_text', { defaultValue: 'Удалить?' })}</span>
                                <button
                                  className="user-modal__btn user-modal__btn--danger user-modal__btn--sm"
                                  disabled={busyId === contact.id}
                                  onClick={() => handleDeleteContact(contact)}
                                  type="button"
                                >
                                  {t('friends.remove_btn', { defaultValue: 'Удалить' })}
                                </button>
                                <button
                                  className="user-modal__btn user-modal__btn--secondary user-modal__btn--sm"
                                  onClick={() => setContactPendingDeleteId('')}
                                  type="button"
                                >
                                  {t('friends.cancel_btn', { defaultValue: 'Отмена' })}
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  className="user-modal__btn user-modal__btn--primary user-modal__btn--sm"
                                  onClick={() => handleShareWithContact(contact)}
                                  title={t('friends.share_btn', { defaultValue: 'Поделиться сессией' })}
                                  type="button"
                                >
                                  {t('friends.share_btn', { defaultValue: 'Поделиться' })}
                                </button>
                                <button
                                  className="user-modal__btn user-modal__btn--danger user-modal__btn--sm user-modal__btn--icon"
                                  onClick={() => setContactPendingDeleteId(contact.id)}
                                  title={t('friends.remove_btn', { defaultValue: 'Удалить' })}
                                  type="button"
                                >
                                  <TrashIcon />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserSettingsModal;
