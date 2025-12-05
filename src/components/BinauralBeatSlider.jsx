import React, { useMemo } from 'react';
import { getPresetForFrequency, getPresetsInRange } from '../data/brainwavePresets';
import './BinauralBeatSlider.css';

export function BinauralBeatSlider({
  value,
  onChange,
  min = 1,
  max = 40
}) {
  const currentPreset = useMemo(() => getPresetForFrequency(value), [value]);
  const availablePresets = useMemo(() => getPresetsInRange(min, max), [min, max]);

  const handleSliderChange = (e) => {
    onChange(parseFloat(e.target.value));
  };

  const handlePresetClick = (preset) => {
    onChange(preset.defaultFreq);
  };

  const sliderColor = currentPreset?.color || '#00bfa5';

  return (
    <div className="binaural-beat-slider">
      {/* Frequency display */}
      <div className="bbs-frequency">
        <span className="bbs-value" style={{ color: sliderColor }}>
          {value.toFixed(1)}
        </span>
        <span className="bbs-unit">Hz</span>
      </div>

      {/* Preset chips */}
      <div className="bbs-presets-wrapper">
        <div className="bbs-presets">
          {availablePresets.map((preset) => {
            const isSelected = currentPreset?.type === preset.type;
            return (
              <button
                key={preset.type}
                className={`bbs-preset-chip ${isSelected ? 'selected' : ''}`}
                onClick={() => handlePresetClick(preset)}
                style={{
                  backgroundColor: isSelected ? `${preset.color}4D` : 'rgba(255, 255, 255, 0.05)',
                  borderColor: isSelected ? preset.color : 'rgba(255, 255, 255, 0.2)',
                }}
              >
                <span
                  className="bbs-chip-name"
                  style={{ color: isSelected ? preset.color : 'rgba(255, 255, 255, 0.8)' }}
                >
                  {preset.name}
                </span>
                <span className="bbs-chip-description">
                  {preset.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Slider */}
      <div className="bbs-slider-container">
        <input
          type="range"
          className="bbs-slider"
          min={min}
          max={max}
          step={0.5}
          value={value}
          onChange={handleSliderChange}
          style={{
            '--slider-color': sliderColor,
            '--slider-progress': `${((value - min) / (max - min)) * 100}%`
          }}
        />
      </div>

      {/* Range labels */}
      <div className="bbs-range-labels">
        <span>{min} Hz</span>
        <span>{max} Hz</span>
      </div>
    </div>
  );
}
