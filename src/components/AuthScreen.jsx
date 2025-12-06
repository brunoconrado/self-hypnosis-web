import React, { useState, useEffect } from 'react';
import { useAuth } from '../providers/AuthProvider';
import './AuthScreen.css';

const REMEMBERED_EMAIL_KEY = 'hypnos_remembered_email';

export function AuthScreen({ onSkip }) {
  const { login, register, error, isLoading, clearError } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY);
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    if (rememberMe) {
      localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
    } else {
      localStorage.removeItem(REMEMBERED_EMAIL_KEY);
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
          <p>Binaural Beats & Affirmations</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <h2>{isLogin ? 'Login' : 'Create Account'}</h2>

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
              placeholder="your@email.com"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
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
              Remember my email
            </label>
          </div>

          <button
            type="submit"
            className="auth-button primary"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : isLogin ? 'Login' : 'Create Account'}
          </button>

          <button
            type="button"
            className="auth-button secondary"
            onClick={toggleMode}
            disabled={isLoading}
          >
            {isLogin ? 'Need an account? Register' : 'Have an account? Login'}
          </button>
        </form>

        <button
          className="skip-button"
          onClick={onSkip}
          disabled={isLoading}
        >
          Continue without account
        </button>
      </div>
    </div>
  );
}
