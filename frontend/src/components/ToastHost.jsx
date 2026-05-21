import { CloseIcon } from './icons.jsx';
import './ToastHost.css';

function ToastHost({ onDismiss, toasts }) {
  return (
    <div className="toast-host" aria-live="polite" aria-label="Notifications">
      {toasts.map((toast) => (
        <div className={`toast toast--${toast.tone}`} key={toast.id}>
          <span className="toast__dot" />
          <p>{toast.message}</p>
          <button aria-label="Dismiss notification" onClick={() => onDismiss(toast.id)} type="button">
            <CloseIcon />
          </button>
        </div>
      ))}
    </div>
  );
}

export default ToastHost;
