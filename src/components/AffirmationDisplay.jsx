import React from 'react';
import { strings } from '../data/strings';
import './AffirmationDisplay.css';

export function AffirmationDisplay({ text, isPlaying, isPlayingAudio }) {
  const showAudioIndicator = isPlaying && isPlayingAudio;
  const displayText = text || strings.noAudioSelected;

  return (
    <div className={`affirmation-display ${isPlaying ? 'active' : ''}`}>
      {showAudioIndicator ? (
        <div className="audio-indicator">
          <span className="material-icons">volume_up</span>
          <div className="audio-waves">
            <span className="wave"></span>
            <span className="wave"></span>
            <span className="wave"></span>
          </div>
        </div>
      ) : (
        <p className="affirmation-text">{displayText}</p>
      )}
    </div>
  );
}
