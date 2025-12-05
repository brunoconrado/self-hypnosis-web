import React from 'react';
import './SliderTile.css';

export function SliderTile({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
  disabled = false
}) {
  const handleChange = (e) => {
    onChange(parseFloat(e.target.value));
  };

  // Format display value - show percentage for 0-1 ranges without unit
  let displayValue;
  if (unit === '' && max <= 1) {
    displayValue = `${Math.round(value * 100)}%`;
  } else if (Number.isInteger(value)) {
    displayValue = `${value} ${unit}`.trim();
  } else {
    displayValue = `${value.toFixed(1)} ${unit}`.trim();
  }

  return (
    <div className={`slider-tile ${disabled ? 'disabled' : ''}`}>
      <div className="slider-header">
        <span className="slider-label">{label}</span>
        <span className="slider-value">{displayValue}</span>
      </div>
      <input
        type="range"
        className="slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        disabled={disabled}
      />
    </div>
  );
}
