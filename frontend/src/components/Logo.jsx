import logoImage from '../assets/sharius-logo.png';
import './Logo.css';

function Logo() {
  return (
    <span className="logo-mark">
      <img alt="Sharius logo" src={logoImage} />
    </span>
  );
}

export default Logo;
