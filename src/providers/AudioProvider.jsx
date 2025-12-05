import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import audioService from '../services/audioService';

const AudioContext = createContext(null);

export function AudioProvider({ children }) {
  const [baseFreq, setBaseFreqState] = useState(200);
  const [beatFreq, setBeatFreqState] = useState(10);
  const [volume, setVolumeState] = useState(0.5);
  const [isPlaying, setIsPlaying] = useState(false);

  // Update service when parameters change
  const setBaseFreq = useCallback((value) => {
    setBaseFreqState(value);
    audioService.setBaseFreq(value);
  }, []);

  const setBeatFreq = useCallback((value) => {
    setBeatFreqState(value);
    audioService.setBeatFreq(value);
  }, []);

  const setVolume = useCallback((value) => {
    setVolumeState(value);
    audioService.setVolume(value);
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioService.dispose();
    };
  }, []);

  const value = {
    baseFreq,
    beatFreq,
    volume,
    isPlaying,
    setBaseFreq,
    setBeatFreq,
    setVolume,
    play,
    stop,
    toggle
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
