import React from 'react';
import { useLanguage } from '../providers/LanguageProvider';
import './LanguageSelector.css';

export function LanguageSelector() {
  const { language, setLanguage, languages } = useLanguage();

  return (
    <div className="language-selector">
      <div className="language-toggle">
        {languages.map((lang) => (
          <button
            key={lang.code}
            className={`language-toggle-btn ${language === lang.code ? 'active' : ''}`}
            onClick={() => setLanguage(lang.code)}
            title={lang.name}
          >
            <span className="language-flag">{lang.flag}</span>
            <span className="language-name">{lang.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
