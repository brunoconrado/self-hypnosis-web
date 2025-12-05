import React, { useCallback } from 'react';
import { useAudio } from '../providers/AudioProvider';
import { useAffirmation } from '../providers/AffirmationProvider';
import { useAuth } from '../providers/AuthProvider';
import { SessionBuilder } from './SessionBuilder';
import { AffirmationList } from './AffirmationList';
import { SliderTile } from './SliderTile';
import { BinauralBeatSlider } from './BinauralBeatSlider';
import { PlayButton } from './PlayButton';
import { ExpandableCard } from './ExpandableCard';
import { strings } from '../data/strings';
import './HomeScreen.css';

export function HomeScreen() {
  const { user, isAuthenticated, logout } = useAuth();

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
    enabledItems,
    setGapBetweenSec,
    setVoiceVolume,
    start: startAffirmations,
    stop: stopAffirmations
  } = useAffirmation();

  const isPlaying = isAudioPlaying || isRunning;

  const handlePlay = useCallback(() => {
    if (isPlaying) {
      stopAudio();
      stopAffirmations();
    } else {
      if (enabledItems.length === 0) {
        alert('Nenhuma sugestão disponível.');
        return;
      }

      playAudio();
      startAffirmations();
    }
  }, [isPlaying, enabledItems, playAudio, stopAudio, startAffirmations, stopAffirmations]);

  const canPlay = enabledItems.length > 0;

  // Summary strings
  const binauralSummary = strings.formatBinauralSummary(baseFreq, beatFreq, binauralVolume);
  const voiceSummary = strings.formatVoiceSummary(voiceVolume);

  return (
    <div className="home-screen wide-layout">
      <header className="app-header">
        <div>
          <h1 className="app-title">{strings.appTitle}</h1>
          <p className="app-subtitle">{strings.appSubtitle}</p>
        </div>
        {isAuthenticated && (
          <button
            className="logout-button"
            onClick={logout}
            title={`Logout ${user?.email || ''}`}
          >
            <span className="material-icons">logout</span>
          </button>
        )}
      </header>

      <main className="main-content">
        <div className="content-grid">
          {/* Main session area */}
          <div className="session-area">
            <SessionBuilder />

            {/* Play controls */}
            <div className="play-section">
              <PlayButton
                isPlaying={isPlaying}
                onClick={handlePlay}
                disabled={!canPlay}
              />
              {!canPlay && (
                <p className="no-audio-hint">Carregando sugestões...</p>
              )}
              {canPlay && !isPlaying && (
                <p className="play-hint">
                  {enabledItems.length} sugestões prontas para reproduzir
                </p>
              )}
            </div>
          </div>

          {/* Side controls */}
          <aside className="controls-sidebar">
            <ExpandableCard
              title={strings.binauralControls}
              icon="waves"
              summary={binauralSummary}
              defaultExpanded={true}
            >
              <BinauralBeatSlider
                value={beatFreq}
                min={1}
                max={40}
                onChange={setBeatFreq}
              />
              <div className="binaural-divider" />
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
            </ExpandableCard>

            <ExpandableCard
              title={strings.voiceControls}
              icon="record_voice_over"
              summary={voiceSummary}
              defaultExpanded={true}
            >
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
            </ExpandableCard>
          </aside>
        </div>

        {/* Suggestions selection */}
        <div className="suggestions-section">
          <AffirmationList />
        </div>
      </main>

      <footer className="app-footer">
        <p>Use fones de ouvido para a melhor experiência com batimentos binaurais.</p>
      </footer>
    </div>
  );
}
