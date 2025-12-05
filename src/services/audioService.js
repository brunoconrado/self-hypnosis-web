/**
 * Audio Service for Binaural Beat Generation
 * Uses Web Audio API to generate real-time binaural beats
 */

class AudioService {
  constructor() {
    this.audioContext = null;
    this.leftOscillator = null;
    this.rightOscillator = null;
    this.leftGain = null;
    this.rightGain = null;
    this.merger = null;
    this.masterGain = null;
    this.isPlaying = false;

    // Default parameters
    this.baseFreq = 200;
    this.beatFreq = 10;
    this.volume = 0.5;
  }

  /**
   * Initialize the audio context (must be called after user interaction)
   */
  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.audioContext;
  }

  /**
   * Set the base frequency (100-500 Hz)
   */
  setBaseFreq(freq) {
    this.baseFreq = Math.max(100, Math.min(500, freq));
    if (this.isPlaying) {
      this.updateFrequencies();
    }
  }

  /**
   * Set the beat frequency (1-30 Hz)
   */
  setBeatFreq(freq) {
    this.beatFreq = Math.max(1, Math.min(30, freq));
    if (this.isPlaying) {
      this.updateFrequencies();
    }
  }

  /**
   * Set the volume (0-1)
   */
  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
    }
  }

  /**
   * Update oscillator frequencies
   */
  updateFrequencies() {
    if (this.leftOscillator && this.rightOscillator) {
      const leftFreq = this.baseFreq;
      const rightFreq = this.baseFreq + this.beatFreq;

      this.leftOscillator.frequency.setValueAtTime(leftFreq, this.audioContext.currentTime);
      this.rightOscillator.frequency.setValueAtTime(rightFreq, this.audioContext.currentTime);
    }
  }

  /**
   * Start playing binaural beats
   */
  play() {
    if (this.isPlaying) return;

    this.init();

    // Resume context if suspended (autoplay policy)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    // Create oscillators
    this.leftOscillator = this.audioContext.createOscillator();
    this.rightOscillator = this.audioContext.createOscillator();

    // Set frequencies
    this.leftOscillator.frequency.value = this.baseFreq;
    this.rightOscillator.frequency.value = this.baseFreq + this.beatFreq;

    // Set sine wave type
    this.leftOscillator.type = 'sine';
    this.rightOscillator.type = 'sine';

    // Create gain nodes for each channel
    this.leftGain = this.audioContext.createGain();
    this.rightGain = this.audioContext.createGain();
    this.leftGain.gain.value = 1;
    this.rightGain.gain.value = 1;

    // Create channel merger for stereo output
    this.merger = this.audioContext.createChannelMerger(2);

    // Create master gain
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = this.volume;

    // Connect left oscillator to left channel (0)
    this.leftOscillator.connect(this.leftGain);
    this.leftGain.connect(this.merger, 0, 0);

    // Connect right oscillator to right channel (1)
    this.rightOscillator.connect(this.rightGain);
    this.rightGain.connect(this.merger, 0, 1);

    // Connect merger to master gain to destination
    this.merger.connect(this.masterGain);
    this.masterGain.connect(this.audioContext.destination);

    // Start oscillators
    this.leftOscillator.start();
    this.rightOscillator.start();

    this.isPlaying = true;
  }

  /**
   * Stop playing binaural beats
   */
  stop() {
    if (!this.isPlaying) return;

    // Stop oscillators
    if (this.leftOscillator) {
      this.leftOscillator.stop();
      this.leftOscillator.disconnect();
      this.leftOscillator = null;
    }

    if (this.rightOscillator) {
      this.rightOscillator.stop();
      this.rightOscillator.disconnect();
      this.rightOscillator = null;
    }

    // Disconnect gains
    if (this.leftGain) {
      this.leftGain.disconnect();
      this.leftGain = null;
    }

    if (this.rightGain) {
      this.rightGain.disconnect();
      this.rightGain = null;
    }

    // Disconnect merger
    if (this.merger) {
      this.merger.disconnect();
      this.merger = null;
    }

    // Disconnect master gain
    if (this.masterGain) {
      this.masterGain.disconnect();
      this.masterGain = null;
    }

    this.isPlaying = false;
  }

  /**
   * Toggle play/stop
   */
  toggle() {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.play();
    }
    return this.isPlaying;
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Singleton instance
const audioService = new AudioService();

export default audioService;
