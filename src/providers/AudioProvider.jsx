import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import audioService from '../services/audioService';
import api from '../services/api';

const AudioContext = createContext(null);

// Local storage keys
const STORAGE_KEYS = {
  baseFreq: 'config_binaural_base_freq',
  beatFreq: 'config_binaural_beat_freq',
  volume: 'config_binaural_volume',
  voiceVolume: 'config_voice_volume',
  gapBetweenSec: 'config_gap_between_sec',
};

export function AudioProvider({ children }) {
  const [baseFreq, setBaseFreqState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.baseFreq);
    return saved ? parseFloat(saved) : 200;
  });
  const [beatFreq, setBeatFreqState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.beatFreq);
    return saved ? parseFloat(saved) : 10;
  });
  const [volume, setVolumeState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.volume);
    return saved ? parseFloat(saved) : 0.5;
  });
  const [voiceVolume, setVoiceVolumeState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.voiceVolume);
    return saved ? parseFloat(saved) : 0.8;
  });
  const [gapBetweenSec, setGapBetweenSecState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.gapBetweenSec);
    return saved ? parseFloat(saved) : 2;
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const saveDebounce = useRef(null);

  // Load config from API or local storage
  const loadConfig = useCallback(async () => {
    if (api.isAuthenticated()) {
      setIsSyncing(true);
      try {
        const config = await api.getConfig();
        if (config) {
          setBaseFreqState(config.binaural_base_freq ?? 200);
          setBeatFreqState(config.binaural_beat_freq ?? 10);
          setVolumeState(config.binaural_volume ?? 0.5);
          setVoiceVolumeState(config.voice_volume ?? 0.8);
          setGapBetweenSecState(config.gap_between_sec ?? 2);

          // Save to local storage as backup
          localStorage.setItem(STORAGE_KEYS.baseFreq, config.binaural_base_freq ?? 200);
          localStorage.setItem(STORAGE_KEYS.beatFreq, config.binaural_beat_freq ?? 10);
          localStorage.setItem(STORAGE_KEYS.volume, config.binaural_volume ?? 0.5);
          localStorage.setItem(STORAGE_KEYS.voiceVolume, config.voice_volume ?? 0.8);
          localStorage.setItem(STORAGE_KEYS.gapBetweenSec, config.gap_between_sec ?? 2);
        }
      } catch (error) {
        console.error('[AudioProvider] Failed to load config from API:', error);
      }
      setIsSyncing(false);
    }
    setIsLoaded(true);
  }, []);

  // Save config with debounce
  const saveConfig = useCallback(() => {
    if (saveDebounce.current) {
      clearTimeout(saveDebounce.current);
    }

    saveDebounce.current = setTimeout(async () => {
      // Always save to local storage
      localStorage.setItem(STORAGE_KEYS.baseFreq, baseFreq);
      localStorage.setItem(STORAGE_KEYS.beatFreq, beatFreq);
      localStorage.setItem(STORAGE_KEYS.volume, volume);
      localStorage.setItem(STORAGE_KEYS.voiceVolume, voiceVolume);
      localStorage.setItem(STORAGE_KEYS.gapBetweenSec, gapBetweenSec);

      // Save to API if authenticated
      if (api.isAuthenticated()) {
        setIsSyncing(true);
        try {
          await api.updateConfig({
            binaural_base_freq: baseFreq,
            binaural_beat_freq: beatFreq,
            binaural_volume: volume,
            voice_volume: voiceVolume,
            gap_between_sec: gapBetweenSec,
          });
        } catch (error) {
          console.error('[AudioProvider] Failed to save config to API:', error);
        }
        setIsSyncing(false);
      }
    }, 500);
  }, [baseFreq, beatFreq, volume, voiceVolume, gapBetweenSec]);

  // Update service when parameters change
  const setBaseFreq = useCallback((value) => {
    const clamped = Math.max(100, Math.min(500, value));
    setBaseFreqState(clamped);
    audioService.setBaseFreq(clamped);
  }, []);

  const setBeatFreq = useCallback((value) => {
    const clamped = Math.max(1, Math.min(30, value));
    setBeatFreqState(clamped);
    audioService.setBeatFreq(clamped);
  }, []);

  const setVolume = useCallback((value) => {
    const clamped = Math.max(0, Math.min(1, value));
    setVolumeState(clamped);
    audioService.setVolume(clamped);
  }, []);

  const setVoiceVolume = useCallback((value) => {
    const clamped = Math.max(0, Math.min(1, value));
    setVoiceVolumeState(clamped);
  }, []);

  const setGapBetweenSec = useCallback((value) => {
    const clamped = Math.max(0, Math.min(10, value));
    setGapBetweenSecState(clamped);
  }, []);

  const play = useCallback(() => {
    audioService.setBaseFreq(baseFreq);
    audioService.setBeatFreq(beatFreq);
    audioService.setVolume(volume);
    audioService.play();
    setIsPlaying(true);
  }, [baseFreq, beatFreq, volume]);

  const stop = useCallback(() => {
    audioService.stop();
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) {
      stop();
    } else {
      play();
    }
  }, [isPlaying, play, stop]);

  // Load config on mount
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Save config when values change (after initial load)
  useEffect(() => {
    if (isLoaded) {
      saveConfig();
    }
  }, [baseFreq, beatFreq, volume, voiceVolume, gapBetweenSec, isLoaded, saveConfig]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveDebounce.current) {
        clearTimeout(saveDebounce.current);
      }
      audioService.dispose();
    };
  }, []);

  const value = {
    baseFreq,
    beatFreq,
    volume,
    voiceVolume,
    gapBetweenSec,
    isPlaying,
    isSyncing,
    isLoaded,
    setBaseFreq,
    setBeatFreq,
    setVolume,
    setVoiceVolume,
    setGapBetweenSec,
    play,
    stop,
    toggle,
    loadConfig,
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
