import React, { forwardRef } from 'react';
import { strings } from '../data/strings';
import './PlaylistItem.css';

export const PlaylistItem = forwardRef(function PlaylistItem(
  { item, isDragging, onRemove, dragHandleProps, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={`playlist-item ${isDragging ? 'dragging' : ''}`}
      {...props}
    >
      <div className="drag-handle" {...dragHandleProps}>
        <span className="material-icons">drag_indicator</span>
      </div>

      <span className="item-text">{item.text}</span>

      <div className="item-actions">
        {item.audioUrl && (
          <span className="audio-indicator" title={strings.audioRecorded}>
            <span className="material-icons">volume_up</span>
          </span>
        )}
        <button
          className="remove-btn"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(item.id);
          }}
          title={strings.removeFromPlaylist || 'Remover'}
        >
          <span className="material-icons">close</span>
        </button>
      </div>
    </div>
  );
});
