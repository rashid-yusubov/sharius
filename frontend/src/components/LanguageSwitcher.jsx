import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TranslateIcon } from './icons.jsx';
import { FlagIcon } from './FlagIcon.jsx';
import './LanguageSwitcher.css';

const languages = [
  { code: 'ru', name: 'Русский' },
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'zh', name: '中文' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'ko', name: '한국어' }
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
              <FlagIcon code={lang.code} width={20} height={14} />
              <span className="lang-switcher__name">{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default LanguageSwitcher;
