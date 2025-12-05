import React from 'react';
import './SessionPhase.css';

export function SessionPhase({
  title,
  icon,
  status = 'ready', // 'placeholder' | 'ready' | 'active' | 'completed'
  description,
  placeholder,
  currentText,
  isPlayingAudio,
  progress = 0,
  count,
}) {
  const isPlaceholder = status === 'placeholder';
  const isActive = status === 'active';
  const isCompleted = status === 'completed';

  return (
    <div className={`session-phase ${status}`}>
      <div className="phase-header">
        <div className="phase-icon-wrapper">
          <span className="material-icons phase-icon">{icon}</span>
          {isActive && <div className="phase-pulse" />}
        </div>
        <div className="phase-info">
          <h3 className="phase-title">{title}</h3>
          <p className="phase-description">{description}</p>
        </div>
        {count && isActive && (
          <div className="phase-count">{count}</div>
        )}
        {isCompleted && (
          <span className="material-icons phase-check">check_circle</span>
        )}
      </div>

      {isPlaceholder && placeholder && (
        <div className="phase-placeholder">
          <span className="material-icons">construction</span>
          <p>{placeholder}</p>
        </div>
      )}

      {isActive && currentText && (
        <div className="phase-current">
          <div className="current-text-wrapper">
            {isPlayingAudio && (
              <span className="material-icons audio-indicator">volume_up</span>
            )}
            <p className="current-text">{currentText}</p>
          </div>
          <div className="phase-progress-bar">
            <div
              className="phase-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
