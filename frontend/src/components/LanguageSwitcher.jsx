import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TranslateIcon } from './icons.jsx';
import './LanguageSwitcher.css';

const languages = [
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' }
];

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  
  // Find current language from i18n or fallback to the first one (ru)
  const [currentLang, setCurrentLang] = useState(
    languages.find((l) => l.code === i18n.resolvedLanguage || i18n.resolvedLanguage?.startsWith(l.code)) || languages[0]
  );
  
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update component state when i18n language changes (e.g., initialized by detector)
  useEffect(() => {
    const langObj = languages.find(
      (l) => l.code === i18n.resolvedLanguage || i18n.resolvedLanguage?.startsWith(l.code)
    );
    if (langObj) {
      setCurrentLang(langObj);
    }
  }, [i18n.resolvedLanguage]);

  const handleSelect = (lang) => {
    setCurrentLang(lang);
    setIsOpen(false);
    i18n.changeLanguage(lang.code);
  };

  return (
    <div className="lang-switcher" ref={dropdownRef}>
      <button 
        className="lang-switcher__button" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select language"
        title="Select language"
      >
        <TranslateIcon />
      </button>

      {isOpen && (
        <div className="lang-switcher__dropdown">
          {languages.map((lang) => (
            <button
              key={lang.code}
              className={`lang-switcher__option ${currentLang.code === lang.code ? 'active' : ''}`}
              onClick={() => handleSelect(lang)}
            >
              <span className="lang-switcher__flag">{lang.flag}</span>
              <span className="lang-switcher__name">{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default LanguageSwitcher;
