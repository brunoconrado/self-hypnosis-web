import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAffirmation } from '../providers/AffirmationProvider';
import { useAuth } from '../providers/AuthProvider';
import { useLanguage } from '../providers/LanguageProvider';
import api from '../services/api';
import './SessionSetupScreen.css';

const CATEGORY_ICONS = {
  'Financeiro': 'savings',
  'Financial': 'savings',
  'Saúde': 'favorite',
  'Health': 'favorite',
  'Sono': 'bedtime',
  'Sleep': 'bedtime',
  'Autoestima': 'self_improvement',
  'Self-Esteem': 'self_improvement',
  'Produtividade': 'rocket_launch',
  'Productivity': 'rocket_launch'
};

const CATEGORY_COLORS = {
  'Financeiro': { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', accent: '#667eea' },
  'Financial': { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', accent: '#667eea' },
  'Saúde': { bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', accent: '#f5576c' },
  'Health': { bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', accent: '#f5576c' },
  'Sono': { bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', accent: '#4facfe' },
  'Sleep': { bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', accent: '#4facfe' },
  'Autoestima': { bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', accent: '#43e97b' },
  'Self-Esteem': { bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', accent: '#43e97b' },
  'Produtividade': { bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', accent: '#fa709a' },
  'Productivity': { bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', accent: '#fa709a' }
};

const CATEGORY_NAMES = {
  'financeiro': 'Financeiro',
  'financial': 'Financial',
  'saude': 'Saúde',
  'health': 'Health',
  'sono': 'Sono',
  'sleep': 'Sleep',
  'autoestima': 'Autoestima',
  'self-esteem': 'Self-Esteem',
  'produtividade': 'Produtividade',
  'productivity': 'Productivity'
};

export function SessionSetupScreen({ onStartSession }) {
  const { categories } = useAffirmation();
  const { isAuthenticated, logout, user } = useAuth();
  const { language: selectedLanguage } = useLanguage();

  // Voice states
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [voicesLoading, setVoicesLoading] = useState(true);

  // Script states
  const [inductions, setInductions] = useState([]);
  const [deepenings, setDeepenings] = useState([]);
  const [awakenings, setAwakenings] = useState([]);
  const [scriptsLoading, setScriptsLoading] = useState(true);

  // Affirmation states for selected voice
  const [voiceAffirmations, setVoiceAffirmations] = useState([]);
  const [affirmationsLoading2, setAffirmationsLoading2] = useState(false);

  // Track if initial load is complete (for full-screen loading)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Ref for preview audio to stop previous when new one plays
  const previewAudioRef = useRef(null);

  // Selection states
  const [selectedInduction, setSelectedInduction] = useState(null);
  const [selectedDeepening, setSelectedDeepening] = useState(null);
  const [selectedAwakening, setSelectedAwakening] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [enabledAffirmations, setEnabledAffirmations] = useState(new Set());

  // Load voices when language changes (filter by available content)
  useEffect(() => {
    const loadVoices = async () => {
      setVoicesLoading(true);
      try {
        const data = await api.getAvailableVoices(selectedLanguage);
        const availableVoices = data.voices || [];
        setVoices(availableVoices);

        // Check if current voice is still available for this language
        const currentVoiceAvailable = availableVoices.some(v => v.elevenlabs_id === selectedVoice);

        if (!currentVoiceAvailable) {
          // Select default or first available voice
          if (data.default_voice_id && availableVoices.some(v => v.elevenlabs_id === data.default_voice_id)) {
            setSelectedVoice(data.default_voice_id);
          } else if (availableVoices.length > 0) {
            setSelectedVoice(availableVoices[0].elevenlabs_id);
          } else {
            setSelectedVoice(null);
          }
        }
      } catch (err) {
        console.error('Failed to load voices:', err);
      }
      setVoicesLoading(false);
    };

    loadVoices();
  }, [selectedLanguage]);

  // Load scripts when voice or language changes
  useEffect(() => {
    if (!selectedVoice) return;

    const loadScripts = async () => {
      setScriptsLoading(true);
      try {
        const [ind, deep, awak] = await Promise.all([
          api.getInductions(selectedLanguage, selectedVoice),
          api.getDeepenings(selectedLanguage, selectedVoice),
          api.getAwakenings(selectedLanguage, selectedVoice)
        ]);

        setInductions(ind);
        setDeepenings(deep);
        setAwakenings(awak);

        // Only auto-select if current selection is not available in new data
        const currentInductionValid = ind.some(s => s.id === selectedInduction);
        const currentDeepeningValid = deep.some(s => s.id === selectedDeepening);
        const currentAwakeningValid = awak.some(s => s.id === selectedAwakening);

        if (!currentInductionValid) {
          const firstFreeInduction = ind.find(s => !s.is_premium);
          setSelectedInduction(firstFreeInduction?.id || null);
        }
        if (!currentDeepeningValid) {
          const firstFreeDeepening = deep.find(s => !s.is_premium);
          setSelectedDeepening(firstFreeDeepening?.id || null);
        }
        if (!currentAwakeningValid) {
          const firstFreeAwakening = awak.find(s => !s.is_premium);
          setSelectedAwakening(firstFreeAwakening?.id || null);
        }
      } catch (err) {
        console.error('Failed to load scripts:', err);
      }
      setScriptsLoading(false);
    };

    loadScripts();
  }, [selectedVoice, selectedLanguage]);

  // Load affirmations when voice or language changes
  useEffect(() => {
    if (!selectedVoice) return;

    const loadAffirmations = async () => {
      setAffirmationsLoading2(true);
      try {
        const data = await api.getAffirmationsForVoice(selectedVoice, selectedLanguage);
        setVoiceAffirmations(data || []);

        // Auto-enable affirmations with audio
        const withAudio = data.filter(a => a.audio_url).map(a => a.id);
        setEnabledAffirmations(new Set(withAudio));
      } catch (err) {
        console.error('Failed to load affirmations:', err);
      }
      setAffirmationsLoading2(false);

      // Mark initial load as complete after first successful load
      if (!initialLoadComplete) {
        setInitialLoadComplete(true);
      }
    };

    loadAffirmations();
  }, [selectedVoice, selectedLanguage]);

  // Transform voice affirmations to local format
  const transformedAffirmations = useMemo(() => {
    return voiceAffirmations.map(a => ({
      id: a.id,
      text: a.text,
      categoryId: a.category_id,
      categoryName: a.category_name,  // From API
      enabled: a.enabled,
      order: a.order,
      audioUrl: a.audio_url ? api.getAudioUrl(a.audio_url) : null,
      audioDurationMs: a.audio_duration_ms,
      isCustom: a.is_custom,
    }));
  }, [voiceAffirmations]);

  // Group affirmations by category
  const categoryData = useMemo(() => {
    const data = {};
    const categoryIds = [...new Set(transformedAffirmations.map(item => item.categoryId).filter(Boolean))];

    categoryIds.forEach(catId => {
      const categoryItems = transformedAffirmations.filter(item => item.categoryId === catId);
      const withAudio = categoryItems.filter(item => item.audioUrl);

      // Get category name: prioritize categoryName from API response
      let name;
      if (categoryItems[0]?.categoryName) {
        name = categoryItems[0].categoryName;
      } else {
        const apiCategory = categories.find(c => c.id === catId);
        if (apiCategory) {
          name = apiCategory.name;
        } else if (CATEGORY_NAMES[catId]) {
          name = CATEGORY_NAMES[catId];
        } else {
          name = catId;
        }
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
  }, [transformedAffirmations, categories, enabledAffirmations]);

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
      transformedAffirmations.some(item => item.id === id && item.audioUrl)
    ).length;
  }, [enabledAffirmations, transformedAffirmations]);

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

    const sessionItems = transformedAffirmations.filter(item =>
      enabledAffirmations.has(item.id) && item.audioUrl
    );

    const selectedVoiceData = voices.find(v => v.elevenlabs_id === selectedVoice);

    onStartSession({
      items: sessionItems,
      induction: inductions.find(s => s.id === selectedInduction),
      deepening: deepenings.find(s => s.id === selectedDeepening),
      awakening: awakenings.find(s => s.id === selectedAwakening),
      voice: selectedVoiceData
    });
  };

  // Only show full-screen loading on initial load
  const isInitialLoading = !initialLoadComplete && (voicesLoading || scriptsLoading || affirmationsLoading2);

  // Track if voice-related data is loading (for inline indicators)
  const isVoiceDataLoading = scriptsLoading || affirmationsLoading2;

  if (isInitialLoading) {
    return (
      <div className="setup-screen">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>{selectedLanguage === 'pt-BR' ? 'Carregando...' : 'Loading...'}</p>
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
            <button className="icon-btn" onClick={logout} title={selectedLanguage === 'pt-BR' ? 'Sair' : 'Logout'}>
              <span className="material-icons">logout</span>
            </button>
          </div>
        )}
      </header>

      <main className="setup-content">
        {/* Voice Selection Section */}
        <section className="setup-section">
          <h2 className="section-title">
            <span className="material-icons">record_voice_over</span>
            {selectedLanguage === 'pt-BR' ? 'Voz' : 'Voice'}
          </h2>
          <div className="voice-options">
            {voices.map(voice => {
              // Gender label based on language
              const genderLabel = selectedLanguage === 'pt-BR'
                ? (voice.gender === 'female' ? 'Feminina' : 'Masculina')
                : (voice.gender === 'female' ? 'Female' : 'Male');

              // Find a sample affirmation for preview
              const sampleAffirmation = voiceAffirmations.find(a => a.audio_url);

              const isSelected = selectedVoice === voice.elevenlabs_id;
              const canPreview = isSelected && sampleAffirmation?.audio_url && !isVoiceDataLoading;

              return (
                <div key={voice.elevenlabs_id} className="voice-card-wrapper">
                  <button
                    className={`voice-btn ${isSelected ? 'selected' : ''} ${isVoiceDataLoading && isSelected ? 'loading' : ''}`}
                    onClick={() => !isVoiceDataLoading && setSelectedVoice(voice.elevenlabs_id)}
                    disabled={isVoiceDataLoading}
                  >
                    <span className="material-icons voice-icon">
                      {voice.gender === 'female' ? 'face_3' : 'face_6'}
                    </span>
                    <div className="voice-info">
                      <span className="voice-name">{voice.name}</span>
                      <span className="voice-gender">{genderLabel}</span>
                    </div>
                    <button
                      className={`voice-preview-btn ${canPreview ? '' : 'disabled'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (canPreview) {
                          // Stop any currently playing preview
                          if (previewAudioRef.current) {
                            previewAudioRef.current.pause();
                            previewAudioRef.current.currentTime = 0;
                          }
                          // Play new preview
                          const audio = new Audio(api.getAudioUrl(sampleAffirmation.audio_url));
                          previewAudioRef.current = audio;
                          audio.play();
                        } else if (!isSelected) {
                          setSelectedVoice(voice.elevenlabs_id);
                        }
                      }}
                      title={selectedLanguage === 'pt-BR'
                        ? (canPreview ? 'Ouvir preview' : 'Selecione para ouvir')
                        : (canPreview ? 'Listen preview' : 'Select to listen')}
                    >
                      <span className="material-icons">{canPreview ? 'play_circle' : 'play_circle_outline'}</span>
                    </button>
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Scripts Section - Simplified */}
        <section className="setup-section">
          <h2 className="section-title">
            <span className="material-icons">auto_fix_high</span>
            {selectedLanguage === 'pt-BR' ? 'Estrutura da Sessão' : 'Session Structure'}
          </h2>
          <div className="session-structure">
            <button
              className={`structure-item ${selectedInduction ? 'enabled' : ''}`}
              onClick={() => setSelectedInduction(selectedInduction ? null : inductions.find(s => !s.is_premium)?.id)}
            >
              <span className="material-icons check-icon">
                {selectedInduction ? 'check_circle' : 'radio_button_unchecked'}
              </span>
              <span className="material-icons structure-icon">self_improvement</span>
              <span className="structure-name">{selectedLanguage === 'pt-BR' ? 'Indução' : 'Induction'}</span>
            </button>
            <button
              className={`structure-item ${selectedDeepening ? 'enabled' : ''}`}
              onClick={() => setSelectedDeepening(selectedDeepening ? null : deepenings.find(s => !s.is_premium)?.id)}
            >
              <span className="material-icons check-icon">
                {selectedDeepening ? 'check_circle' : 'radio_button_unchecked'}
              </span>
              <span className="material-icons structure-icon">spa</span>
              <span className="structure-name">{selectedLanguage === 'pt-BR' ? 'Aprofundamento' : 'Deepening'}</span>
            </button>
          </div>
        </section>

        {/* Affirmations Section */}
        <section className="setup-section">
          <h2 className="section-title">
            <span className="material-icons">record_voice_over</span>
            {selectedLanguage === 'pt-BR' ? 'Afirmações' : 'Affirmations'}
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
                      {category.enabledCount === category.totalCount
                        ? (selectedLanguage === 'pt-BR' ? 'Desmarcar todas' : 'Uncheck all')
                        : (selectedLanguage === 'pt-BR' ? 'Marcar todas' : 'Check all')}
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

        {/* Awakening - Add to structure section */}
        <section className="setup-section">
          <h2 className="section-title">
            <span className="material-icons">wb_sunny</span>
            {selectedLanguage === 'pt-BR' ? 'Finalização' : 'Closing'}
          </h2>
          <div className="session-structure">
            <button
              className={`structure-item ${selectedAwakening ? 'enabled' : ''}`}
              onClick={() => setSelectedAwakening(selectedAwakening ? null : awakenings.find(s => !s.is_premium)?.id)}
            >
              <span className="material-icons check-icon">
                {selectedAwakening ? 'check_circle' : 'radio_button_unchecked'}
              </span>
              <span className="material-icons structure-icon">wb_sunny</span>
              <span className="structure-name">{selectedLanguage === 'pt-BR' ? 'Emersão' : 'Awakening'}</span>
            </button>
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
            <span>{totalEnabled} {selectedLanguage === 'pt-BR' ? 'afirmações' : 'affirmations'}</span>
          </div>
        </div>
        <button
          className="start-btn"
          onClick={handleStart}
          disabled={totalEnabled === 0}
        >
          {selectedLanguage === 'pt-BR' ? 'Iniciar Sessão' : 'Start Session'}
          <span className="material-icons">play_arrow</span>
        </button>
      </footer>
    </div>
  );
}
