import React, { useState, useMemo } from 'react';
import { useAffirmation } from '../providers/AffirmationProvider';
import './SuggestionSelectionScreen.css';

const CATEGORY_NAMES = {
  'financeiro': 'Financeiro',
  'saude': 'Saúde',
  'sono': 'Sono',
  'autoestima': 'Autoestima',
  'produtividade': 'Produtividade'
};

export function SuggestionSelectionScreen({ categoryIds, onStartSession, onBack }) {
  const { playlist, categories } = useAffirmation();
  const [enabledItems, setEnabledItems] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [initialized, setInitialized] = useState(false);

  // Get category name helper
  const getCategoryName = (catId) => {
    const apiCat = categories.find(c => c.id === catId);
    if (apiCat) return apiCat.name;
    if (CATEGORY_NAMES[catId]) return CATEGORY_NAMES[catId];
    return catId;
  };

  // Filter suggestions by selected categories
  const availableSuggestions = useMemo(() => {
    return playlist.filter(item => {
      const itemCatId = item.categoryId || item.category;
      return categoryIds.includes(itemCatId) && item.audioUrl;
    }).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [playlist, categoryIds]);

  // Initialize enabled items on first load
  useMemo(() => {
    if (!initialized && availableSuggestions.length > 0) {
      setEnabledItems(new Set(availableSuggestions.map(item => item.id)));
      setInitialized(true);
    }
  }, [availableSuggestions, initialized]);

  // Filter suggestions by search query
  const filteredSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return availableSuggestions;
    const query = searchQuery.toLowerCase();
    return availableSuggestions.filter(item =>
      item.text.toLowerCase().includes(query)
    );
  }, [availableSuggestions, searchQuery]);

  // Group suggestions by category for display
  const suggestionsByCategory = useMemo(() => {
    const groups = {};
    filteredSuggestions.forEach(item => {
      const catId = item.categoryId || item.category;
      if (!groups[catId]) {
        groups[catId] = {
          id: catId,
          name: getCategoryName(catId),
          items: []
        };
      }
      groups[catId].items.push(item);
    });
    return Object.values(groups);
  }, [filteredSuggestions, categories]);

  // Toggle item enabled state
  const toggleItem = (itemId) => {
    setEnabledItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  // Select all items
  const selectAll = () => {
    setEnabledItems(new Set(availableSuggestions.map(item => item.id)));
  };

  // Clear all items
  const clearAll = () => {
    setEnabledItems(new Set());
  };

  // Get enabled count
  const enabledCount = enabledItems.size;

  // Handle start session
  const handleStart = () => {
    if (enabledCount === 0) return;

    // Get the enabled items in order
    let sessionItems = availableSuggestions.filter(item => enabledItems.has(item.id));

    onStartSession({
      items: sessionItems
    });
  };

  return (
    <div className="suggestion-screen">
      {/* Header */}
      <header className="suggestion-header">
        <div className="header-content">
          <div className="step-indicator">
            <span className="step completed">1</span>
            <span className="step-line completed"></span>
            <span className="step active">2</span>
            <span className="step-line"></span>
            <span className="step">3</span>
          </div>
          <h1 className="screen-title">Selecione as Sugestões</h1>
          <p className="screen-subtitle">
            Ative ou desative as sugestões que deseja ouvir
          </p>
        </div>
      </header>

      {/* Controls */}
      <div className="controls-section">
        <div className="controls-row">
          <button className="back-btn" onClick={onBack}>
            <span className="material-icons">arrow_back</span>
            Voltar
          </button>

          <div className="quick-actions">
            <button
              className="action-btn"
              onClick={selectAll}
              disabled={enabledCount === availableSuggestions.length}
            >
              <span className="material-icons">check_box</span>
              Todas
            </button>
            <button
              className="action-btn"
              onClick={clearAll}
              disabled={enabledCount === 0}
            >
              <span className="material-icons">check_box_outline_blank</span>
              Nenhuma
            </button>
          </div>
        </div>

        <div className="search-container">
          <span className="material-icons search-icon">search</span>
          <input
            type="text"
            className="search-input"
            placeholder="Buscar sugestões..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="clear-search"
              onClick={() => setSearchQuery('')}
            >
              <span className="material-icons">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Suggestions List */}
      <main className="suggestions-container">
        {suggestionsByCategory.map(category => (
          <div key={category.id} className="category-group">
            <h2 className="category-title">{category.name}</h2>
            <div className="suggestions-list">
              {category.items.map(item => (
                <button
                  key={item.id}
                  className={`suggestion-item ${enabledItems.has(item.id) ? 'enabled' : ''}`}
                  onClick={() => toggleItem(item.id)}
                >
                  <span className="item-check">
                    <span className="material-icons">
                      {enabledItems.has(item.id) ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                  </span>
                  <span className="item-text">{item.text}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </main>

      {/* Bottom Action Bar */}
      <footer className={`action-bar ${enabledCount > 0 ? 'visible' : ''}`}>
        <div className="action-bar-content">
          <div className="selection-info">
            <div className="selection-count">
              <span className="count">{enabledCount}</span>
              <span className="label">
                {enabledCount === 1 ? 'sugestão selecionada' : 'sugestões selecionadas'}
              </span>
            </div>
          </div>

          <button
            className="start-button"
            onClick={handleStart}
            disabled={enabledCount === 0}
          >
            Próximo
            <span className="material-icons">arrow_forward</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
