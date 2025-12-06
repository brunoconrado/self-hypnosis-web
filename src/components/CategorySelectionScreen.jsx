import React, { useState, useMemo } from 'react';
import { useAffirmation } from '../providers/AffirmationProvider';
import { useAuth } from '../providers/AuthProvider';
import './CategorySelectionScreen.css';

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

// Map short category IDs to display names (for local data)
const CATEGORY_NAMES = {
  'financeiro': 'Financeiro',
  'saude': 'Saúde',
  'sono': 'Sono',
  'autoestima': 'Autoestima',
  'produtividade': 'Produtividade'
};

export function CategorySelectionScreen({ onNext }) {
  const { playlist, categories, isLoading } = useAffirmation();
  const { isAuthenticated, logout, user } = useAuth();
  const [selectedCategories, setSelectedCategories] = useState(new Set());

  // Group affirmations by category with counts
  const categoryStats = useMemo(() => {
    const stats = {};

    // Get unique categories from playlist - support both categoryId (API) and category (local)
    const categoryIds = [...new Set(playlist.map(item => item.categoryId || item.category).filter(Boolean))];

    categoryIds.forEach(catId => {
      // Filter by both categoryId and category to support API and local data
      const categoryItems = playlist.filter(item =>
        (item.categoryId === catId) || (item.category === catId)
      );
      const withAudio = categoryItems.filter(item => item.audioUrl);

      // Find category name - check API categories first, then local mapping, then categoryName field
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

      stats[catId] = {
        id: catId,
        name,
        total: categoryItems.length,
        withAudio: withAudio.length,
        icon: CATEGORY_ICONS[name] || 'category',
        colors: CATEGORY_COLORS[name] || { bg: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)', accent: '#6a11cb' }
      };
    });

    return stats;
  }, [playlist, categories]);

  // Toggle category selection
  const toggleCategory = (categoryId) => {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // Select all categories
  const selectAll = () => {
    setSelectedCategories(new Set(Object.keys(categoryStats)));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedCategories(new Set());
  };

  // Calculate total selected affirmations
  const selectedStats = useMemo(() => {
    let total = 0;
    let withAudio = 0;

    selectedCategories.forEach(catId => {
      const stat = categoryStats[catId];
      if (stat) {
        total += stat.total;
        withAudio += stat.withAudio;
      }
    });

    return { total, withAudio };
  }, [selectedCategories, categoryStats]);

  // Handle next step
  const handleNext = () => {
    if (selectedCategories.size === 0) return;
    onNext(Array.from(selectedCategories));
  };

  if (isLoading) {
    return (
      <div className="category-screen">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Carregando categorias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="category-screen">
      {/* Header */}
      <header className="category-header">
        {isAuthenticated && (
          <div className="user-menu">
            <span className="user-email">{user?.email}</span>
            <button className="logout-btn" onClick={logout} title="Sair">
              <span className="material-icons">logout</span>
            </button>
          </div>
        )}
        <div className="header-content">
          <div className="step-indicator">
            <span className="step active">1</span>
            <span className="step-line"></span>
            <span className="step">2</span>
            <span className="step-line"></span>
            <span className="step">3</span>
          </div>
          <img src="/hypnos-icon.png" alt="Hypnos" className="header-logo" />
          <p className="app-tagline">Escolha as categorias para sua sessão</p>
        </div>
      </header>

      {/* Quick Actions */}
      <div className="controls-section">
        <div className="quick-actions">
          <button
            className="action-btn"
            onClick={selectAll}
            disabled={selectedCategories.size === Object.keys(categoryStats).length}
          >
            <span className="material-icons">select_all</span>
            Selecionar Todas
          </button>
          <button
            className="action-btn"
            onClick={clearSelection}
            disabled={selectedCategories.size === 0}
          >
            <span className="material-icons">deselect</span>
            Limpar
          </button>
        </div>
      </div>

      {/* Categories Grid */}
      <main className="categories-container">
        <div className="categories-grid">
          {Object.values(categoryStats).map(category => (
            <button
              key={category.id}
              className={`category-card ${selectedCategories.has(category.id) ? 'selected' : ''}`}
              onClick={() => toggleCategory(category.id)}
              style={{
                '--card-bg': category.colors.bg,
                '--card-accent': category.colors.accent
              }}
            >
              <div className="card-check">
                <span className="material-icons">
                  {selectedCategories.has(category.id) ? 'check_circle' : 'radio_button_unchecked'}
                </span>
              </div>

              <div className="card-icon">
                <span className="material-icons">{category.icon}</span>
              </div>

              <h3 className="card-title">{category.name}</h3>

              <div className="card-stats">
                <span className="stat">
                  <span className="material-icons">headphones</span>
                  {category.withAudio} áudios
                </span>
              </div>
            </button>
          ))}
        </div>

        {Object.keys(categoryStats).length === 0 && (
          <div className="empty-state">
            <span className="material-icons">search_off</span>
            <p>Nenhuma categoria encontrada</p>
          </div>
        )}
      </main>

      {/* Bottom Action Bar */}
      <footer className={`action-bar ${selectedCategories.size > 0 ? 'visible' : ''}`}>
        <div className="action-bar-content">
          <div className="selection-info">
            <div className="selection-count">
              <span className="count">{selectedCategories.size}</span>
              <span className="label">
                {selectedCategories.size === 1 ? 'categoria' : 'categorias'}
              </span>
            </div>
            <div className="selection-details">
              {selectedStats.withAudio} sugestões com áudio
            </div>
          </div>

          <div className="action-controls">
            <button
              className="start-button"
              onClick={handleNext}
              disabled={selectedStats.withAudio === 0}
            >
              Próximo
              <span className="material-icons">arrow_forward</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
