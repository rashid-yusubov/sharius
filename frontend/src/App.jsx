import { useEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { getCurrentUser, login, register } from './api/auth.js';
import {
  createSession,
  deleteSessionFile,
  getSession,
  getSessionFileDownloadUrl,
  updateSessionText,
  uploadSessionFile,
} from './api/sessions.js';
import Header from './components/Header.jsx';
import ToastHost from './components/ToastHost.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignInPage from './pages/SignInPage.jsx';
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
    LOGIN_ALREADY_EXISTS: 'This login is already taken.',
    SESSION_EXPIRED: 'This session has expired. Create a new one to continue.',
    SESSION_NOT_FOUND: 'Session not found. Check the code and try again.',
    TOKEN_INVALID: 'Your session is no longer valid. Please log in again.',
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
  const location = useLocation();
  const [code, setCode] = useState(() => loadStoredSession()?.code || '');
  const [message, setMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('sharius-theme') || 'dark');
  const [toasts, setToasts] = useState([]);
  const [auth, setAuth] = useState(() => loadStoredAuth());
  const [sessionAccess, setSessionAccess] = useState(() => loadStoredSession());
  const [isSyncing, setIsSyncing] = useState(false);
  const fileInputRef = useRef(null);

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
  }, [auth?.token]);

  const handleThemeToggle = () => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  };

  const notify = (message, tone = 'default') => {
    const id = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 2600);
  };

  const dismissToast = (toastId) => {
    setToasts((current) => current.filter((toast) => toast.id !== toastId));
  };

  const clearSessionAccess = () => {
    setSessionAccess(null);
  };

  const syncSessionState = (session) => {
    setCode(session.code);
    setMessage(session.text?.content || '');
    setAttachedFiles(session.files || []);
    setSessionAccess((current) => ({
      code: session.code,
      creatorToken: current?.code === session.code ? current?.creatorToken || session.creator_token || null : session.creator_token || null,
    }));
  };

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

  const handleGenerateCode = () => {
    setCode(createAccessCode());
    clearSessionAccess();
    notify('Quick access code generated');
  };

  const handleQrOpen = () => {
    if (!code.trim()) {
      setCode(createAccessCode());
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
    setMessage('');
    setAttachedFiles([]);
    notify('Text and files cleared');
  };

  const handlePaste = async () => {
    if (!navigator.clipboard?.readText) {
      notify('Clipboard is not available', 'warning');
      return;
    }
    const clipboardText = await navigator.clipboard.readText();
    setMessage((current) => (current ? `${current}\n${clipboardText}` : clipboardText));
    notify('Text pasted from clipboard');
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

  const handleFileChange = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';

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

  const sessionStatusText = isSyncing
    ? 'Sync in progress. Actions are temporarily locked.'
    : sessionAccess?.creatorToken
      ? 'Owner access saved in this browser. You can edit files and text directly.'
      : code.trim()
        ? 'Session code is set. Use Update to load it or Send to create a fresh session.'
        : 'Start typing, then Send to create a shareable session.';

  return (
    <main className="app-shell">
      <div className="app-layout">
        <Header authUser={auth?.user || null} onLogout={handleLogout} onThemeToggle={handleThemeToggle} theme={theme} />
        <Routes>
          <Route
            element={
              <HomePage
                attachedFiles={attachedFiles}
                code={code}
                fileInputRef={fileInputRef}
                isSyncing={isSyncing}
                message={message}
                onDownloadFile={handleDownloadFile}
                onClear={handleClear}
                onCodeChange={setCode}
                onCopy={handleCopy}
                onFileChange={handleFileChange}
                onFileClick={handleFileClick}
                onGenerateCode={handleGenerateCode}
                onMessageChange={setMessage}
                onPaste={handlePaste}
                onQrClose={handleQrClose}
                onQrOpen={handleQrOpen}
                onRemoveFile={handleRemoveFile}
                onSend={handleSend}
                onUpdate={handleUpdate}
                isQrOpen={isQrOpen}
                sessionStatusText={sessionStatusText}
              />
            }
            path="/"
          />
          <Route
            element={auth?.token ? <Navigate replace to="/" /> : <LoginPage onLogin={handleLogin} />}
            path="/login"
          />
          <Route
            element={auth?.token ? <Navigate replace to="/" /> : <SignInPage onRegister={handleRegister} />}
            path="/sign-in"
          />
        </Routes>
      </div>
      <ToastHost onDismiss={dismissToast} toasts={toasts} />
    </main>
  );
}

export default App;
