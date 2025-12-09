import React, { createContext, useContext, useState, useEffect } from 'react';

// Available languages
export const LANGUAGES = [
  { code: 'pt-BR', name: 'Português', flag: '🇧🇷' },
  { code: 'en-US', name: 'English', flag: '🇺🇸' }
];

const STORAGE_KEY = 'hypnos_language';
const DEFAULT_LANGUAGE = 'pt-BR';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    // Load from localStorage on init
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && LANGUAGES.some(l => l.code === stored)) {
      return stored;
    }
    return DEFAULT_LANGUAGE;
  });

  // Persist to localStorage when language changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const setLanguage = (langCode) => {
    if (LANGUAGES.some(l => l.code === langCode)) {
      setLanguageState(langCode);
    }
  };

  // Get current language object
  const currentLanguage = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  const value = {
    language,
    setLanguage,
    currentLanguage,
    languages: LANGUAGES
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
