/**
 * Brainwave frequency presets
 * Each preset defines a frequency range and its associated mental state
 */

export const BRAINWAVE_TYPES = {
  DELTA: 'delta',
  THETA: 'theta',
  ALPHA: 'alpha',
  BETA: 'beta',
  GAMMA: 'gamma'
};

export const brainwavePresets = [
  {
    type: BRAINWAVE_TYPES.DELTA,
    name: 'Delta',
    description: 'Sono profundo',
    minFreq: 0.5,
    maxFreq: 4,
    defaultFreq: 2,
    color: '#9C27B0' // Purple
  },
  {
    type: BRAINWAVE_TYPES.THETA,
    name: 'Theta',
    description: 'Meditação',
    minFreq: 4,
    maxFreq: 8,
    defaultFreq: 6,
    color: '#3F51B5' // Indigo
  },
  {
    type: BRAINWAVE_TYPES.ALPHA,
    name: 'Alpha',
    description: 'Relaxamento',
    minFreq: 8,
    maxFreq: 12,
    defaultFreq: 10,
    color: '#00BFA5' // Teal
  },
  {
    type: BRAINWAVE_TYPES.BETA,
    name: 'Beta',
    description: 'Foco',
    minFreq: 12,
    maxFreq: 30,
    defaultFreq: 20,
    color: '#FF9800' // Orange
  },
  {
    type: BRAINWAVE_TYPES.GAMMA,
    name: 'Gamma',
    description: 'Alta cognição',
    minFreq: 30,
    maxFreq: 100,
    defaultFreq: 40,
    color: '#F44336' // Red
  }
];

/**
 * Get the preset that contains a given frequency
 * @param {number} freq - The frequency to check
 * @returns {object|null} - The matching preset or null
 */
export function getPresetForFrequency(freq) {
  return brainwavePresets.find(
    preset => freq >= preset.minFreq && freq < preset.maxFreq
  ) || null;
}

/**
 * Get presets that fall within a given range
 * @param {number} min - Minimum frequency
 * @param {number} max - Maximum frequency
 * @returns {array} - Array of presets within range
 */
export function getPresetsInRange(min, max) {
  return brainwavePresets.filter(
    preset => preset.defaultFreq >= min && preset.defaultFreq <= max
  );
}
