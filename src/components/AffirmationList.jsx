import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useAffirmation } from '../providers/AffirmationProvider';
import { AffirmationEditor } from './AffirmationEditor';
import { PlaylistItem } from './PlaylistItem';
import { strings } from '../data/strings';
import './AffirmationList.css';

export function AffirmationList() {
  const {
    enabledItemsWithAudio,
    serverAudioCount,
    isLoading,
    removeFromPlaylist,
    reorderPlaylist
  } = useAffirmation();

  const [showAddModal, setShowAddModal] = useState(false);

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;

    reorderPlaylist(result.source.index, result.destination.index);
  };

  if (isLoading) {
    return (
      <div className="playlist-container loading">
        <div className="loading-spinner"></div>
        <div className="loading-text">Carregando afirmações...</div>
      </div>
    );
  }

  // No audio available from server
  if (serverAudioCount === 0) {
    return (
      <div className="playlist-container empty">
        <span className="material-icons warning-icon">volume_off</span>
        <p className="empty-title">Nenhuma afirmação com áudio disponível</p>
        <p className="empty-subtitle">
          Verifique a conexão com o servidor ou se os áudios foram gerados.
        </p>
      </div>
    );
  }

  const enabledCount = enabledItemsWithAudio.length;

  return (
    <>
      <div className="playlist-container">
        <div className="playlist-header">
          <div className="header-info">
            <span className="material-icons playlist-icon">playlist_play</span>
            <div className="header-text">
              <h3>{strings.playlist || 'Sua Playlist'}</h3>
              <span className="count">
                {enabledCount} {enabledCount === 1 ? 'afirmação' : 'afirmações'}
              </span>
            </div>
          </div>
          <button
            className="add-button"
            onClick={() => setShowAddModal(true)}
          >
            <span className="material-icons">add</span>
            <span>{strings.addAffirmation || 'Adicionar'}</span>
          </button>
        </div>

        {enabledCount === 0 ? (
          <div className="playlist-empty">
            <span className="material-icons empty-icon">queue_music</span>
            <p className="empty-message">{strings.emptyPlaylist || 'Sua playlist está vazia'}</p>
            <p className="empty-hint">{strings.emptyPlaylistHint || 'Adicione afirmações para começar'}</p>
            <button
              className="add-first-button"
              onClick={() => setShowAddModal(true)}
            >
              <span className="material-icons">add</span>
              <span>Adicionar afirmações</span>
            </button>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="playlist">
              {(provided, snapshot) => (
                <div
                  className={`playlist-items ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {enabledItemsWithAudio.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided, snapshot) => (
                        <PlaylistItem
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          dragHandleProps={provided.dragHandleProps}
                          item={item}
                          isDragging={snapshot.isDragging}
                          onRemove={removeFromPlaylist}
                        />
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>

      {showAddModal && (
        <AffirmationEditor onClose={() => setShowAddModal(false)} />
      )}
    </>
  );
}
