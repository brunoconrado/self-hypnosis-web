import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { useAudio } from '../providers/AudioProvider';
import { useAffirmation } from '../providers/AffirmationProvider';
import { SliderTile } from './SliderTile';
import { BinauralBeatSlider } from './BinauralBeatSlider';
import { strings } from '../data/strings';
import './PlayerScreen.css';

// Shuffle array helper
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export function PlayerScreen({ sessionConfig, onBack, onEndSession }) {
  const {
    baseFreq,
    beatFreq,
    volume: binauralVolume,
    isPlaying: isAudioPlaying,
    setBaseFreq,
    setBeatFreq,
    setVolume: setBinauralVolume,
    play: playAudio,
    stop: stopAudio
  } = useAudio();

  const {
    gapBetweenSec,
    isRunning,
    voiceVolume,
    currentIndex,
    setGapBetweenSec,
    setVoiceVolume,
    isPlayingAudio
  } = useAffirmation();

  const [showSettings, setShowSettings] = useState(false);
  const [localSessionItems, setLocalSessionItems] = useState([]);
  const [originalItems, setOriginalItems] = useState([]); // Keep original order for unshuffle
  const [localCurrentIndex, setLocalCurrentIndex] = useState(0);
  const [localIsPlaying, setLocalIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState(null);
  const [shuffleEnabled, setShuffleEnabled] = useState(false);
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [isStartingDelay, setIsStartingDelay] = useState(false);
  const [startingDelaySeconds] = useState(5); // Starting delay in seconds

  const isPlaying = isAudioPlaying || localIsPlaying;

  // Initialize session items from config
  useEffect(() => {
    if (sessionConfig?.items) {
      setOriginalItems(sessionConfig.items);
      setLocalSessionItems(sessionConfig.items);
      setLocalCurrentIndex(0);
    }
  }, [sessionConfig]);

  // Handle shuffle toggle
  const handleShuffleToggle = () => {
    const newShuffleEnabled = !shuffleEnabled;
    setShuffleEnabled(newShuffleEnabled);

    if (newShuffleEnabled) {
      // Shuffle the items
      setLocalSessionItems(shuffleArray(originalItems));
    } else {
      // Restore original order
      setLocalSessionItems(originalItems);
    }
    setLocalCurrentIndex(0);
  };

  // Current affirmation text
  const currentAffirmation = localSessionItems[localCurrentIndex]?.text || '';

  // Play next audio
  const playNextAudio = useCallback(() => {
    if (localCurrentIndex < localSessionItems.length - 1) {
      setLocalCurrentIndex(prev => prev + 1);
    } else if (loopEnabled) {
      // Loop back to start
      setLocalCurrentIndex(0);
    } else {
      // Session complete
      setLocalIsPlaying(false);
      stopAudio();
    }
  }, [localCurrentIndex, localSessionItems.length, loopEnabled, stopAudio]);

  // Refs to access current values without re-triggering effect
  const gapBetweenSecRef = useRef(gapBetweenSec);
  const voiceVolumeRef = useRef(voiceVolume);

  useEffect(() => {
    gapBetweenSecRef.current = gapBetweenSec;
  }, [gapBetweenSec]);

  useEffect(() => {
    voiceVolumeRef.current = voiceVolume;
  }, [voiceVolume]);

  // Play current audio
  useEffect(() => {
    if (!localIsPlaying || localSessionItems.length === 0) return;

    const item = localSessionItems[localCurrentIndex];
    if (!item?.audioUrl) {
      // No audio, skip after gap
      const timer = setTimeout(playNextAudio, (gapBetweenSecRef.current + 3) * 1000);
      return () => clearTimeout(timer);
    }

    const audio = new Audio(item.audioUrl);
    audio.volume = voiceVolumeRef.current;
    setAudioElement(audio);

    audio.play().catch(console.error);

    audio.onended = () => {
      setTimeout(playNextAudio, gapBetweenSecRef.current * 1000);
    };

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [localIsPlaying, localCurrentIndex, localSessionItems, playNextAudio]);

  // Update audio volume when changed (seamlessly)
  useEffect(() => {
    if (audioElement) {
      audioElement.volume = voiceVolume;
    }
  }, [voiceVolume, audioElement]);

  const startDelayTimerRef = useRef(null);

  const handlePlay = useCallback(() => {
    if (localIsPlaying || isStartingDelay) {
      // Stop everything
      setLocalIsPlaying(false);
      setIsStartingDelay(false);
      stopAudio();
      if (audioElement) {
        audioElement.pause();
      }
      if (startDelayTimerRef.current) {
        clearTimeout(startDelayTimerRef.current);
        startDelayTimerRef.current = null;
      }
    } else {
      if (localSessionItems.length === 0) return;
      playAudio();

      // Start with delay
      setIsStartingDelay(true);
      setLocalCurrentIndex(0);

      startDelayTimerRef.current = setTimeout(() => {
        setIsStartingDelay(false);
        setLocalIsPlaying(true);
      }, startingDelaySeconds * 1000);
    }
  }, [localIsPlaying, isStartingDelay, localSessionItems, playAudio, stopAudio, audioElement, startingDelaySeconds]);

  const handleBack = useCallback(() => {
    setLocalIsPlaying(false);
    setIsStartingDelay(false);
    stopAudio();
    if (audioElement) {
      audioElement.pause();
    }
    if (startDelayTimerRef.current) {
      clearTimeout(startDelayTimerRef.current);
    }
    onBack();
  }, [stopAudio, onBack, audioElement]);

  const handleEndSession = useCallback(() => {
    setLocalIsPlaying(false);
    setIsStartingDelay(false);
    stopAudio();
    if (audioElement) {
      audioElement.pause();
    }
    if (startDelayTimerRef.current) {
      clearTimeout(startDelayTimerRef.current);
    }
    onEndSession();
  }, [stopAudio, onEndSession, audioElement]);

  const canPlay = localSessionItems.length > 0;
  const progress = localSessionItems.length > 0
    ? ((localCurrentIndex + 1) / localSessionItems.length) * 100
    : 0;

  // Estimated session duration
  const estimatedDuration = useMemo(() => {
    return localSessionItems.reduce((total, item) => {
      const audioDuration = item.audioDurationMs || 3000;
      return total + audioDuration + (gapBetweenSec * 1000);
    }, 0);
  }, [localSessionItems, gapBetweenSec]);

  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="player-screen">
      {/* Header */}
      <header className="player-header">
        <button className="back-button" onClick={handleBack}>
          <span className="material-icons">arrow_back</span>
        </button>

        <div className="step-indicator">
          <span className="step completed">1</span>
          <span className="step-line completed"></span>
          <span className="step completed">2</span>
          <span className="step-line completed"></span>
          <span className="step active">3</span>
        </div>

        <button
          className={`settings-button ${showSettings ? 'active' : ''}`}
          onClick={() => setShowSettings(!showSettings)}
        >
          <span className="material-icons">tune</span>
        </button>
      </header>

      {/* Session Stats */}
      <div className="session-stats">
        <div className="stats-info">
          <div className="stat-item">
            <span className="material-icons">format_list_numbered</span>
            <span>{localSessionItems.length} sugestões</span>
          </div>
          <div className="stat-item">
            <span className="material-icons">schedule</span>
            <span>~{formatTime(estimatedDuration)}</span>
          </div>
        </div>

        <div className="playback-controls">
          <button
            className={`control-btn ${shuffleEnabled ? 'active' : ''}`}
            onClick={handleShuffleToggle}
            title={shuffleEnabled ? 'Desativar aleatório' : 'Ativar aleatório'}
          >
            <span className="material-icons">shuffle</span>
          </button>
          <button
            className={`control-btn ${loopEnabled ? 'active' : ''}`}
            onClick={() => setLoopEnabled(!loopEnabled)}
            title={loopEnabled ? 'Desativar repetição' : 'Ativar repetição'}
          >
            <span className="material-icons">repeat</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="player-main">
        {/* Progress Ring */}
        <div className="progress-container">
          <svg className="progress-ring" viewBox="0 0 200 200">
            <circle
              className="progress-bg"
              cx="100"
              cy="100"
              r="90"
              fill="none"
              strokeWidth="4"
            />
            <circle
              className="progress-bar"
              cx="100"
              cy="100"
              r="90"
              fill="none"
              strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 90}`}
              strokeDashoffset={`${2 * Math.PI * 90 * (1 - progress / 100)}`}
            />
          </svg>

          <div className="progress-content">
            {/* Play Button */}
            <button
              className={`play-button ${localIsPlaying ? 'playing' : ''} ${isStartingDelay ? 'starting' : ''}`}
              onClick={handlePlay}
              disabled={!canPlay}
            >
              <span className="material-icons">
                {(localIsPlaying || isStartingDelay) ? 'pause' : 'play_arrow'}
              </span>
            </button>
          </div>
        </div>

        {/* Session Playlist */}
        <div className="playlist-preview">
          <h3 className="preview-title">
            <span className="material-icons">queue_music</span>
            Sugestões da Sessão
          </h3>
          <div className="preview-list">
            {localSessionItems.map((item, index) => (
              <div
                key={item.id}
                className={`preview-item ${index === localCurrentIndex && localIsPlaying ? 'active' : ''} ${index < localCurrentIndex ? 'completed' : ''}`}
              >
                <span className="item-number">
                  {index < localCurrentIndex ? (
                    <span className="material-icons">check</span>
                  ) : (
                    index + 1
                  )}
                </span>
                <span className="item-text">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Settings Panel */}
      <div className={`settings-panel ${showSettings ? 'open' : ''}`}>
        <div className="settings-header">
          <h2>Configurações</h2>
          <button className="close-settings" onClick={() => setShowSettings(false)}>
            <span className="material-icons">close</span>
          </button>
        </div>

        <div className="settings-content">
          {/* Binaural Settings */}
          <div className="settings-section">
            <h3>
              <span className="material-icons">waves</span>
              Batimentos Binaurais
            </h3>

            <BinauralBeatSlider
              value={beatFreq}
              min={1}
              max={40}
              onChange={setBeatFreq}
            />

            <SliderTile
              label={strings.baseFrequency}
              value={baseFreq}
              min={100}
              max={500}
              step={1}
              unit={strings.hz}
              onChange={setBaseFreq}
            />

            <SliderTile
              label={strings.binauralVolume}
              value={binauralVolume}
              min={0}
              max={1}
              step={0.01}
              unit=""
              onChange={setBinauralVolume}
            />
          </div>

          {/* Voice Settings */}
          <div className="settings-section">
            <h3>
              <span className="material-icons">record_voice_over</span>
              Sugestões
            </h3>

            <SliderTile
              label={strings.gapBetweenAudio}
              value={gapBetweenSec}
              min={0}
              max={10}
              step={1}
              unit={strings.seconds}
              onChange={setGapBetweenSec}
            />

            <SliderTile
              label={strings.voiceVolume}
              value={voiceVolume}
              min={0}
              max={1}
              step={0.01}
              unit=""
              onChange={setVoiceVolume}
            />
          </div>
        </div>
      </div>

      {/* Settings Overlay */}
      {showSettings && (
        <div className="settings-overlay" onClick={() => setShowSettings(false)} />
      )}

      {/* Footer */}
      <footer className="player-footer">
        <div className="footer-content">
          <div className="footer-hint">
            <span className="material-icons">headphones</span>
            Use fones de ouvido para melhor experiência
          </div>
          <button className="end-session-btn" onClick={handleEndSession}>
            <span className="material-icons">stop</span>
            Encerrar Sessão
          </button>
        </div>
      </footer>
    </div>
  );
}
