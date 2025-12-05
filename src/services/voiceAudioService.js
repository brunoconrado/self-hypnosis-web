/**
 * Voice Audio Service for Recording and Playback
 * Handles voice recording, storage, and playback using Web APIs
 */

import { get, set, del, keys } from 'idb-keyval';

class VoiceAudioService {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.audioElement = null;
    this.isRecording = false;
    this.isPlaying = false;
    this.currentAudioUrl = null;
    this.volume = 0.8;

    // Callbacks
    this.onRecordingComplete = null;
    this.onPlaybackComplete = null;
    this.onPlaybackStateChange = null;
  }

  /**
   * Set the volume (0-1)
   */
  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.audioElement) {
      this.audioElement.volume = this.volume;
    }
  }

  /**
   * Get current volume
   */
  getVolume() {
    return this.volume;
  }

  /**
   * Request microphone permission
   */
  async requestMicrophonePermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      return false;
    }
  }

  /**
   * Start recording audio
   */
  async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());

        const mimeType = this.mediaRecorder.mimeType;
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });

        if (this.onRecordingComplete) {
          this.onRecordingComplete(audioBlob);
        }
      };

      this.mediaRecorder.start();
      this.isRecording = true;

      return true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      return false;
    }
  }

  /**
   * Stop recording audio
   */
  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
    }
  }

  /**
   * Cancel recording
   */
  cancelRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.ondataavailable = null;
      this.mediaRecorder.onstop = null;
      this.mediaRecorder.stop();
      this.isRecording = false;
      this.audioChunks = [];

      // Stop all tracks
      if (this.mediaRecorder.stream) {
        this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      }
    }
  }

  /**
   * Save audio blob to IndexedDB
   */
  async saveAudio(key, audioBlob) {
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      await set(key, {
        data: arrayBuffer,
        type: audioBlob.type,
        timestamp: Date.now()
      });
      return true;
    } catch (error) {
      console.error('Failed to save audio:', error);
      return false;
    }
  }

  /**
   * Load audio from IndexedDB
   */
  async loadAudio(key) {
    try {
      const stored = await get(key);
      if (stored) {
        return new Blob([stored.data], { type: stored.type });
      }
      return null;
    } catch (error) {
      console.error('Failed to load audio:', error);
      return null;
    }
  }

  /**
   * Delete audio from IndexedDB
   */
  async deleteAudio(key) {
    try {
      await del(key);
      return true;
    } catch (error) {
      console.error('Failed to delete audio:', error);
      return false;
    }
  }

  /**
   * List all audio keys
   */
  async listAudioKeys() {
    try {
      const allKeys = await keys();
      return allKeys.filter(key => typeof key === 'string' && key.startsWith('audio_'));
    } catch (error) {
      console.error('Failed to list audio keys:', error);
      return [];
    }
  }

  /**
   * Get audio duration from blob
   */
  async getAudioDuration(audioBlob) {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(audioBlob);
      const audio = new Audio();

      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(Math.round(audio.duration * 1000)); // Return in milliseconds
      };

      audio.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(0);
      };

      audio.src = url;
    });
  }

  /**
   * Play audio from blob or key
   */
  async play(audioSource) {
    // Stop any current playback
    this.stop();

    let audioBlob;

    if (audioSource instanceof Blob) {
      audioBlob = audioSource;
    } else if (typeof audioSource === 'string') {
      audioBlob = await this.loadAudio(audioSource);
    }

    if (!audioBlob) {
      console.error('No audio to play');
      return false;
    }

    // Revoke previous URL
    if (this.currentAudioUrl) {
      URL.revokeObjectURL(this.currentAudioUrl);
    }

    this.currentAudioUrl = URL.createObjectURL(audioBlob);
    this.audioElement = new Audio(this.currentAudioUrl);
    this.audioElement.volume = this.volume;

    this.audioElement.onended = () => {
      this.isPlaying = false;
      if (this.onPlaybackStateChange) {
        this.onPlaybackStateChange(false);
      }
      if (this.onPlaybackComplete) {
        this.onPlaybackComplete();
      }
    };

    this.audioElement.onplay = () => {
      this.isPlaying = true;
      if (this.onPlaybackStateChange) {
        this.onPlaybackStateChange(true);
      }
    };

    this.audioElement.onpause = () => {
      this.isPlaying = false;
      if (this.onPlaybackStateChange) {
        this.onPlaybackStateChange(false);
      }
    };

    try {
      await this.audioElement.play();
      return true;
    } catch (error) {
      console.error('Failed to play audio:', error);
      return false;
    }
  }

  /**
   * Stop playback
   */
  stop() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      this.audioElement = null;
    }

    if (this.currentAudioUrl) {
      URL.revokeObjectURL(this.currentAudioUrl);
      this.currentAudioUrl = null;
    }

    this.isPlaying = false;
  }

  /**
   * Import audio file
   */
  async importAudioFile(file, key) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      await set(key, {
        data: arrayBuffer,
        type: file.type,
        timestamp: Date.now()
      });

      // Get duration
      const blob = new Blob([arrayBuffer], { type: file.type });
      const duration = await this.getAudioDuration(blob);

      return { success: true, duration };
    } catch (error) {
      console.error('Failed to import audio:', error);
      return { success: false, duration: 0 };
    }
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.stop();
    this.cancelRecording();
  }
}

// Singleton instance
const voiceAudioService = new VoiceAudioService();

export default voiceAudioService;
