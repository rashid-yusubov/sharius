import './IconButton.css';

function IconButton({ children, disabled = false, label, onClick, size = 'compact', type = 'button', variant = 'panel' }) {
  return (
    <button
      aria-label={label}
      className={`icon-button icon-button--${variant} icon-button--${size}`}
      disabled={disabled}
      onClick={onClick}
      title={label}
      type={type}
    >
      {children}
    </button>
  );
}

export default IconButton;
