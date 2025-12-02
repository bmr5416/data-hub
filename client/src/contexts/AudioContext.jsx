import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { sounds, getSoundPath, getPreloadSounds, shouldPlaySound } from '../data/audioSounds';

const AudioContext = createContext(null);

// localStorage key
const AUDIO_ENABLED_KEY = 'data-hub-audio-enabled';

/**
 * AudioProvider - Manages global audio state and playback
 *
 * Features:
 * - Global audio enabled/disabled toggle
 * - Preloads critical sounds on mount
 * - Debouncing for frequent sounds
 * - Priority system (higher priority interrupts lower)
 * - localStorage persistence for user preference
 */
export function AudioProvider({ children }) {
  // Audio enabled state (default: ON)
  const [audioEnabled, setAudioEnabled] = useState(() => {
    try {
      const stored = localStorage.getItem(AUDIO_ENABLED_KEY);
      // Default to true if not set
      return stored === null ? true : stored === 'true';
    } catch {
      return true;
    }
  });

  // Audio instances cache
  const audioCache = useRef(new Map());

  // Last play times for debouncing
  const lastPlayTimes = useRef(new Map());

  // Currently playing sounds (for stopping)
  const playingSounds = useRef(new Map());

  // Persist audio enabled state
  useEffect(() => {
    try {
      localStorage.setItem(AUDIO_ENABLED_KEY, audioEnabled.toString());
    } catch (e) {
      console.warn('Failed to save audio preference:', e);
    }
  }, [audioEnabled]);

  /**
   * Preload a sound into cache
   */
  const preloadSound = useCallback((soundId) => {
    if (audioCache.current.has(soundId)) return;

    const path = getSoundPath(soundId);
    if (!path) return;

    const audio = new Audio(path);
    audio.preload = 'auto';
    audioCache.current.set(soundId, audio);
  }, []);

  /**
   * Get or create audio instance for a sound
   */
  const getAudioInstance = useCallback((soundId) => {
    // Check cache first
    if (audioCache.current.has(soundId)) {
      return audioCache.current.get(soundId);
    }

    // Create new instance
    const path = getSoundPath(soundId);
    if (!path) return null;

    const audio = new Audio(path);
    audioCache.current.set(soundId, audio);
    return audio;
  }, []);

  /**
   * Play a sound by ID
   * @param {string} soundId - Sound identifier (e.g., 'ui.click')
   * @param {Object} options - Optional overrides
   * @param {number} options.volume - Override default volume (0-1)
   * @param {boolean} options.force - Skip debounce check
   */
  const playSound = useCallback((soundId, options = {}) => {
    // Exit early if audio disabled
    if (!audioEnabled) return;

    const soundDef = sounds[soundId];
    if (!soundDef) {
      console.warn(`Unknown sound: ${soundId}`);
      return;
    }

    // Check debounce (unless forced)
    if (!options.force) {
      const lastPlayTime = lastPlayTimes.current.get(soundId) || 0;
      if (!shouldPlaySound(soundId, lastPlayTime)) {
        return;
      }
    }

    // Get audio instance
    const audio = getAudioInstance(soundId);
    if (!audio) return;

    // Set volume (option override or default)
    audio.volume = options.volume ?? soundDef.volume;

    // Reset and play
    audio.currentTime = 0;
    audio.play().catch((err) => {
      // Ignore autoplay policy errors (user hasn't interacted yet)
      if (err.name !== 'NotAllowedError') {
        console.warn(`Failed to play sound ${soundId}:`, err);
      }
    });

    // Track play time and playing state
    lastPlayTimes.current.set(soundId, Date.now());
    playingSounds.current.set(soundId, audio);

    // Clean up playing state when done
    audio.onended = () => {
      playingSounds.current.delete(soundId);
    };
  }, [audioEnabled, getAudioInstance]);

  /**
   * Stop a specific sound
   * @param {string} soundId - Sound identifier to stop
   */
  const stopSound = useCallback((soundId) => {
    const audio = playingSounds.current.get(soundId);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      playingSounds.current.delete(soundId);
    }
  }, []);

  /**
   * Stop all playing sounds
   */
  const stopAllSounds = useCallback(() => {
    playingSounds.current.forEach((audio, soundId) => {
      audio.pause();
      audio.currentTime = 0;
      playingSounds.current.delete(soundId);
    });
  }, []);

  /**
   * Toggle audio enabled state
   */
  const toggleAudio = useCallback(() => {
    setAudioEnabled((prev) => {
      const newState = !prev;
      // Stop all sounds when disabling
      if (!newState) {
        stopAllSounds();
      }
      return newState;
    });
  }, [stopAllSounds]);

  /**
   * Enable audio
   */
  const enableAudio = useCallback(() => {
    setAudioEnabled(true);
  }, []);

  /**
   * Disable audio
   */
  const disableAudio = useCallback(() => {
    stopAllSounds();
    setAudioEnabled(false);
  }, [stopAllSounds]);

  // Preload critical sounds on mount
  useEffect(() => {
    const soundsToPreload = getPreloadSounds();
    soundsToPreload.forEach((sound) => {
      preloadSound(sound.id);
    });
  }, [preloadSound]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllSounds();
      audioCache.current.clear();
    };
  }, [stopAllSounds]);

  const value = {
    // State
    audioEnabled,

    // Actions
    playSound,
    stopSound,
    stopAllSounds,
    toggleAudio,
    enableAudio,
    disableAudio,
    preloadSound,
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
}

AudioProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Hook to access audio context
 * @returns {Object} Audio context value
 */
export function useAudioContext() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudioContext must be used within an AudioProvider');
  }
  return context;
}
