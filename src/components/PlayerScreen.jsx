import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { useAudio } from '../providers/AudioProvider';
import { useAffirmation } from '../providers/AffirmationProvider';
import { SliderTile } from './SliderTile';
import { BinauralBeatSlider } from './BinauralBeatSlider';
import { strings } from '../data/strings';
import './PlayerScreen.css';

// Session phases
const PHASES = {
  PREPARING: 'preparing',  // Initial delay before starting
  INDUCTION: 'induction',
  DEEPENING: 'deepening',
  AFFIRMATIONS: 'affirmations',
  AWAKENING: 'awakening',
  COMPLETE: 'complete'
};

const PHASE_INFO = {
  [PHASES.PREPARING]: { title: 'Indução', icon: 'self_improvement' },
  [PHASES.INDUCTION]: { title: 'Indução', icon: 'self_improvement' },
  [PHASES.DEEPENING]: { title: 'Aprofundamento', icon: 'spa' },
  [PHASES.AFFIRMATIONS]: { title: 'Afirmações', icon: 'record_voice_over' },
  [PHASES.AWAKENING]: { title: 'Despertar', icon: 'wb_sunny' },
  [PHASES.COMPLETE]: { title: 'Sessão Completa', icon: 'check_circle' }
};

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
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

  // Phase management
  const [currentPhase, setCurrentPhase] = useState(PHASES.PREPARING);
  const [scriptText, setScriptText] = useState('');
  const [scriptProgress, setScriptProgress] = useState(0);
  const scriptTimerRef = useRef(null);

  // Audio progress within current item (0 to 1)
  const [audioProgress, setAudioProgress] = useState(0);

  const isPlaying = isAudioPlaying || localIsPlaying;

  // Check if we have scripts
  const hasInduction = sessionConfig?.induction?.text;
  const hasDeepening = sessionConfig?.deepening?.text;
  const hasAwakening = sessionConfig?.awakening?.text;

  // Initialize session items from config
  useEffect(() => {
    if (sessionConfig?.items) {
      setOriginalItems(sessionConfig.items);
      setLocalSessionItems(sessionConfig.items);
      setLocalCurrentIndex(0);
    }
  }, [sessionConfig]);

  // Script audio element ref
  const scriptAudioRef = useRef(null);

  // Current audio element ref (for both scripts and affirmations)
  const currentAudioRef = useRef(null);

  // Transition delay between phases (in ms)
  const PHASE_TRANSITION_DELAY = 3000;
  const transitionTimerRef = useRef(null);

  // Helper to advance to next phase with delay
  const advanceToPhase = useCallback((nextPhase) => {
    // Clear script state
    setScriptText('');
    setScriptProgress(0);
    scriptAudioRef.current = null;
    currentAudioRef.current = null;

    // Add delay before transitioning to next phase
    transitionTimerRef.current = setTimeout(() => {
      setCurrentPhase(nextPhase);
    }, PHASE_TRANSITION_DELAY);
  }, []);

  // Play a script phase (plays audio if available, shows text, advances after audio ends)
  const playScriptPhase = useCallback((script, nextPhase) => {
    if (!script?.text) {
      advanceToPhase(nextPhase);
      return;
    }

    setScriptText(script.text);
    setScriptProgress(0);

    // Clear any existing timer
    if (scriptTimerRef.current) {
      clearInterval(scriptTimerRef.current);
      scriptTimerRef.current = null;
    }

    // Stop any existing script audio
    if (scriptAudioRef.current) {
      scriptAudioRef.current.pause();
      scriptAudioRef.current = null;
    }

    // If script has audio, play it
    if (script.audio_url) {
      const audioUrl = script.audio_url.startsWith('http')
        ? script.audio_url
        : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${script.audio_url}`;

      const audio = new Audio(audioUrl);
      audio.volume = voiceVolumeRef.current;
      audio.playbackRate = playbackSpeedRef.current;
      scriptAudioRef.current = audio;
      currentAudioRef.current = audio; // Track for volume/speed updates

      // Track progress
      audio.ontimeupdate = () => {
        if (audio.duration > 0) {
          setScriptProgress((audio.currentTime / audio.duration) * 100);
        }
      };

      // When audio ends, advance to next phase with delay
      audio.onended = () => {
        advanceToPhase(nextPhase);
      };

      audio.onerror = () => {
        console.error('Script audio failed to load:', audioUrl);
        currentAudioRef.current = null;
        // Fallback to timer-based approach
        const duration = (script.duration_estimate_sec || 60) * 1000;
        const updateInterval = 100;
        let elapsed = 0;

        scriptTimerRef.current = setInterval(() => {
          elapsed += updateInterval;
          setScriptProgress((elapsed / duration) * 100);

          if (elapsed >= duration) {
            clearInterval(scriptTimerRef.current);
            scriptTimerRef.current = null;
            advanceToPhase(nextPhase);
          }
        }, updateInterval);
      };

      audio.play().catch(err => {
        console.error('Failed to play script audio:', err);
        // Trigger error handler fallback
        audio.onerror();
      });
    } else {
      // No audio, use timer-based approach
      const duration = (script.duration_estimate_sec || 60) * 1000;
      const updateInterval = 100;
      let elapsed = 0;

      scriptTimerRef.current = setInterval(() => {
        elapsed += updateInterval;
        setScriptProgress((elapsed / duration) * 100);

        if (elapsed >= duration) {
          clearInterval(scriptTimerRef.current);
          scriptTimerRef.current = null;
          advanceToPhase(nextPhase);
        }
      }, updateInterval);
    }
  }, [advanceToPhase]);

  // Handle phase transitions
  useEffect(() => {
    if (!localIsPlaying) return;

    if (currentPhase === PHASES.INDUCTION && hasInduction) {
      playScriptPhase(sessionConfig.induction, PHASES.DEEPENING);
    } else if (currentPhase === PHASES.INDUCTION && !hasInduction) {
      setCurrentPhase(PHASES.DEEPENING);
    } else if (currentPhase === PHASES.DEEPENING && hasDeepening) {
      playScriptPhase(sessionConfig.deepening, PHASES.AFFIRMATIONS);
    } else if (currentPhase === PHASES.DEEPENING && !hasDeepening) {
      setCurrentPhase(PHASES.AFFIRMATIONS);
    }
    // Affirmations phase is handled by existing audio playback logic
    // Awakening is triggered when affirmations complete
  }, [currentPhase, localIsPlaying, hasInduction, hasDeepening, sessionConfig, playScriptPhase]);

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
      // Affirmations complete - go to awakening with delay
      if (hasAwakening) {
        // Add delay before transitioning to awakening
        transitionTimerRef.current = setTimeout(() => {
          setCurrentPhase(PHASES.AWAKENING);
          playScriptPhase(sessionConfig?.awakening, PHASES.COMPLETE);
        }, PHASE_TRANSITION_DELAY);
      } else {
        transitionTimerRef.current = setTimeout(() => {
          setCurrentPhase(PHASES.COMPLETE);
          setLocalIsPlaying(false);
          stopAudio();
        }, PHASE_TRANSITION_DELAY);
      }
    }
  }, [localCurrentIndex, localSessionItems.length, loopEnabled, stopAudio, hasAwakening, sessionConfig, playScriptPhase]);

  // Refs to access current values without re-triggering effect
  const gapBetweenSecRef = useRef(gapBetweenSec);
  const voiceVolumeRef = useRef(voiceVolume);
  const playbackSpeedRef = useRef(playbackSpeed);

  useEffect(() => {
    gapBetweenSecRef.current = gapBetweenSec;
  }, [gapBetweenSec]);

  useEffect(() => {
    voiceVolumeRef.current = voiceVolume;
  }, [voiceVolume]);

  useEffect(() => {
    playbackSpeedRef.current = playbackSpeed;
  }, [playbackSpeed]);

  // Play current audio (only during affirmations phase)
  useEffect(() => {
    if (!localIsPlaying || localSessionItems.length === 0) return;
    if (currentPhase !== PHASES.AFFIRMATIONS) return;

    const item = localSessionItems[localCurrentIndex];
    setAudioProgress(0);

    if (!item?.audioUrl) {
      // No audio, skip after gap
      const timer = setTimeout(playNextAudio, (gapBetweenSecRef.current + 3) * 1000);
      return () => clearTimeout(timer);
    }

    const audio = new Audio(item.audioUrl);
    audio.volume = voiceVolumeRef.current;
    audio.playbackRate = playbackSpeedRef.current;
    setAudioElement(audio);
    currentAudioRef.current = audio; // Track for volume/speed updates

    // Track audio progress
    audio.ontimeupdate = () => {
      if (audio.duration > 0) {
        setAudioProgress(audio.currentTime / audio.duration);
      }
    };

    audio.play().catch(console.error);

    audio.onended = () => {
      setAudioProgress(1);
      currentAudioRef.current = null;
      setTimeout(playNextAudio, gapBetweenSecRef.current * 1000);
    };

    return () => {
      audio.pause();
      audio.src = '';
      currentAudioRef.current = null;
    };
  }, [localIsPlaying, localCurrentIndex, localSessionItems, playNextAudio, currentPhase]);

  // Update audio volume when changed (seamlessly) - applies to ALL audio
  useEffect(() => {
    // Update the current audio ref (unified for all phases)
    if (currentAudioRef.current) {
      currentAudioRef.current.volume = voiceVolume;
    }
    // Also update legacy refs for safety
    if (audioElement) {
      audioElement.volume = voiceVolume;
    }
    if (scriptAudioRef.current) {
      scriptAudioRef.current.volume = voiceVolume;
    }
  }, [voiceVolume, audioElement]);

  // Update playback speed when changed - applies to ALL audio
  useEffect(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.playbackRate = playbackSpeed;
    }
    if (audioElement) {
      audioElement.playbackRate = playbackSpeed;
    }
    if (scriptAudioRef.current) {
      scriptAudioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, audioElement]);

  const handlePlay = useCallback(() => {
    if (localIsPlaying) {
      // Stop everything
      setLocalIsPlaying(false);
      setCurrentPhase(PHASES.PREPARING);
      setScriptText('');
      setScriptProgress(0);
      setAudioProgress(0);
      stopAudio();
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      if (audioElement) {
        audioElement.pause();
      }
      if (scriptAudioRef.current) {
        scriptAudioRef.current.pause();
        scriptAudioRef.current = null;
      }
      if (scriptTimerRef.current) {
        clearInterval(scriptTimerRef.current);
        scriptTimerRef.current = null;
      }
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }
    } else {
      if (localSessionItems.length === 0) return;
      playAudio();
      setLocalCurrentIndex(0);
      setAudioProgress(0);
      setLocalIsPlaying(true);
      setCurrentPhase(PHASES.PREPARING);

      // Add initial delay before starting first phase
      transitionTimerRef.current = setTimeout(() => {
        // Start with induction if available, otherwise go to next phase
        if (hasInduction) {
          setCurrentPhase(PHASES.INDUCTION);
        } else if (hasDeepening) {
          setCurrentPhase(PHASES.DEEPENING);
        } else {
          setCurrentPhase(PHASES.AFFIRMATIONS);
        }
      }, PHASE_TRANSITION_DELAY);
    }
  }, [localIsPlaying, localSessionItems, playAudio, stopAudio, audioElement, hasInduction, hasDeepening]);

  const handleBack = useCallback(() => {
    setLocalIsPlaying(false);
    setCurrentPhase(PHASES.PREPARING);
    setScriptText('');
    setScriptProgress(0);
    stopAudio();
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if (audioElement) {
      audioElement.pause();
    }
    if (scriptAudioRef.current) {
      scriptAudioRef.current.pause();
      scriptAudioRef.current = null;
    }
    if (scriptTimerRef.current) {
      clearInterval(scriptTimerRef.current);
    }
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    onBack();
  }, [stopAudio, onBack, audioElement]);

  const handleEndSession = useCallback(() => {
    setLocalIsPlaying(false);
    setCurrentPhase(PHASES.PREPARING);
    setScriptText('');
    setScriptProgress(0);
    stopAudio();
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if (audioElement) {
      audioElement.pause();
    }
    if (scriptAudioRef.current) {
      scriptAudioRef.current.pause();
      scriptAudioRef.current = null;
    }
    if (scriptTimerRef.current) {
      clearInterval(scriptTimerRef.current);
    }
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    onEndSession();
  }, [stopAudio, onEndSession, audioElement]);

  // Skip to a specific phase (for testing)
  const skipToPhase = useCallback((targetPhase) => {
    // Stop current audio and timers
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if (scriptAudioRef.current) {
      scriptAudioRef.current.pause();
      scriptAudioRef.current = null;
    }
    if (scriptTimerRef.current) {
      clearInterval(scriptTimerRef.current);
      scriptTimerRef.current = null;
    }
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    if (audioElement) {
      audioElement.pause();
    }

    setScriptText('');
    setScriptProgress(0);
    setAudioProgress(0);

    // If not playing, start playing
    if (!localIsPlaying) {
      playAudio();
      setLocalIsPlaying(true);
    }

    // Set the target phase - the useEffect will handle starting the appropriate audio
    if (targetPhase === PHASES.AFFIRMATIONS) {
      setLocalCurrentIndex(0);
    }
    setCurrentPhase(targetPhase);

    // Manually trigger script playback for script phases
    if (targetPhase === PHASES.INDUCTION && hasInduction) {
      setTimeout(() => playScriptPhase(sessionConfig.induction, PHASES.DEEPENING), 100);
    } else if (targetPhase === PHASES.DEEPENING && hasDeepening) {
      setTimeout(() => playScriptPhase(sessionConfig.deepening, PHASES.AFFIRMATIONS), 100);
    } else if (targetPhase === PHASES.AWAKENING && hasAwakening) {
      setTimeout(() => playScriptPhase(sessionConfig.awakening, PHASES.COMPLETE), 100);
    }
  }, [audioElement, localIsPlaying, playAudio, hasInduction, hasDeepening, hasAwakening, sessionConfig, playScriptPhase]);

  const canPlay = localSessionItems.length > 0;

  // Calculate total session progress across all phases
  const totalProgress = useMemo(() => {
    // Each phase gets a portion of the total progress
    // Preparing: 0%, Induction: 0-20%, Deepening: 20-40%, Affirmations: 40-90%, Awakening: 90-100%
    const phaseWeights = {
      [PHASES.PREPARING]: { start: 0, end: 0 },
      [PHASES.INDUCTION]: { start: 0, end: 20 },
      [PHASES.DEEPENING]: { start: 20, end: 40 },
      [PHASES.AFFIRMATIONS]: { start: 40, end: 90 },
      [PHASES.AWAKENING]: { start: 90, end: 100 },
      [PHASES.COMPLETE]: { start: 100, end: 100 }
    };

    const currentWeight = phaseWeights[currentPhase];
    if (!currentWeight) return 0;

    if (currentPhase === PHASES.PREPARING) return 0;
    if (currentPhase === PHASES.COMPLETE) return 100;

    if (currentPhase === PHASES.AFFIRMATIONS) {
      // During affirmations, calculate based on current item + audio progress
      const affirmationProgress = localSessionItems.length > 0
        ? (localCurrentIndex + audioProgress) / localSessionItems.length
        : 0;
      return currentWeight.start + (currentWeight.end - currentWeight.start) * affirmationProgress;
    }

    // During script phases (induction, deepening, awakening), use scriptProgress
    return currentWeight.start + (currentWeight.end - currentWeight.start) * (scriptProgress / 100);
  }, [currentPhase, localCurrentIndex, audioProgress, localSessionItems.length, scriptProgress]);

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
        <div className="header-row">
          <div className="header-left">
            <button className="icon-btn" onClick={handleBack}>
              <span className="material-icons">arrow_back</span>
            </button>
            <div className="header-info">
              <div className="info-item">
                <span className="material-icons">format_list_numbered</span>
                <span>{localSessionItems.length} sugestões</span>
              </div>
              <div className="info-item">
                <span className="material-icons">schedule</span>
                <span>~{formatTime(estimatedDuration)}</span>
              </div>
            </div>
          </div>

          <div className="header-right">
            <button
              className={`icon-btn ${shuffleEnabled ? 'active' : ''}`}
              onClick={handleShuffleToggle}
              title={shuffleEnabled ? 'Desativar aleatório' : 'Ativar aleatório'}
            >
              <span className="material-icons">shuffle</span>
            </button>
            <button
              className={`icon-btn ${loopEnabled ? 'active' : ''}`}
              onClick={() => setLoopEnabled(!loopEnabled)}
              title={loopEnabled ? 'Desativar repetição' : 'Ativar repetição'}
            >
              <span className="material-icons">repeat</span>
            </button>
            <button
              className={`icon-btn ${showSettings ? 'active' : ''}`}
              onClick={() => setShowSettings(!showSettings)}
            >
              <span className="material-icons">tune</span>
            </button>
          </div>
        </div>

        {/* Phase Indicator - Clickable for testing */}
        <div className="phase-steps">
          <div
            className={`phase-step clickable ${currentPhase === PHASES.INDUCTION ? 'active' : ''} ${[PHASES.DEEPENING, PHASES.AFFIRMATIONS, PHASES.AWAKENING, PHASES.COMPLETE].includes(currentPhase) ? 'completed' : ''}`}
            onClick={() => skipToPhase(PHASES.INDUCTION)}
            title="Pular para Indução"
          >
            <span className="material-icons">self_improvement</span>
          </div>
          <div className="phase-connector"></div>
          <div
            className={`phase-step clickable ${currentPhase === PHASES.DEEPENING ? 'active' : ''} ${[PHASES.AFFIRMATIONS, PHASES.AWAKENING, PHASES.COMPLETE].includes(currentPhase) ? 'completed' : ''}`}
            onClick={() => skipToPhase(PHASES.DEEPENING)}
            title="Pular para Aprofundamento"
          >
            <span className="material-icons">spa</span>
          </div>
          <div className="phase-connector"></div>
          <div
            className={`phase-step clickable ${currentPhase === PHASES.AFFIRMATIONS ? 'active' : ''} ${[PHASES.AWAKENING, PHASES.COMPLETE].includes(currentPhase) ? 'completed' : ''}`}
            onClick={() => skipToPhase(PHASES.AFFIRMATIONS)}
            title="Pular para Afirmações"
          >
            <span className="material-icons">record_voice_over</span>
          </div>
          <div className="phase-connector"></div>
          <div
            className={`phase-step clickable ${currentPhase === PHASES.AWAKENING ? 'active' : ''} ${currentPhase === PHASES.COMPLETE ? 'completed' : ''}`}
            onClick={() => skipToPhase(PHASES.AWAKENING)}
            title="Pular para Despertar"
          >
            <span className="material-icons">wb_sunny</span>
          </div>
        </div>
      </header>

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
              strokeDashoffset={`${2 * Math.PI * 90 * (1 - totalProgress / 100)}`}
            />
          </svg>

          <div className="progress-content">
            {/* Play Button */}
            <button
              className={`play-button ${localIsPlaying ? 'playing' : ''}`}
              onClick={handlePlay}
              disabled={!canPlay}
            >
              <span className="material-icons">
                {localIsPlaying ? 'pause' : 'play_arrow'}
              </span>
            </button>
          </div>
        </div>

        {/* Preparing Display - shown during initial delay */}
        {currentPhase === PHASES.PREPARING && localIsPlaying && (
          <div className="script-display preparing">
            <div className="script-state">
              <span className="material-icons state-icon">{PHASE_INFO[PHASES.PREPARING].icon}</span>
              <span className="state-title">{PHASE_INFO[PHASES.PREPARING].title}</span>
            </div>
          </div>
        )}

        {/* Script Display (for induction/deepening/awakening) - shows only phase state */}
        {scriptText && currentPhase !== PHASES.AFFIRMATIONS && currentPhase !== PHASES.COMPLETE && currentPhase !== PHASES.PREPARING && (
          <div className="script-display">
            <div className="script-progress-bar">
              <div className="script-progress-fill" style={{ width: `${scriptProgress}%` }}></div>
            </div>
            <div className="script-state">
              <span className="material-icons state-icon">{PHASE_INFO[currentPhase]?.icon || 'self_improvement'}</span>
              <span className="state-title">{PHASE_INFO[currentPhase]?.title || 'Carregando...'}</span>
            </div>
          </div>
        )}

        {/* Session Complete */}
        {currentPhase === PHASES.COMPLETE && (
          <div className="session-complete">
            <span className="material-icons complete-icon">check_circle</span>
            <h2>Sessão Completa!</h2>
            <p>Parabéns por completar sua sessão de auto-hipnose.</p>
            <button className="restart-btn" onClick={handleEndSession}>
              <span className="material-icons">replay</span>
              Nova Sessão
            </button>
          </div>
        )}

        {/* Session Playlist (only show during affirmations or when not playing) */}
        {(currentPhase === PHASES.AFFIRMATIONS || !localIsPlaying) && !scriptText && currentPhase !== PHASES.COMPLETE && (
          <div className="playlist-preview">
            <h3 className="preview-title">
              <span className="material-icons">queue_music</span>
              Sugestões da Sessão
            </h3>
            <div className="preview-list">
              {localSessionItems.map((item, index) => (
                <div
                  key={item.id}
                  className={`preview-item ${index === localCurrentIndex && localIsPlaying && currentPhase === PHASES.AFFIRMATIONS ? 'active' : ''} ${index < localCurrentIndex && currentPhase === PHASES.AFFIRMATIONS ? 'completed' : ''}`}
                >
                  <span className="item-number">
                    {index < localCurrentIndex && currentPhase === PHASES.AFFIRMATIONS ? (
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
        )}
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

            <SliderTile
              label="Velocidade"
              value={playbackSpeed}
              min={0.5}
              max={1.5}
              step={0.05}
              unit="x"
              onChange={setPlaybackSpeed}
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
