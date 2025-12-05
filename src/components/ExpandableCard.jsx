import React, { useState } from 'react';
import './ExpandableCard.css';

export function ExpandableCard({
  title,
  icon,
  summary,
  children,
  defaultExpanded = false
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`expandable-card ${isExpanded ? 'expanded' : ''}`}>
      <button
        className="card-header"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <div className="card-header-left">
          {icon && <span className="material-icons card-icon">{icon}</span>}
          <span className="card-title">{title}</span>
        </div>
        <div className="card-header-right">
          {!isExpanded && summary && (
            <span className="card-summary">{summary}</span>
          )}
          <span className="material-icons expand-icon">
            {isExpanded ? 'expand_less' : 'expand_more'}
          </span>
        </div>
      </button>

      <div className={`card-content ${isExpanded ? 'visible' : ''}`}>
        <div className="card-content-inner">
          {children}
        </div>
      </div>
    </div>
  );
}
