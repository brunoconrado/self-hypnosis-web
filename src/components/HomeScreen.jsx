import React, { useCallback } from 'react';
import { useAudio } from '../providers/AudioProvider';
import { useAffirmation } from '../providers/AffirmationProvider';
import { useAuth } from '../providers/AuthProvider';
import { AffirmationDisplay } from './AffirmationDisplay';
import { AffirmationList } from './AffirmationList';
import { SliderTile } from './SliderTile';
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
    currentAffirmation,
    gapBetweenSec,
    isRunning,
    isPlayingAudio,
    voiceVolume,
    enabledItemsWithAudio,
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
      if (enabledItemsWithAudio.length === 0) {
        alert(strings.noAudioFilesInPlaylist);
        return;
      }

      playAudio();
      startAffirmations();
    }
  }, [isPlaying, enabledItemsWithAudio, playAudio, stopAudio, startAffirmations, stopAffirmations]);

  const canPlay = enabledItemsWithAudio.length > 0;

  // Summary strings
  const binauralSummary = strings.formatBinauralSummary(baseFreq, beatFreq, binauralVolume);
  const voiceSummary = strings.formatVoiceSummary(voiceVolume);

  return (
    <div className="home-screen">
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
        <AffirmationDisplay
          text={currentAffirmation}
          isPlaying={isRunning}
          isPlayingAudio={isPlayingAudio}
        />

        <AffirmationList />

        <div className="cards-container">
          <ExpandableCard
            title={strings.binauralControls}
            icon="waves"
            summary={binauralSummary}
          >
            <SliderTile
              label={strings.baseFrequency}
              value={baseFreq}
              min={100}
              max={500}
              step={10}
              unit={strings.hz}
              onChange={setBaseFreq}
            />
            <SliderTile
              label={strings.beatFrequency}
              value={beatFreq}
              min={1}
              max={30}
              step={1}
              unit={strings.hz}
              onChange={setBeatFreq}
            />
            <SliderTile
              label={strings.binauralVolume}
              value={binauralVolume}
              min={0}
              max={1}
              step={0.05}
              unit=""
              onChange={setBinauralVolume}
            />
          </ExpandableCard>

          <ExpandableCard
            title={strings.voiceControls}
            icon="record_voice_over"
            summary={voiceSummary}
          >
            <SliderTile
              label={strings.voiceVolume}
              value={voiceVolume}
              min={0}
              max={1}
              step={0.05}
              unit=""
              onChange={setVoiceVolume}
            />
            <SliderTile
              label={strings.gapBetweenAudio}
              value={gapBetweenSec}
              min={0}
              max={10}
              step={1}
              unit={strings.seconds}
              onChange={setGapBetweenSec}
            />
          </ExpandableCard>
        </div>

        <div className="play-section">
          <PlayButton
            isPlaying={isPlaying}
            onClick={handlePlay}
            disabled={!canPlay}
          />
          {!canPlay && (
            <p className="no-audio-hint">{strings.selectAffirmationsHint}</p>
          )}
        </div>
      </main>
    </div>
  );
}
