import React from 'react';
import './PlayButton.css';

export function PlayButton({ isPlaying, onClick, disabled = false }) {
  return (
    <button
      className={`play-button ${isPlaying ? 'playing' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={isPlaying ? 'Parar' : 'Reproduzir'}
    >
      <span className="material-icons">
        {isPlaying ? 'stop' : 'play_arrow'}
      </span>
    </button>
  );
}
