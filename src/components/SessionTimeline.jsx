import React from 'react';
import './SessionTimeline.css';

export function SessionTimeline({ currentPhase, progress = 0 }) {
  const phases = [
    { id: 'induction', label: 'Indução', icon: 'self_improvement' },
    { id: 'suggestions', label: 'Sugestões', icon: 'record_voice_over' },
    { id: 'emergence', label: 'Emersão', icon: 'wb_sunny' },
  ];

  const getPhaseStatus = (phaseId) => {
    if (!currentPhase) return 'inactive';

    const currentIndex = phases.findIndex(p => p.id === currentPhase);
    const phaseIndex = phases.findIndex(p => p.id === phaseId);

    if (phaseIndex < currentIndex) return 'completed';
    if (phaseIndex === currentIndex) return 'active';
    return 'inactive';
  };

  return (
    <div className="session-timeline">
      <div className="timeline-track">
        <div className="timeline-progress" style={{ width: `${progress}%` }} />
      </div>
      <div className="timeline-phases">
        {phases.map((phase, index) => {
          const status = getPhaseStatus(phase.id);
          return (
            <div key={phase.id} className={`timeline-phase ${status}`}>
              <div className="timeline-dot">
                {status === 'completed' ? (
                  <span className="material-icons">check</span>
                ) : status === 'active' ? (
                  <div className="dot-pulse" />
                ) : (
                  <span className="dot-number">{index + 1}</span>
                )}
              </div>
              <span className="timeline-label">{phase.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
