import React, { useMemo } from 'react';
import { useAffirmation } from '../providers/AffirmationProvider';
import { useAudio } from '../providers/AudioProvider';
import { SessionPhase } from './SessionPhase';
import { SessionTimeline } from './SessionTimeline';
import { strings } from '../data/strings';
import './SessionBuilder.css';

export function SessionBuilder() {
  const {
    enabledItems,
    gapBetweenSec,
    isRunning,
    currentIndex,
    currentAffirmation,
    isPlayingAudio,
  } = useAffirmation();

  const { isPlaying: isBinauralPlaying } = useAudio();

  // Calculate session duration
  const sessionDuration = useMemo(() => {
    let totalMs = 0;

    // Suggestions phase - estimate based on enabled items
    enabledItems.forEach(item => {
      // Use audio duration if available, otherwise estimate 3 seconds per suggestion
      const itemDuration = item.audioDurationMs || 3000;
      totalMs += itemDuration + (gapBetweenSec * 1000);
    });

    return {
      totalMs,
      minutes: Math.floor(totalMs / 60000),
      seconds: Math.floor((totalMs % 60000) / 1000),
    };
  }, [enabledItems, gapBetweenSec]);

  const isActive = isRunning || isBinauralPlaying;

  return (
    <div className="session-builder">
      <div className="session-header">
        <h2>Sessão Hipnótica</h2>
        <div className="session-duration">
          <span className="material-icons">schedule</span>
          <span>
            {sessionDuration.minutes > 0
              ? `${sessionDuration.minutes}min ${sessionDuration.seconds}s`
              : `${sessionDuration.seconds}s`
            }
          </span>
        </div>
      </div>

      <SessionTimeline
        currentPhase={isActive ? 'suggestions' : null}
        progress={isRunning ? (currentIndex / Math.max(enabledItems.length, 1)) * 100 : 0}
      />

      <div className="session-phases">
        {/* Induction Phase - Placeholder */}
        <SessionPhase
          title="Indução"
          icon="self_improvement"
          status="placeholder"
          description="Scripts de indução hipnótica"
          placeholder="Em breve: escolha scripts de indução para relaxamento progressivo"
        />

        {/* Suggestions Phase - Active */}
        <SessionPhase
          title="Sugestões"
          icon="record_voice_over"
          status={isRunning ? 'active' : 'ready'}
          description={`${enabledItems.length} sugestões selecionadas`}
          currentText={isRunning ? currentAffirmation : null}
          isPlayingAudio={isPlayingAudio}
          progress={isRunning ? ((currentIndex + 1) / enabledItems.length) * 100 : 0}
          count={`${currentIndex + 1}/${enabledItems.length}`}
        />

        {/* Emergence Phase - Placeholder */}
        <SessionPhase
          title="Emersão"
          icon="wb_sunny"
          status="placeholder"
          description="Scripts de retorno à consciência"
          placeholder="Em breve: escolha scripts de emersão para despertar gradual"
        />
      </div>
    </div>
  );
}
