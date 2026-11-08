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
  CalendarIcon,
  CameraIcon,
  CheckIcon,
  ChevronDownIcon,
  CloseIcon,
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
  LogoutIcon,
  MonitorIcon,
  MoonIcon,
  PaletteIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  ShieldIcon,
  SunIcon,
  SyncIcon,
  TrashIcon,
  UserIcon,
  UsersIcon,
} from './icons.jsx';
import { FlagIcon } from './FlagIcon.jsx';
import './UserSettingsModal.css';

const SEARCH_DELAY_MS = 350;

const LANGUAGES = [
  { code: 'ru', name: 'Русский' },
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'zh', name: '中文' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'ko', name: '한국어' },
];

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

const normalizeTab = (tab) => {
  if (tab === 'settings') return 'account';
  if (tab === 'interface') return 'appearance';
  return tab;
};

function UserSettingsModal({
  authUser,
  initialTab = 'account',
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
  onThemeChange,
  theme = 'system',
  token,
}) {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState(() => normalizeTab(initialTab));

  // Settings states
  const fileInputRef = useRef(null);
  const bodyRef = useRef(null);
  const langDropdownRef = useRef(null);
  const [displayName, setDisplayName] = useState(authUser?.display_name || '');
  const [nameError, setNameError] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  // Scroll content to top whenever active tab changes
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0, behavior: 'instant' });
    setIsLangDropdownOpen(false);
  }, [activeTab]);

  // Click outside to close language dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target)) {
        setIsLangDropdownOpen(false);
      }
    }
    if (isLangDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLangDropdownOpen]);

  const memberSince = useMemo(() => {
    if (!authUser?.created_at) return null;
    try {
      const date = new Date(authUser.created_at);
      if (Number.isNaN(date.getTime())) return null;
      return date.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return null;
    }
  }, [authUser?.created_at]);

  const currentLang = useMemo(() => {
    return (
      LANGUAGES.find(
        (lang) =>
          i18n.resolvedLanguage === lang.code ||
          i18n.resolvedLanguage?.startsWith(lang.code)
      ) || LANGUAGES[0]
    );
  }, [i18n.resolvedLanguage]);

  const handleCopyId = () => {
    if (!authUser?.id) return;
    navigator.clipboard?.writeText(authUser.id);
    setCopiedId(true);
    onNotify?.(t('profile.id_copied', { defaultValue: 'ID пользователя скопирован' }));
    setTimeout(() => setCopiedId(false), 2000);
  };

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
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Password strength score (1 = weak, 2 = medium, 3 = strong)
  const passwordStrength = useMemo(() => {
    if (!newPassword) return 0;
    let score = 0;
    if (newPassword.length >= 6) score += 1;
    if (newPassword.length >= 8 && (/[A-Z]/.test(newPassword) || /[0-9]/.test(newPassword))) score += 1;
    if (newPassword.length >= 10 && /[^A-Za-z0-9]/.test(newPassword)) score += 1;
    return Math.max(1, Math.min(score, 3));
  }, [newPassword]);

  // Reset password form helper
  const resetPasswordForm = useCallback(() => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setPasswordSuccess('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  }, []);

  // Reset password fields when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetPasswordForm();
    }
  }, [isOpen, resetPasswordForm]);

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
      setActiveTab(normalizeTab(initialTab));
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
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
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
        {/* Sidebar */}
        <aside className="user-modal__sidebar">
          <div className="user-modal__sidebar-header">
            <h2 className="user-modal__sidebar-title" id="user-modal-title">
              {t('header.settings', { defaultValue: 'Настройки' })}
            </h2>
          </div>

          <nav className="user-modal__sidebar-nav" role="tablist">
            <button
              aria-selected={activeTab === 'account'}
              className={`user-modal__sidebar-tab ${activeTab === 'account' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('account')}
              role="tab"
              type="button"
            >
              <UserIcon />
              <span>{t('profile.account_tab', { defaultValue: 'Аккаунт' })}</span>
            </button>
            <button
              aria-selected={activeTab === 'security'}
              className={`user-modal__sidebar-tab ${activeTab === 'security' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('security')}
              role="tab"
              type="button"
            >
              <ShieldIcon />
              <span>{t('profile.security_title', { defaultValue: 'Безопасность' })}</span>
            </button>
            <button
              aria-selected={activeTab === 'appearance'}
              className={`user-modal__sidebar-tab ${activeTab === 'appearance' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('appearance')}
              role="tab"
              type="button"
            >
              <PaletteIcon />
              <span>{t('profile.appearance_title', { defaultValue: 'Интерфейс' })}</span>
            </button>
            <button
              aria-selected={activeTab === 'friends'}
              className={`user-modal__sidebar-tab ${activeTab === 'friends' ? 'is-active' : ''}`}
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
          </nav>

          <div className="user-modal__sidebar-footer">
            <button
              className="user-modal__sidebar-logout"
              onClick={() => {
                onClose();
                onLogout?.();
              }}
              title={t('profile.logout', { defaultValue: 'Выйти из системы' })}
              type="button"
            >
              <LogoutIcon />
              <span>{t('profile.logout', { defaultValue: 'Выйти' })}</span>
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <div className="user-modal__content">
          <div className="user-modal__topbar">
            <h3 className="user-modal__topbar-title">
              {activeTab === 'account'
                ? t('profile.account_tab', { defaultValue: 'Аккаунт' })
                : activeTab === 'security'
                ? t('profile.security_title', { defaultValue: 'Безопасность' })
                : activeTab === 'appearance'
                ? t('profile.appearance_title', { defaultValue: 'Интерфейс' })
                : t('friends.title', { defaultValue: 'Друзья' })}
            </h3>
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
          <div className="user-modal__body" ref={bodyRef}>
            {activeTab === 'account' && (
              <div className="user-modal__tab-content user-modal__settings" key="account">
                {/* Profile summary with Avatar */}
              <div className="user-modal__card user-modal__card--profile">
                <div className="user-modal__profile-hero">
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
                      title={t('profile.change_avatar_tooltip', {
                        defaultValue: 'Нажмите или перетащите изображение для смены (PNG, JPG до 5 МБ)',
                      })}
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

                    {/* Camera badge bottom-right */}
                    <div
                      aria-hidden="true"
                      className="user-modal__avatar-badge-btn"
                      title={t('profile.change_avatar', { defaultValue: 'Сменить аватарку' })}
                    >
                      <CameraIcon />
                    </div>

                    {/* Delete badge top-right */}
                    {(authUser.avatar_url || localPreviewUrl) && !isAvatarLoading && (
                      <button
                        aria-label={t('profile.remove_avatar_title', { defaultValue: 'Удалить аватарку' })}
                        className="user-modal__avatar-delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAvatarRemove();
                        }}
                        title={t('profile.remove_avatar_title', { defaultValue: 'Удалить аватарку' })}
                        type="button"
                      >
                        <TrashIcon />
                      </button>
                    )}

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
                  </div>

                  <div className="user-modal__profile-info">
                    <div className="user-modal__profile-identity">
                      <div className="user-modal__profile-names">
                        <h2 className="user-modal__name">{authUser.display_name}</h2>
                        <span className="user-modal__login-tag">@{authUser.login}</span>
                      </div>
                      {memberSince && (
                        <div className="user-modal__member-badge" title={memberSince}>
                          <CalendarIcon />
                          <span>
                            {t('profile.member_since', {
                              date: memberSince,
                              defaultValue: `В Sharius с ${memberSince}`,
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                    {avatarError && <p className="user-modal__error">{avatarError}</p>}
                  </div>
                </div>

                <div className="user-modal__divider" />

                <form className="user-modal__form" onSubmit={handleNameSubmit}>
                  <div className="user-modal__field-group">
                    <label className="user-modal__label">
                      <span>{t('profile.display_name_label', { defaultValue: 'Отображаемое имя' })}</span>
                      <div className="user-modal__input-action-row">
                        <input
                          className="user-modal__input"
                          maxLength={255}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder={t('profile.display_name_placeholder', { defaultValue: 'Ваше имя' })}
                          type="text"
                          value={displayName}
                        />
                        <button
                          className="user-modal__btn user-modal__btn--primary"
                          disabled={isSavingName || displayName.trim() === authUser.display_name || !displayName.trim()}
                          type="submit"
                        >
                          {isSavingName
                            ? t('profile.saving', { defaultValue: 'Сохранение...' })
                            : t('profile.save', { defaultValue: 'Сохранить' })}
                        </button>
                      </div>
                    </label>
                    {nameError && <p className="user-modal__error">{nameError}</p>}
                  </div>
                </form>
              </div>

              {/* Account Details Card */}
              <div className="user-modal__card">
                <div className="user-modal__card-header">
                  <span className="user-modal__subtitle">{t('profile.account_tab', { defaultValue: 'Аккаунт' })}</span>
                  <h3 className="user-modal__heading">{t('profile.account_details_heading', { defaultValue: 'Информация об аккаунте' })}</h3>
                </div>

                <div className="user-modal__info-list">
                  <div className="user-modal__info-item">
                    <div className="user-modal__info-meta">
                      <span className="user-modal__info-label">{t('profile.user_id_label', { defaultValue: 'ID пользователя' })}</span>
                      <code className="user-modal__code">{authUser.id}</code>
                    </div>
                    <button
                      className="user-modal__btn user-modal__btn--secondary user-modal__btn--sm"
                      onClick={handleCopyId}
                      title={t('common.copy', { defaultValue: 'Копировать ID' })}
                      type="button"
                    >
                      <CopyIcon />
                      <span>{copiedId ? t('common.copied', { defaultValue: 'Скопировано!' }) : t('common.copy', { defaultValue: 'Копировать' })}</span>
                    </button>
                  </div>

                  {memberSince && (
                    <div className="user-modal__info-item">
                      <div className="user-modal__info-meta">
                        <span className="user-modal__info-label">{t('profile.created_at_label', { defaultValue: 'Дата регистрации' })}</span>
                        <span className="user-modal__info-value">
                          <CalendarIcon />
                          <span>{memberSince}</span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
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
            )}

            {activeTab === 'security' && (
              <div className="user-modal__tab-content user-modal__security" key="security">
                {/* Password card */}
                <div className="user-modal__card">
                  <div className="user-modal__card-header">
                    <span className="user-modal__subtitle">{t('profile.security_title', { defaultValue: 'Безопасность' })}</span>
                    <h3 className="user-modal__heading">{t('profile.change_password_heading', { defaultValue: 'Смена пароля' })}</h3>
                  </div>

                  <form className="user-modal__form" onSubmit={handlePasswordSubmit}>
                    <label className="user-modal__label">
                      <span>{t('profile.current_password_label', { defaultValue: 'Текущий пароль' })}</span>
                      <div className="user-modal__password-field">
                        <input
                          autoComplete="current-password"
                          className="user-modal__input user-modal__input--password"
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder={t('profile.current_password_placeholder', { defaultValue: 'Введите текущий пароль' })}
                          required
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={currentPassword}
                        />
                        <button
                          aria-label={showCurrentPassword ? 'Скрыть пароль' : 'Показать пароль'}
                          className="user-modal__password-toggle"
                          onClick={() => setShowCurrentPassword((prev) => !prev)}
                          type="button"
                        >
                          {showCurrentPassword ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                      </div>
                    </label>

                    <label className="user-modal__label">
                      <span>{t('profile.new_password_label', { defaultValue: 'Новый пароль' })}</span>
                      <div className="user-modal__password-field">
                        <input
                          autoComplete="new-password"
                          className="user-modal__input user-modal__input--password"
                          minLength={6}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder={t('profile.new_password_placeholder', { defaultValue: 'Придумайте новый пароль (мин. 6 символов)' })}
                          required
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                        />
                        <button
                          aria-label={showNewPassword ? 'Скрыть пароль' : 'Показать пароль'}
                          className="user-modal__password-toggle"
                          onClick={() => setShowNewPassword((prev) => !prev)}
                          type="button"
                        >
                          {showNewPassword ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                      </div>

                      {newPassword.length > 0 && (
                        <div className="user-modal__strength-meter">
                          <div className="user-modal__strength-bars">
                            <span className={`user-modal__strength-bar ${passwordStrength >= 1 ? `is-active is-${passwordStrength}` : ''}`} />
                            <span className={`user-modal__strength-bar ${passwordStrength >= 2 ? `is-active is-${passwordStrength}` : ''}`} />
                            <span className={`user-modal__strength-bar ${passwordStrength >= 3 ? `is-active is-${passwordStrength}` : ''}`} />
                          </div>
                          <span className={`user-modal__strength-label is-${passwordStrength}`}>
                            {passwordStrength === 1 && t('profile.strength_weak', { defaultValue: 'Слабый' })}
                            {passwordStrength === 2 && t('profile.strength_medium', { defaultValue: 'Средний' })}
                            {passwordStrength === 3 && t('profile.strength_strong', { defaultValue: 'Надёжный' })}
                          </span>
                        </div>
                      )}
                    </label>

                    <label className="user-modal__label">
                      <span>{t('profile.confirm_password_label', { defaultValue: 'Подтверждение пароля' })}</span>
                      <div className="user-modal__password-field">
                        <input
                          autoComplete="new-password"
                          className="user-modal__input user-modal__input--password"
                          minLength={6}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder={t('profile.confirm_password_placeholder', { defaultValue: 'Повторите новый пароль' })}
                          required
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                        />
                        <button
                          aria-label={showConfirmPassword ? 'Скрыть пароль' : 'Показать пароль'}
                          className="user-modal__password-toggle"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          type="button"
                        >
                          {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                      </div>
                    </label>

                    {passwordError && <p className="user-modal__error">{passwordError}</p>}
                    {passwordSuccess && <p className="user-modal__success">{passwordSuccess}</p>}

                    <div className="user-modal__form-actions">
                      <button
                        className="user-modal__btn user-modal__btn--primary"
                        disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                        type="submit"
                      >
                        {isChangingPassword
                          ? t('profile.changing_password', { defaultValue: 'Смена пароля...' })
                          : t('profile.change_password_btn', { defaultValue: 'Сменить пароль' })}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="user-modal__tab-content user-modal__appearance" key="appearance">
                {/* Theme Card */}
                <div className="user-modal__card">
                  <div className="user-modal__card-header">
                    <span className="user-modal__subtitle">{t('theme.title', { defaultValue: 'Оформление' })}</span>
                    <h3 className="user-modal__heading">{t('theme.color_scheme', { defaultValue: 'Цветовая схема' })}</h3>
                  </div>

                  <div className="user-modal__theme-grid">
                    <button
                      className={`user-modal__theme-card ${theme === 'dark' ? 'is-active' : ''}`}
                      onClick={() => onThemeChange?.('dark')}
                      type="button"
                    >
                      <div className="user-modal__theme-preview user-modal__theme-preview--dark">
                        <div className="user-modal__preview-header" />
                        <div className="user-modal__preview-lines">
                          <span />
                          <span className="short" />
                        </div>
                      </div>
                      <div className="user-modal__theme-card-footer">
                        <MoonIcon />
                        <span>{t('theme.dark', { defaultValue: 'Тёмная' })}</span>
                      </div>
                    </button>

                    <button
                      className={`user-modal__theme-card ${theme === 'light' ? 'is-active' : ''}`}
                      onClick={() => onThemeChange?.('light')}
                      type="button"
                    >
                      <div className="user-modal__theme-preview user-modal__theme-preview--light">
                        <div className="user-modal__preview-header" />
                        <div className="user-modal__preview-lines">
                          <span />
                          <span className="short" />
                        </div>
                      </div>
                      <div className="user-modal__theme-card-footer">
                        <SunIcon />
                        <span>{t('theme.light', { defaultValue: 'Светлая' })}</span>
                      </div>
                    </button>

                    <button
                      className={`user-modal__theme-card ${theme === 'system' ? 'is-active' : ''}`}
                      onClick={() => onThemeChange?.('system')}
                      type="button"
                    >
                      <div className="user-modal__theme-preview user-modal__theme-preview--system">
                        <div className="user-modal__preview-split user-modal__preview-split--light" />
                        <div className="user-modal__preview-split user-modal__preview-split--dark" />
                      </div>
                      <div className="user-modal__theme-card-footer">
                        <MonitorIcon />
                        <span>{t('theme.system', { defaultValue: 'Системная' })}</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Language Setting Row Card */}
                <div className="user-modal__card">
                  <div className="user-modal__setting-row">
                    <div className="user-modal__setting-info">
                      <h3 className="user-modal__heading">
                        {t('profile.language_heading', { defaultValue: 'Язык интерфейса' })}
                      </h3>
                      <p className="user-modal__setting-desc">
                        {t('profile.language_desc', { defaultValue: 'Выберите основной язык отображения приложения' })}
                      </p>
                    </div>

                    <div className="user-modal__setting-action" ref={langDropdownRef}>
                      <div className="user-modal__dropdown-wrapper">
                        <button
                          aria-expanded={isLangDropdownOpen}
                          aria-haspopup="listbox"
                          className={`user-modal__lang-select-btn ${isLangDropdownOpen ? 'is-open' : ''}`}
                          onClick={() => setIsLangDropdownOpen((prev) => !prev)}
                          type="button"
                        >
                          <FlagIcon code={currentLang.code} height={14} width={20} />
                          <span className="user-modal__lang-select-name">{currentLang.name}</span>
                          <ChevronDownIcon
                            className={`user-modal__lang-chevron ${isLangDropdownOpen ? 'is-open' : ''}`}
                          />
                        </button>

                        {isLangDropdownOpen && (
                          <div className="user-modal__dropdown-menu" role="listbox">
                            {LANGUAGES.map((lang) => {
                              const isSelected =
                                i18n.resolvedLanguage === lang.code ||
                                i18n.resolvedLanguage?.startsWith(lang.code);

                              return (
                                <button
                                  aria-selected={isSelected}
                                  className={`user-modal__dropdown-item ${isSelected ? 'is-active' : ''}`}
                                  key={lang.code}
                                  onClick={() => {
                                    i18n.changeLanguage(lang.code);
                                    setIsLangDropdownOpen(false);
                                    onNotify?.(
                                      t('profile.language_changed', {
                                        defaultValue: `Язык изменён: ${lang.name}`,
                                        name: lang.name,
                                      })
                                    );
                                  }}
                                  role="option"
                                  type="button"
                                >
                                  <FlagIcon code={lang.code} height={14} width={20} />
                                  <span className="user-modal__dropdown-item-name">{lang.name}</span>
                                  {isSelected && (
                                    <span className="user-modal__dropdown-item-check">
                                      <CheckIcon />
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'friends' && (
              <div className="user-modal__tab-content user-modal__friends" key="friends">
                {/* Search & Add Friends Bar */}
              <div className="user-modal__card user-modal__card--search">
                <div className="user-modal__search-bar">
                  <span className="user-modal__search-icon" aria-hidden="true">
                    <SearchIcon />
                  </span>
                  <input
                    className="user-modal__search-input"
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t('friends.search_placeholder', { defaultValue: 'Поиск новых друзей по логину или имени...' })}
                    type="search"
                    value={query}
                  />
                  {query && (
                    <button
                      aria-label={t('friends.clear_search', { defaultValue: 'Очистить' })}
                      className="user-modal__search-clear"
                      onClick={() => setQuery('')}
                      type="button"
                    >
                      <CloseIcon />
                    </button>
                  )}
                  {isSearching && (
                    <span className="user-modal__search-spinner" />
                  )}
                </div>

                {query.trim() && (
                  <div className="user-modal__search-results">
                    {searchResults.length === 0 && !isSearching ? (
                      <p className="user-modal__empty-text">
                        {t('friends.no_users_found', { defaultValue: 'Пользователи не найдены.' })}
                      </p>
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
                                    <PlusIcon />
                                    <span>{t('friends.add_btn', { defaultValue: 'Добавить' })}</span>
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

              {/* Incoming requests (if any) */}
              {incomingRequests.length > 0 && (
                <div className="user-modal__card user-modal__card--highlight">
                  <div className="user-modal__card-header user-modal__card-header--row">
                    <div className="user-modal__requests-title-group">
                      <span className="user-modal__badge">{incomingRequests.length}</span>
                      <h3 className="user-modal__heading">
                        {t('friends.incoming_title', { defaultValue: 'Входящие запросы' })}
                      </h3>
                    </div>
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

              {/* Friends list */}
              <div className="user-modal__card">
                <div className="user-modal__card-header user-modal__card-header--row">
                  <h3 className="user-modal__heading">
                    {t('friends.your_friends_title', { defaultValue: 'Ваши друзья' })} ({contacts.length})
                  </h3>
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
                  <div className="user-modal__empty-state">
                    <div className="user-modal__empty-icon">
                      <UsersIcon />
                    </div>
                    <h4 className="user-modal__empty-title">
                      {t('friends.no_friends_yet', { defaultValue: 'У вас пока нет друзей' })}
                    </h4>
                    <p className="user-modal__empty-subtitle">
                      {t('friends.your_contacts_empty', { defaultValue: 'Найдите пользователей через строку поиска выше и отправьте им запрос.' })}
                    </p>
                  </div>
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
                                  {t('friends.remove_btn', { defaultValue: 'Да' })}
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
                                  className="user-modal__btn user-modal__btn--secondary user-modal__btn--sm user-modal__btn--icon"
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
  </div>
);
}

export default UserSettingsModal;
