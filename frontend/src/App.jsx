import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { changePassword, getCurrentUser, login, register, updateProfile } from './api/auth.js';
import {
  createSession,
  createSessionForContact,
  deleteSession,
  deleteSessionFile,
  getSession,
  getSessionFileDownloadUrl,
  updateSessionText,
  uploadSessionFile,
} from './api/sessions.js';
import AuthModal from './components/AuthModal.jsx';
import FilePreviewModal from './components/FilePreviewModal.jsx';
import Header from './components/Header.jsx';
import ToastHost from './components/ToastHost.jsx';
import FriendsPage from './pages/FriendsPage.jsx';
import HomePage from './pages/HomePage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import './styles/app.css';

const createAccessCode = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
};

const AUTH_STORAGE_KEY = 'sharius-auth';
const SESSION_STORAGE_KEY = 'sharius-session';

const getErrorMessage = (error) => {
  const messages = {
    CODE_ALREADY_EXISTS: 'This session code is already in use.',
    FILE_NOT_FOUND: 'The selected file is no longer available.',
    FILE_TOO_LARGE: 'This file is too large for the current session limits.',
    FILE_TYPE_NOT_ALLOWED: 'This file type is not allowed.',
    FORBIDDEN: 'You do not have access to modify this session.',
    INVALID_CREDENTIALS: 'Incorrect login or password.',
    INVALID_CURRENT_PASSWORD: 'The current password you entered is incorrect.',
    SAME_PASSWORD: 'The new password must be different from current password.',
    LOGIN_ALREADY_EXISTS: 'This login is already taken.',
    CONTACT_NOT_FOUND: 'Contact not found.',
    CONTACT_REQUEST_ALREADY_EXISTS: 'This contact request already exists.',
    CANNOT_ADD_SELF: 'You cannot add yourself as a friend.',
    REQUEST_ALREADY_RESOLVED: 'This friend request has already been resolved.',
    REQUEST_NOT_FOUND: 'Friend request not found.',
    SESSION_EXPIRED: 'This session has expired. Create a new one to continue.',
    SESSION_NOT_FOUND: 'Session not found. Check the code and try again.',
    TOKEN_INVALID: 'Your session is no longer valid. Please log in again.',
    UNAUTHORIZED: 'Please log in to continue.',
    USER_NOT_FOUND: 'User not found.',
  };

  return messages[error?.code] || messages[error?.message] || 'Request failed. Please try again.';
};

const loadStoredAuth = () => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const loadStoredSession = () => {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

function App() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [code, setCode] = useState(() => loadStoredSession()?.code || '');
  const [message, setMessage] = useState('');
  const [lastSyncedMessage, setLastSyncedMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [sessionExpiresAt, setSessionExpiresAt] = useState(() => loadStoredSession()?.expiresAt || '');
  const [theme, setTheme] = useState(() => localStorage.getItem('sharius-theme') || 'dark');
  const [toasts, setToasts] = useState([]);
  const [auth, setAuth] = useState(() => loadStoredAuth());
  const [sessionAccess, setSessionAccess] = useState(() => loadStoredSession());
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDeleteSessionConfirming, setIsDeleteSessionConfirming] = useState(false);
  const [authModalState, setAuthModalState] = useState({ isOpen: false, mode: 'login' });
  const [previewState, setPreviewState] = useState({ isOpen: false, fileIndex: 0 });
  const [timerTick, setTimerTick] = useState(0);
  const fileInputRef = useRef(null);
  const messageRef = useRef(message);
  messageRef.current = message;
  const lastSyncedMessageRef = useRef(lastSyncedMessage);
  lastSyncedMessageRef.current = lastSyncedMessage;
  const attachedFilesRef = useRef(attachedFiles);
  attachedFilesRef.current = attachedFiles;
  const isSyncingRef = useRef(isSyncing);
  isSyncingRef.current = isSyncing;
  const sessionAccessRef = useRef(sessionAccess);
  sessionAccessRef.current = sessionAccess;

  const handleOpenAuth = useCallback((mode = 'login') => {
    setAuthModalState({ isOpen: true, mode });
  }, []);

  const handleCloseAuth = useCallback(() => {
    setAuthModalState((current) => ({ ...current, isOpen: false }));
  }, []);

  const handlePreviewFile = useCallback((file, index) => {
    setPreviewState({
      isOpen: true,
      fileIndex: typeof index === 'number' && index >= 0 ? index : 0,
    });
  }, []);

  const handleClosePreview = useCallback(() => {
    setPreviewState((current) => ({ ...current, isOpen: false }));
  }, []);

  const handleSelectPreviewIndex = useCallback((index) => {
    setPreviewState((current) => ({ ...current, fileIndex: index }));
  }, []);

  const notify = useCallback((message, tone = 'default') => {
    const id = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 2600);
  }, []);

  const dismissToast = useCallback((toastId) => {
    setToasts((current) => current.filter((toast) => toast.id !== toastId));
  }, []);

  useEffect(() => {
    if (location.pathname === '/login') {
      handleOpenAuth('login');
      navigate('/', { replace: true });
    } else if (location.pathname === '/sign-in') {
      handleOpenAuth('register');
      navigate('/', { replace: true });
    }
  }, [location.pathname, navigate, handleOpenAuth]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const queryCode = params.get('code')?.trim().toUpperCase();
    const pathMatch = location.pathname.match(/^\/s\/([A-Za-z0-9_-]+)$/);
    const pathCode = pathMatch ? pathMatch[1].trim().toUpperCase() : null;
    const targetCode = queryCode || pathCode;

    if (targetCode && targetCode.length >= 4) {
      setCode(targetCode);
      setIsSyncing(true);
      getSession(targetCode)
        .then((session) => {
          syncSessionState(session);
          notify(t('app.connected_to_session', { code: session.code, defaultValue: `Connected to session ${session.code}` }));
        })
        .catch((error) => {
          if (error?.code === 'SESSION_EXPIRED') {
            notify(getErrorMessage(error), 'warning');
          } else {
            notify(t('app.session_code_applied', { code: targetCode, defaultValue: `Session code ${targetCode} applied` }));
          }
        })
        .finally(() => {
          setIsSyncing(false);
        });

      navigate('/', { replace: true });
    }
  }, [location.pathname, location.search, navigate, notify, t]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('sharius-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.dataset.page = location.pathname === '/' ? 'home' : 'auth';
  }, [location.pathname]);

  useEffect(() => {
    if (!auth?.token) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  }, [auth]);

  useEffect(() => {
    if (!sessionAccess?.code) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return;
    }

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionAccess));
  }, [sessionAccess]);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setTimerTick((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    if (!auth?.token) return;

    let isCancelled = false;

    getCurrentUser(auth.token)
      .then((user) => {
        if (!isCancelled) {
          setAuth((current) => (current?.token === auth.token ? { ...current, user } : current));
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setAuth(null);
          notify('Saved session expired. Please log in again.', 'warning');
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [auth?.token, notify]);

  useEffect(() => {
    const preventFileOpen = (event) => {
      const hasFiles = Array.from(event.dataTransfer?.types || []).includes('Files');

      if (hasFiles) {
        event.preventDefault();
      }
    };

    window.addEventListener('dragover', preventFileOpen);
    window.addEventListener('drop', preventFileOpen);

    return () => {
      window.removeEventListener('dragover', preventFileOpen);
      window.removeEventListener('drop', preventFileOpen);
    };
  }, []);

  const handleThemeToggle = () => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  };

  const clearSessionAccess = () => {
    setSessionAccess(null);
  };

  const syncSessionState = (session) => {
    setCode(session.code);
    const content = session.text?.content || '';
    setMessage(content);
    setLastSyncedMessage(content);
    setAttachedFiles(session.files || []);
    setSessionExpiresAt(session.expires_at || '');
    setIsDeleteSessionConfirming(false);
    setSessionAccess((current) => ({
      code: session.code,
      creatorToken: current?.code === session.code ? current?.creatorToken || session.creator_token || null : session.creator_token || null,
      expiresAt: session.expires_at || null,
    }));
  };

  useEffect(() => {
    const stored = loadStoredSession();
    if (!stored?.code) return;
    if (stored.expiresAt && new Date(stored.expiresAt).getTime() <= Date.now()) return;

    getSession(stored.code)
      .then((session) => {
        syncSessionState(session);
      })
      .catch(() => {
        // Ignored if session is expired or not found
      });
  }, []);

  useEffect(() => {
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode || normalizedCode.length < 4) return;

    let isCancelled = false;
    let isPolling = false;

    const pollSession = async () => {
      if (isPolling || isSyncingRef.current || document.hidden) return;

      isPolling = true;
      try {
        const session = await getSession(normalizedCode);
        if (isCancelled) return;

        const remoteContent = session.text?.content || '';
        const remoteFiles = session.files || [];
        const currentMsg = messageRef.current;
        const currentSynced = lastSyncedMessageRef.current;
        const currentFiles = attachedFilesRef.current;

        const remoteTextChanged = remoteContent !== currentSynced;
        const prevFileIds = currentFiles.map((f) => f.id).join(',');
        const remoteFileIds = remoteFiles.map((f) => f.id).join(',');
        const remoteFilesChanged = prevFileIds !== remoteFileIds;

        if (remoteTextChanged || remoteFilesChanged) {
          const hasLocalDraft = currentMsg.trim() !== currentSynced.trim();

          if (!hasLocalDraft) {
            setMessage(remoteContent);
            setLastSyncedMessage(remoteContent);
          } else if (remoteTextChanged) {
            setLastSyncedMessage(remoteContent);
            notify(t('app.remote_changes_available', { defaultValue: 'Сессия обновлена на другом устройстве.' }), 'warning');
          }

          if (remoteFilesChanged) {
            setAttachedFiles(remoteFiles);
          }

          if (session.expires_at) {
            setSessionExpiresAt(session.expires_at);
          }

          setSessionAccess((current) => ({
            code: session.code,
            creatorToken: current?.code === session.code ? current?.creatorToken || session.creator_token || null : session.creator_token || null,
            expiresAt: session.expires_at || null,
          }));
        }
      } catch (error) {
        if (isCancelled) return;
        if ((error?.code === 'SESSION_NOT_FOUND' || error?.code === 'SESSION_EXPIRED') && sessionAccessRef.current?.code === normalizedCode) {
          setSessionExpiresAt(new Date(0).toISOString());
        }
      } finally {
        isPolling = false;
      }
    };

    const intervalId = window.setInterval(pollSession, 2000);

    const handleFocusOrVisible = () => {
      if (!document.hidden) {
        pollSession();
      }
    };

    window.addEventListener('focus', handleFocusOrVisible);
    document.addEventListener('visibilitychange', handleFocusOrVisible);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocusOrVisible);
      document.removeEventListener('visibilitychange', handleFocusOrVisible);
    };
  }, [code, notify, t]);

  const getSessionCredentials = (overrides = {}) => ({
    token: auth?.token || null,
    creatorToken: overrides.creatorToken ?? sessionAccess?.creatorToken ?? null,
  });

  const ensureEditableSession = async ({ nextCode, initialContent = '' } = {}) => {
    const normalizedCode = (nextCode ?? code).trim().toUpperCase();
    const hasMatchingStoredSession = sessionAccess?.code && sessionAccess.code === normalizedCode;
    const currentCode = normalizedCode || sessionAccess?.code || '';

    if (hasMatchingStoredSession && sessionAccess?.creatorToken) {
      return { code: sessionAccess.code, creatorToken: sessionAccess.creatorToken };
    }

    if (!normalizedCode && sessionAccess?.code && sessionAccess?.creatorToken) {
      if (sessionAccess.code !== code) {
        setCode(sessionAccess.code);
      }
      return { code: sessionAccess.code, creatorToken: sessionAccess.creatorToken };
    }

    const session = await createSession({
      custom_code: currentCode || undefined,
      content: initialContent,
      token: auth?.token || undefined,
    });

    syncSessionState(session);
    setSessionAccess({
      code: session.code,
      creatorToken: session.creator_token || null,
    });
    notify(`Session ${session.code} created`);

    return {
      code: session.code,
      creatorToken: session.creator_token || null,
    };
  };

  const persistAuth = (authPayload) => {
    setAuth({ token: authPayload.token, user: authPayload.user });
  };

  const handleLogout = () => {
    setAuth(null);
    notify('Logged out');
  };

  const handleProfileUpdate = async ({ display_name }) => {
    if (!auth?.token) {
      notify('Please log in to continue.', 'warning');
      handleOpenAuth('login');
      return;
    }

    const user = await updateProfile({ display_name, token: auth.token });
    setAuth((current) => (current ? { ...current, user } : current));
    notify('Profile updated');
  };

  const handleChangePassword = async ({ current_password, new_password }) => {
    if (!auth?.token) {
      notify('Please log in to continue.', 'warning');
      handleOpenAuth('login');
      return;
    }

    const authPayload = await changePassword({
      current_password,
      new_password,
      token: auth.token,
    });
    persistAuth(authPayload);
    notify(t('profile.password_changed_success', { defaultValue: 'Password changed successfully!' }));
  };


  const handleLogin = async (credentials) => {
    try {
      const authPayload = await login(credentials);
      persistAuth(authPayload);
      notify(`Logged in as ${authPayload.user.display_name}`);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  };

  const handleRegister = async (credentials) => {
    try {
      const authPayload = await register(credentials);
      persistAuth(authPayload);
      notify(`Account created for ${authPayload.user.display_name}`);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  };

  const handleApiError = useCallback((error) => {
    notify(getErrorMessage(error), 'warning');
  }, [notify]);

  const handleShareContact = async (contact) => {
    if (!auth?.token) {
      notify('Please log in to continue.', 'warning');
      handleOpenAuth('login');
      return;
    }

    setIsSyncing(true);

    try {
      const session = await createSessionForContact(contact.id, {
        content: message,
        token: auth.token,
      });
      syncSessionState(session);
      notify(`Session ${session.code} created for ${contact.display_name}`);
      navigate('/');
    } catch (error) {
      notify(getErrorMessage(error), 'warning');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGenerateCode = () => {
    setCode(createAccessCode());
    setLastSyncedMessage('');
    clearSessionAccess();
    setSessionExpiresAt('');
    setIsDeleteSessionConfirming(false);
    notify('Quick access code generated');
  };

  const handleQrOpen = () => {
    if (!code.trim()) {
      setCode(createAccessCode());
      setLastSyncedMessage('');
      notify('Code generated for QR');
    }
    setIsQrOpen(true);
    notify('QR code opened');
  };

  const handleQrClose = () => {
    setIsQrOpen(false);
    notify('QR code closed');
  };

  const handleClear = () => {
    if (code.trim() && sessionAccess?.creatorToken && !isDeleteSessionConfirming) {
      setIsDeleteSessionConfirming(true);
      notify('Press delete again to remove this session from the server.', 'warning');
      return;
    }

    if (code.trim() && sessionAccess?.creatorToken && isDeleteSessionConfirming) {
      handleDeleteCurrentSession();
      return;
    }

    setMessage('');
    setLastSyncedMessage('');
    setAttachedFiles([]);
    setSessionExpiresAt('');
    setIsDeleteSessionConfirming(false);
    notify('Text and files cleared');
  };

  const handleDeleteCurrentSession = async () => {
    const normalizedCode = code.trim().toUpperCase();

    if (!normalizedCode) {
      setMessage('');
      setLastSyncedMessage('');
      setAttachedFiles([]);
      setSessionExpiresAt('');
      clearSessionAccess();
      setIsDeleteSessionConfirming(false);
      notify('Text and files cleared');
      return;
    }

    setIsSyncing(true);

    try {
      await deleteSession(normalizedCode, getSessionCredentials());
      setCode('');
      setMessage('');
      setLastSyncedMessage('');
      setAttachedFiles([]);
      setSessionExpiresAt('');
      clearSessionAccess();
      setIsDeleteSessionConfirming(false);
      notify(`Session ${normalizedCode} deleted`);
    } catch (error) {
      if (error?.code === 'SESSION_NOT_FOUND' || error?.code === 'SESSION_EXPIRED') {
        setCode('');
        setMessage('');
        setLastSyncedMessage('');
        setAttachedFiles([]);
        setSessionExpiresAt('');
        clearSessionAccess();
        setIsDeleteSessionConfirming(false);
      }
      notify(getErrorMessage(error), 'warning');
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePaste = async () => {
    if (navigator.clipboard?.read) {
      try {
        const items = await navigator.clipboard.read();
        const files = [];
        for (const item of items) {
          for (const type of item.types) {
            if (type.startsWith('image/')) {
              const blob = await item.getType(type);
              const ext = type.split('/')[1] || 'png';
              files.push(new File([blob], `screenshot-${Date.now()}.${ext}`, { type }));
            }
          }
        }
        if (files.length > 0) {
          await handleFilesUpload(files);
          return;
        }
      } catch {
        // Fall back to readText
      }
    }

    if (!navigator.clipboard?.readText) {
      notify('Clipboard is not available', 'warning');
      return;
    }
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText) {
        setMessage((current) => (current ? `${current}\n${clipboardText}` : clipboardText));
        notify('Text pasted from clipboard');
      } else {
        notify('Clipboard is empty', 'warning');
      }
    } catch {
      notify('Could not read from clipboard', 'warning');
    }
  };

  const handleCopy = async () => {
    if (!navigator.clipboard?.writeText) {
      notify('Clipboard is not available', 'warning');
      return;
    }
    await navigator.clipboard.writeText(message);
    notify(message ? 'Text copied to clipboard' : 'Nothing to copy', message ? 'default' : 'warning');
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFilesUpload = async (files) => {
    if (!files.length) return;

    setIsSyncing(true);

    try {
      const editableSession = await ensureEditableSession({ initialContent: message });
      let latestSession = null;

      for (const file of files) {
        latestSession = await uploadSessionFile(editableSession.code, file, getSessionCredentials(editableSession));
      }

      if (latestSession) {
        syncSessionState(latestSession);
      }

      notify(`${files.length} file${files.length > 1 ? 's' : ''} uploaded`);
    } catch (error) {
      if (error?.code === 'SESSION_NOT_FOUND' || error?.code === 'SESSION_EXPIRED') {
        clearSessionAccess();
      }
      notify(getErrorMessage(error), 'warning');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFileChange = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    await handleFilesUpload(files);
  };

  const handleRemoveFile = async (fileIndex) => {
    const file = attachedFiles[fileIndex];
    if (!file?.id || !code.trim()) {
      setAttachedFiles((current) => current.filter((_, index) => index !== fileIndex));
      notify('File removed');
      return;
    }

    setIsSyncing(true);

    try {
      await deleteSessionFile(code.trim(), file.id, getSessionCredentials());
      setAttachedFiles((current) => current.filter((_, index) => index !== fileIndex));
      notify('File removed');
    } catch (error) {
      if (error?.code === 'SESSION_NOT_FOUND' || error?.code === 'SESSION_EXPIRED') {
        clearSessionAccess();
      }
      notify(getErrorMessage(error), 'warning');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownloadFile = (file) => {
    if (!file?.id || !code.trim()) {
      notify('File is not ready for download yet', 'warning');
      return;
    }

    const downloadUrl = getSessionFileDownloadUrl(code.trim(), file.id);
    window.open(downloadUrl, '_blank', 'noopener,noreferrer');
  };

  const handleUpdate = async () => {
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) {
      notify('Enter a session code first', 'warning');
      return;
    }

    setIsSyncing(true);

    try {
      const session = await getSession(normalizedCode);
      syncSessionState(session);
      notify(`Session ${session.code} synced`);
    } catch (error) {
      if (error?.code === 'SESSION_NOT_FOUND' || error?.code === 'SESSION_EXPIRED') {
        clearSessionAccess();
      }
      notify(getErrorMessage(error), 'warning');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSend = async () => {
    setIsSyncing(true);

    try {
      const editableSession = await ensureEditableSession({ initialContent: message });
      const session = await updateSessionText(editableSession.code, {
        content: message,
        ...getSessionCredentials(editableSession),
      });
      syncSessionState(session);
      notify(`Text synced to ${session.code}`);
    } catch (error) {
      if (error?.code === 'SESSION_NOT_FOUND' || error?.code === 'SESSION_EXPIRED') {
        clearSessionAccess();
      }
      notify(getErrorMessage(error), 'warning');
    } finally {
      setIsSyncing(false);
    }
  };

  const isSessionExpired = sessionExpiresAt ? new Date(sessionExpiresAt).getTime() <= Date.now() : false;

  const syncStatus = (() => {
    if (isSessionExpired) return 'expired';
    if (isSyncing) return 'syncing';
    const hasUnsyncedText = message.trim() !== lastSyncedMessage.trim();
    if (hasUnsyncedText) {
      if (message.trim()) return 'draft';
      if (lastSyncedMessage.trim()) return 'draft';
    }
    if (lastSyncedMessage.trim() || attachedFiles.length > 0) {
      return 'synced';
    }
    return 'empty';
  })();

  const sessionStatusText = isSyncing
    ? t('app.sync_in_progress')
    : isDeleteSessionConfirming
      ? t('app.press_delete')
    : sessionAccess?.creatorToken
      ? ''
      : code.trim()
        ? t('app.session_set')
        : t('app.start_typing');

  const homePageElement = (
    <HomePage
      attachedFiles={attachedFiles}
      code={code}
      expiresAt={sessionExpiresAt}
      fileInputRef={fileInputRef}
      isSyncing={isSyncing}
      message={message}
      onDownloadFile={handleDownloadFile}
      onClear={handleClear}
      onCodeChange={setCode}
      onCopy={handleCopy}
      onFileChange={handleFileChange}
      onFileClick={handleFileClick}
      onFilesDrop={handleFilesUpload}
      onGenerateCode={handleGenerateCode}
      onMessageChange={setMessage}
      onPaste={handlePaste}
      onPreviewFile={handlePreviewFile}
      onQrClose={handleQrClose}
      onQrOpen={handleQrOpen}
      onRemoveFile={handleRemoveFile}
      onSend={handleSend}
      onUpdate={handleUpdate}
      isQrOpen={isQrOpen}
      sessionStatusText={sessionStatusText}
      syncStatus={syncStatus}
      timerTick={timerTick}
    />
  );

  return (
    <main className="app-shell">
      <div className="app-layout">
        <Header
          authUser={auth?.user || null}
          onLogout={handleLogout}
          onOpenAuth={handleOpenAuth}
          onThemeToggle={handleThemeToggle}
          theme={theme}
        />
        <Routes>
          <Route element={homePageElement} path="/" />
          <Route element={homePageElement} path="/s/:sessionCode" />
          <Route element={<Navigate replace to="/" />} path="/login" />
          <Route element={<Navigate replace to="/" />} path="/sign-in" />
          <Route
            element={
              auth?.token ? (
                <FriendsPage
                  onError={handleApiError}
                  onNotify={notify}
                  onShareContact={handleShareContact}
                  token={auth.token}
                />
              ) : (
                <Navigate replace to="/" />
              )
            }
            path="/friends"
          />
          <Route
            element={
              auth?.token ? (
                <ProfilePage
                  onChangePassword={handleChangePassword}
                  onError={handleApiError}
                  onLogout={handleLogout}
                  onNotify={notify}
                  onProfileUpdate={handleProfileUpdate}
                  onShareContact={handleShareContact}
                  token={auth.token}
                  user={auth.user}
                />
              ) : (
                <Navigate replace to="/" />
              )
            }
            path="/profile"
          />
        </Routes>
      </div>
      <AuthModal
        initialMode={authModalState.mode}
        isOpen={authModalState.isOpen}
        onClose={handleCloseAuth}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
      <FilePreviewModal
        currentIndex={previewState.fileIndex}
        files={attachedFiles}
        isOpen={previewState.isOpen}
        onClose={handleClosePreview}
        onDownload={handleDownloadFile}
        onSelectIndex={handleSelectPreviewIndex}
        sessionCode={code.trim()}
      />
      <ToastHost onDismiss={dismissToast} toasts={toasts} />
    </main>
  );
}

export default App;

