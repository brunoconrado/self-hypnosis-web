import React, { useCallback } from 'react';
import { useAffirmation } from '../providers/AffirmationProvider';
import './AffirmationEditor.css';

export function AffirmationEditor({ onClose }) {
  const {
    itemsWithServerAudio,
    toggleItemEnabled
  } = useAffirmation();

  const handleToggle = useCallback((item) => {
    toggleItemEnabled(item.id);
  }, [toggleItemEnabled]);

  return (
    <div className="add-modal-overlay" onClick={onClose}>
      <div className="add-modal" onClick={e => e.stopPropagation()}>
        <header className="add-modal-header">
          <h2>Afirmações</h2>
          <button className="close-btn" onClick={onClose}>
            <span className="material-icons">close</span>
          </button>
        </header>

        <div className="affirmation-list">
          {itemsWithServerAudio.length === 0 ? (
            <div className="empty-state">
              <span className="material-icons">volume_off</span>
              <p>Nenhuma afirmação com áudio disponível</p>
            </div>
          ) : (
            itemsWithServerAudio.map(item => (
              <div
                key={item.id}
                className={`affirmation-item ${item.enabled ? 'enabled' : ''}`}
                onClick={() => handleToggle(item)}
              >
                <div className={`toggle-switch ${item.enabled ? 'on' : ''}`}>
                  <div className="toggle-thumb" />
                </div>
                <span className={`item-text ${!item.enabled ? 'dimmed' : ''}`}>
                  {item.text}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
