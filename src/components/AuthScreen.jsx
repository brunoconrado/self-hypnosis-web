import React, { useState, useEffect } from 'react';
import { useAuth } from '../providers/AuthProvider';
import './AuthScreen.css';

const REMEMBER_ME_KEY = 'hypnos_remember_me';
const SAVED_EMAIL_KEY = 'hypnos_saved_email';
const SAVED_PASSWORD_KEY = 'hypnos_saved_password';

// Simple obfuscation for password storage (not cryptographically secure, but better than plaintext)
const obfuscate = (str) => btoa(encodeURIComponent(str));
const deobfuscate = (str) => {
  try {
    return decodeURIComponent(atob(str));
  } catch {
    return '';
  }
};

export function AuthScreen({ onSkip }) {
  const { login, register, error, isLoading, clearError } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const rememberMeEnabled = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
    if (rememberMeEnabled) {
      const savedEmail = localStorage.getItem(SAVED_EMAIL_KEY);
      const savedPassword = localStorage.getItem(SAVED_PASSWORD_KEY);
      if (savedEmail) setEmail(savedEmail);
      if (savedPassword) setPassword(deobfuscate(savedPassword));
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    // Save credentials if remember me is enabled
    localStorage.setItem(REMEMBER_ME_KEY, rememberMe.toString());
    if (rememberMe) {
      localStorage.setItem(SAVED_EMAIL_KEY, email);
      localStorage.setItem(SAVED_PASSWORD_KEY, obfuscate(password));
    } else {
      localStorage.removeItem(SAVED_EMAIL_KEY);
      localStorage.removeItem(SAVED_PASSWORD_KEY);
    }

    if (isLogin) {
      await login(email, password);
    } else {
      await register(email, password);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    clearError();
  };

  return (
    <div className="auth-screen">
      <div className="auth-container">
        <div className="auth-header">
          <img src="/hypnos-icon.png" alt="Hypnos" className="auth-logo" />
          <p>Binaural Beats & Afirmações</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <h2>{isLogin ? 'Entrar' : 'Criar Conta'}</h2>

          {error && (
            <div className="auth-error">{error}</div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              autoComplete={isLogin ? "current-password" : "new-password"}
              minLength={6}
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group-checkbox">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
              />
              <span className="checkbox-custom"></span>
              Lembrar-me
            </label>
          </div>

          <button
            type="submit"
            className="auth-button primary"
            disabled={isLoading}
          >
            {isLoading ? 'Carregando...' : isLogin ? 'Entrar' : 'Criar Conta'}
          </button>

          <button
            type="button"
            className="auth-button secondary"
            onClick={toggleMode}
            disabled={isLoading}
          >
            {isLogin ? 'Não tem conta? Registre-se' : 'Já tem conta? Entre'}
          </button>
        </form>

        <button
          className="skip-button"
          onClick={onSkip}
          disabled={isLoading}
        >
          Continuar sem conta
        </button>
      </div>
    </div>
  );
}
