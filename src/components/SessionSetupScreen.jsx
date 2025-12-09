import React, { useState, useEffect, useMemo } from 'react';
import { useAffirmation } from '../providers/AffirmationProvider';
import { useAuth } from '../providers/AuthProvider';
import api from '../services/api';
import './SessionSetupScreen.css';

const CATEGORY_ICONS = {
  'Financeiro': 'savings',
  'Saúde': 'favorite',
  'Sono': 'bedtime',
  'Autoestima': 'self_improvement',
  'Produtividade': 'rocket_launch'
};

const CATEGORY_COLORS = {
  'Financeiro': { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', accent: '#667eea' },
  'Saúde': { bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', accent: '#f5576c' },
  'Sono': { bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', accent: '#4facfe' },
  'Autoestima': { bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', accent: '#43e97b' },
  'Produtividade': { bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', accent: '#fa709a' }
};

const CATEGORY_NAMES = {
  'financeiro': 'Financeiro',
  'saude': 'Saúde',
  'sono': 'Sono',
  'autoestima': 'Autoestima',
  'produtividade': 'Produtividade'
};

export function SessionSetupScreen({ onStartSession }) {
  const { playlist, categories, isLoading: affirmationsLoading } = useAffirmation();
  const { isAuthenticated, logout, user } = useAuth();

  // Script states
  const [inductions, setInductions] = useState([]);
  const [deepenings, setDeepenings] = useState([]);
  const [awakenings, setAwakenings] = useState([]);
  const [scriptsLoading, setScriptsLoading] = useState(true);

  // Selection states
  const [selectedInduction, setSelectedInduction] = useState(null);
  const [selectedDeepening, setSelectedDeepening] = useState(null);
  const [selectedAwakening, setSelectedAwakening] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [enabledAffirmations, setEnabledAffirmations] = useState(new Set());

  // Load scripts on mount
  useEffect(() => {
    const loadScripts = async () => {
      setScriptsLoading(true);
      try {
        const [ind, deep, awak] = await Promise.all([
          api.getInductions(),
          api.getDeepenings(),
          api.getAwakenings()
        ]);

        setInductions(ind);
        setDeepenings(deep);
        setAwakenings(awak);

        // Auto-select first non-premium script of each type
        const firstFreeInduction = ind.find(s => !s.is_premium);
        const firstFreeDeepening = deep.find(s => !s.is_premium);
        const firstFreeAwakening = awak.find(s => !s.is_premium);

        if (firstFreeInduction) setSelectedInduction(firstFreeInduction.id);
        if (firstFreeDeepening) setSelectedDeepening(firstFreeDeepening.id);
        if (firstFreeAwakening) setSelectedAwakening(firstFreeAwakening.id);
      } catch (err) {
        console.error('Failed to load scripts:', err);
      }
      setScriptsLoading(false);
    };

    loadScripts();
  }, []);

  // Initialize enabled affirmations when playlist loads
  useEffect(() => {
    if (playlist.length > 0 && enabledAffirmations.size === 0) {
      const withAudio = playlist.filter(item => item.audioUrl).map(item => item.id);
      setEnabledAffirmations(new Set(withAudio));
    }
  }, [playlist]);

  // Group affirmations by category
  const categoryData = useMemo(() => {
    const data = {};
    const categoryIds = [...new Set(playlist.map(item => item.categoryId || item.category).filter(Boolean))];

    categoryIds.forEach(catId => {
      const categoryItems = playlist.filter(item =>
        (item.categoryId === catId) || (item.category === catId)
      );
      const withAudio = categoryItems.filter(item => item.audioUrl);

      let name;
      const apiCategory = categories.find(c => c.id === catId);
      if (apiCategory) {
        name = apiCategory.name;
      } else if (CATEGORY_NAMES[catId]) {
        name = CATEGORY_NAMES[catId];
      } else if (categoryItems[0]?.categoryName) {
        name = categoryItems[0].categoryName;
      } else {
        name = catId;
      }

      const enabledCount = withAudio.filter(item => enabledAffirmations.has(item.id)).length;

      data[catId] = {
        id: catId,
        name,
        items: withAudio,
        enabledCount,
        totalCount: withAudio.length,
        icon: CATEGORY_ICONS[name] || 'category',
        colors: CATEGORY_COLORS[name] || { bg: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)', accent: '#6a11cb' }
      };
    });

    return data;
  }, [playlist, categories, enabledAffirmations]);

  // Toggle affirmation
  const toggleAffirmation = (id) => {
    setEnabledAffirmations(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle all in category
  const toggleCategory = (catId) => {
    const category = categoryData[catId];
    if (!category) return;

    const allEnabled = category.items.every(item => enabledAffirmations.has(item.id));

    setEnabledAffirmations(prev => {
      const next = new Set(prev);
      category.items.forEach(item => {
        if (allEnabled) {
          next.delete(item.id);
        } else {
          next.add(item.id);
        }
      });
      return next;
    });
  };

  // Count total enabled
  const totalEnabled = useMemo(() => {
    return [...enabledAffirmations].filter(id =>
      playlist.some(item => item.id === id && item.audioUrl)
    ).length;
  }, [enabledAffirmations, playlist]);

  // Estimate duration
  const estimatedDuration = useMemo(() => {
    let seconds = 0;

    const induction = inductions.find(s => s.id === selectedInduction);
    const deepening = deepenings.find(s => s.id === selectedDeepening);
    const awakening = awakenings.find(s => s.id === selectedAwakening);

    if (induction) seconds += induction.duration_estimate_sec || 60;
    if (deepening) seconds += deepening.duration_estimate_sec || 60;
    if (awakening) seconds += awakening.duration_estimate_sec || 45;
    seconds += totalEnabled * 5;

    return Math.ceil(seconds / 60);
  }, [selectedInduction, selectedDeepening, selectedAwakening, totalEnabled, inductions, deepenings, awakenings]);

  // Handle start
  const handleStart = () => {
    if (totalEnabled === 0) return;

    const sessionItems = playlist.filter(item =>
      enabledAffirmations.has(item.id) && item.audioUrl
    );

    onStartSession({
      items: sessionItems,
      induction: inductions.find(s => s.id === selectedInduction),
      deepening: deepenings.find(s => s.id === selectedDeepening),
      awakening: awakenings.find(s => s.id === selectedAwakening)
    });
  };

  const isLoading = affirmationsLoading || scriptsLoading;

  if (isLoading) {
    return (
      <div className="setup-screen">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="setup-screen">
      {/* Header */}
      <header className="setup-header">
        <div className="header-left">
          <img src="/hypnos-icon.png" alt="Hypnos" className="header-logo" />
          <h1>Hypnos</h1>
        </div>
        {isAuthenticated && (
          <div className="header-right">
            <span className="user-email">{user?.email}</span>
            <button className="icon-btn" onClick={logout} title="Sair">
              <span className="material-icons">logout</span>
            </button>
          </div>
        )}
      </header>

      <main className="setup-content">
        {/* Induction Section */}
        <section className="setup-section">
          <h2 className="section-title">
            <span className="material-icons">self_improvement</span>
            Indução
          </h2>
          <div className="script-options">
            {inductions.map(script => (
              <button
                key={script.id}
                className={`script-btn ${selectedInduction === script.id ? 'selected' : ''} ${script.is_premium ? 'premium' : ''}`}
                onClick={() => !script.is_premium && setSelectedInduction(script.id)}
                disabled={script.is_premium}
              >
                {script.title}
                {script.is_premium && <span className="premium-tag">Pro</span>}
              </button>
            ))}
          </div>
        </section>

        {/* Deepening Section */}
        <section className="setup-section">
          <h2 className="section-title">
            <span className="material-icons">spa</span>
            Aprofundamento
          </h2>
          <div className="script-options">
            {deepenings.map(script => (
              <button
                key={script.id}
                className={`script-btn ${selectedDeepening === script.id ? 'selected' : ''} ${script.is_premium ? 'premium' : ''}`}
                onClick={() => !script.is_premium && setSelectedDeepening(script.id)}
                disabled={script.is_premium}
              >
                {script.title}
                {script.is_premium && <span className="premium-tag">Pro</span>}
              </button>
            ))}
          </div>
        </section>

        {/* Affirmations Section */}
        <section className="setup-section">
          <h2 className="section-title">
            <span className="material-icons">record_voice_over</span>
            Afirmações
          </h2>
          <div className="categories-list">
            {Object.values(categoryData).map(category => (
              <div key={category.id} className="category-block">
                <div
                  className={`category-header ${expandedCategory === category.id ? 'expanded' : ''}`}
                  onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                  style={{ '--accent': category.colors.accent }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                >
                  <div className="category-info">
                    <span className="material-icons category-icon">{category.icon}</span>
                    <span className="category-name">{category.name}</span>
                    <span className="category-count">{category.enabledCount}/{category.totalCount}</span>
                  </div>
                  <div className="category-actions">
                    <button
                      className="toggle-all-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCategory(category.id);
                      }}
                    >
                      {category.enabledCount === category.totalCount ? 'Desmarcar' : 'Marcar'} todas
                    </button>
                    <span className="material-icons expand-icon">
                      {expandedCategory === category.id ? 'expand_less' : 'expand_more'}
                    </span>
                  </div>
                </div>

                {expandedCategory === category.id && (
                  <div className="affirmations-list">
                    {category.items.map(item => (
                      <button
                        key={item.id}
                        className={`affirmation-item ${enabledAffirmations.has(item.id) ? 'enabled' : ''}`}
                        onClick={() => toggleAffirmation(item.id)}
                      >
                        <span className="material-icons check-icon">
                          {enabledAffirmations.has(item.id) ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                        <span className="affirmation-text">{item.text}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Awakening Section */}
        <section className="setup-section">
          <h2 className="section-title">
            <span className="material-icons">wb_sunny</span>
            Despertar
          </h2>
          <div className="script-options">
            {awakenings.map(script => (
              <button
                key={script.id}
                className={`script-btn ${selectedAwakening === script.id ? 'selected' : ''} ${script.is_premium ? 'premium' : ''}`}
                onClick={() => !script.is_premium && setSelectedAwakening(script.id)}
                disabled={script.is_premium}
              >
                {script.title}
                {script.is_premium && <span className="premium-tag">Pro</span>}
              </button>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="setup-footer">
        <div className="footer-info">
          <div className="info-item">
            <span className="material-icons">timer</span>
            <span>~{estimatedDuration} min</span>
          </div>
          <div className="info-item">
            <span className="material-icons">format_list_bulleted</span>
            <span>{totalEnabled} afirmações</span>
          </div>
        </div>
        <button
          className="start-btn"
          onClick={handleStart}
          disabled={totalEnabled === 0}
        >
          Iniciar Sessão
          <span className="material-icons">play_arrow</span>
        </button>
      </footer>
    </div>
  );
}
