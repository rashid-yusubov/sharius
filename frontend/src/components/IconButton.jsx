import './IconButton.css';

function IconButton({ children, label, onClick, size = 'compact', type = 'button', variant = 'panel' }) {
  return (
    <button
      aria-label={label}
      className={`icon-button icon-button--${variant} icon-button--${size}`}
      onClick={onClick}
      title={label}
      type={type}
    >
      {children}
    </button>
  );
}

export default IconButton;
