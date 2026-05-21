import { useEffect, useRef, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
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

function App() {
  const location = useLocation();
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('sharius-theme') || 'dark');
  const [toasts, setToasts] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('sharius-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.dataset.page = location.pathname === '/' ? 'home' : 'auth';
  }, [location.pathname]);

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

  const handleGenerateCode = () => {
    setCode(createAccessCode());
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

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length) {
      setAttachedFiles((current) => [...current, ...files]);
      notify(`${files.length} file${files.length > 1 ? 's' : ''} attached`);
    }
    event.target.value = '';
  };

  const handleRemoveFile = (fileIndex) => {
    setAttachedFiles((current) => current.filter((_, index) => index !== fileIndex));
    notify('File removed');
  };

  const handleUpdate = () => {
    notify('Sync requested');
  };

  const handleSend = () => {
    notify('Ready to send');
  };

  return (
    <main className="app-shell">
      <div className="app-layout">
        <Header onThemeToggle={handleThemeToggle} theme={theme} />
        <Routes>
          <Route
            element={
              <HomePage
                attachedFiles={attachedFiles}
                code={code}
                fileInputRef={fileInputRef}
                message={message}
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
              />
            }
            path="/"
          />
          <Route element={<LoginPage />} path="/login" />
          <Route element={<SignInPage />} path="/sign-in" />
        </Routes>
      </div>
      <ToastHost onDismiss={dismissToast} toasts={toasts} />
    </main>
  );
}

export default App;
