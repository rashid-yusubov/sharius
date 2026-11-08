export function FlagIcon({ code, className = '', width = 20, height = 14 }) {
  const normCode = (code || '').toLowerCase().slice(0, 2);

  const style = {
    width: `${width}px`,
    height: `${height}px`,
    borderRadius: '2px',
    overflow: 'hidden',
    display: 'inline-block',
    verticalAlign: 'middle',
    flexShrink: 0,
    boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.15)',
  };

  switch (normCode) {
    case 'ru':
      return (
        <svg className={`flag-icon ${className}`} style={style} viewBox="0 0 60 40">
          <rect fill="#fff" height="40" width="60" />
          <rect fill="#0039A6" height="13.33" width="60" y="13.33" />
          <rect fill="#D52B1E" height="13.34" width="60" y="26.66" />
        </svg>
      );
    case 'de':
      return (
        <svg className={`flag-icon ${className}`} style={style} viewBox="0 0 60 40">
          <rect fill="#000" height="13.33" width="60" />
          <rect fill="#DD0000" height="13.33" width="60" y="13.33" />
          <rect fill="#FFCE00" height="13.34" width="60" y="26.66" />
        </svg>
      );
    case 'fr':
      return (
        <svg className={`flag-icon ${className}`} style={style} viewBox="0 0 60 40">
          <rect fill="#002395" height="40" width="20" />
          <rect fill="#fff" height="40" width="20" x="20" />
          <rect fill="#ED2939" height="40" width="20" x="40" />
        </svg>
      );
    case 'it':
      return (
        <svg className={`flag-icon ${className}`} style={style} viewBox="0 0 60 40">
          <rect fill="#009246" height="40" width="20" />
          <rect fill="#fff" height="40" width="20" x="20" />
          <rect fill="#CE2B37" height="40" width="20" x="40" />
        </svg>
      );
    case 'es':
      return (
        <svg className={`flag-icon ${className}`} style={style} viewBox="0 0 60 40">
          <rect fill="#AA151B" height="10" width="60" />
          <rect fill="#F1BF00" height="20" width="60" y="10" />
          <rect fill="#AA151B" height="10" width="60" y="30" />
          <circle cx="16" cy="20" fill="#AA151B" opacity="0.8" r="3.5" />
        </svg>
      );
    case 'en':
      return (
        <svg className={`flag-icon ${className}`} style={style} viewBox="0 0 60 40">
          <rect fill="#012169" height="40" width="60" />
          <path d="M0 0 L60 40 M60 0 L0 40" stroke="#fff" strokeWidth="6" />
          <path d="M0 0 L60 40 M60 0 L0 40" stroke="#C8102E" strokeWidth="2.5" />
          <path d="M30 0 v40 M0 20 h60" stroke="#fff" strokeWidth="10" />
          <path d="M30 0 v40 M0 20 h60" stroke="#C8102E" strokeWidth="6" />
        </svg>
      );
    case 'zh':
      return (
        <svg className={`flag-icon ${className}`} style={style} viewBox="0 0 60 40">
          <rect fill="#DE2910" height="40" width="60" />
          <polygon fill="#FFDE00" points="10,4 12,10 18,10 13,14 15,20 10,16 5,20 7,14 2,10 8,10" />
          <circle cx="21" cy="7" fill="#FFDE00" r="1.5" />
          <circle cx="25" cy="11" fill="#FFDE00" r="1.5" />
          <circle cx="25" cy="17" fill="#FFDE00" r="1.5" />
          <circle cx="21" cy="21" fill="#FFDE00" r="1.5" />
        </svg>
      );
    case 'tr':
      return (
        <svg className={`flag-icon ${className}`} style={style} viewBox="0 0 60 40">
          <rect fill="#E30A17" height="40" width="60" />
          <circle cx="22" cy="20" fill="#fff" r="10" />
          <circle cx="25" cy="20" fill="#E30A17" r="8" />
          <polygon fill="#fff" points="33,16 34.5,19.5 38,19.5 35,21.5 36.5,25 33,23 29.5,25 31,21.5 28,19.5 31.5,19.5" />
        </svg>
      );
    case 'pt':
      return (
        <svg className={`flag-icon ${className}`} style={style} viewBox="0 0 60 40">
          <rect fill="#046A38" height="40" width="24" />
          <rect fill="#DA291C" height="40" width="36" x="24" />
          <circle cx="24" cy="20" fill="#FFC400" r="7" />
          <circle cx="24" cy="20" fill="#fff" r="5" />
          <rect fill="#DA291C" height="6" rx="1" width="6" x="21" y="17" />
        </svg>
      );
    case 'ko':
      return (
        <svg className={`flag-icon ${className}`} style={style} viewBox="0 0 60 40">
          <rect fill="#fff" height="40" width="60" />
          <circle cx="30" cy="20" fill="#CD2E3A" r="8.5" />
          <path d="M 30,28.5 A 8.5,8.5 0 0,1 30,11.5 A 4.25,4.25 0 0,0 30,20 A 4.25,4.25 0 0,1 30,28.5 Z" fill="#0047A0" />
          <rect fill="#000" height="2" transform="rotate(35, 17, 9)" width="7" x="13.5" y="8" />
          <rect fill="#000" height="2" transform="rotate(35, 18, 12)" width="7" x="14.5" y="11" />
          <rect fill="#000" height="2" transform="rotate(35, 43, 28)" width="7" x="39.5" y="27" />
          <rect fill="#000" height="2" transform="rotate(35, 44, 31)" width="7" x="40.5" y="30" />
        </svg>
      );
    default:
      return (
        <span
          className={`flag-icon flag-icon--fallback ${className}`}
          style={{
            ...style,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 'bold',
            background: 'var(--color-control)',
          }}
        >
          {normCode.toUpperCase()}
        </span>
      );
  }
}

export default FlagIcon;
