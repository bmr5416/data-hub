import { useCallback } from 'react';
import { useAudioContext } from '../contexts/AudioContext';

/**
 * useAudio - Hook for playing sounds in components
 *
 * Provides a simplified interface for playing sounds with
 * automatic context access and common sound shortcuts.
 *
 * @example
 * const { playSound, playClick, audioEnabled } = useAudio();
 *
 * // Play any sound
 * playSound('modal.open');
 *
 * // Use shortcuts
 * <button onClick={() => { playClick(); handleClick(); }}>Click</button>
 */
export function useAudio() {
  const {
    audioEnabled,
    playSound: contextPlaySound,
    stopSound,
    stopAllSounds,
    toggleAudio,
  } = useAudioContext();

  /**
   * Play a sound by ID
   * @param {string} soundId - Sound identifier
   * @param {Object} options - Optional overrides
   */
  const playSound = useCallback(
    (soundId, options) => {
      contextPlaySound(soundId, options);
    },
    [contextPlaySound]
  );

  // ===== UI SOUND SHORTCUTS =====

  /**
   * Play button click sound
   */
  const playClick = useCallback(() => {
    contextPlaySound('ui.click');
  }, [contextPlaySound]);

  /**
   * Play toggle/switch sound
   */
  const playToggle = useCallback(() => {
    contextPlaySound('ui.toggle');
  }, [contextPlaySound]);

  /**
   * Play tab selection sound
   */
  const playTab = useCallback(() => {
    contextPlaySound('ui.tab');
  }, [contextPlaySound]);

  // ===== MODAL SOUND SHORTCUTS =====

  /**
   * Play modal open sound
   */
  const playModalOpen = useCallback(() => {
    contextPlaySound('modal.open');
  }, [contextPlaySound]);

  /**
   * Play modal close sound
   */
  const playModalClose = useCallback(() => {
    contextPlaySound('modal.close');
  }, [contextPlaySound]);

  // ===== FEEDBACK SOUND SHORTCUTS =====

  /**
   * Play success sound
   */
  const playSuccess = useCallback(() => {
    contextPlaySound('feedback.success');
  }, [contextPlaySound]);

  /**
   * Play error sound
   */
  const playError = useCallback(() => {
    contextPlaySound('feedback.error');
  }, [contextPlaySound]);

  /**
   * Play warning sound
   */
  const playWarning = useCallback(() => {
    contextPlaySound('feedback.warning');
  }, [contextPlaySound]);

  // ===== WIZARD SOUND SHORTCUTS =====

  /**
   * Play wizard step complete sound
   */
  const playWizardStep = useCallback(() => {
    contextPlaySound('wizard.step');
  }, [contextPlaySound]);

  /**
   * Play wizard complete sound
   */
  const playWizardComplete = useCallback(() => {
    contextPlaySound('wizard.complete');
  }, [contextPlaySound]);

  // ===== IMP SOUND SHORTCUTS =====

  /**
   * Play Imp interaction sound
   */
  const playImpInteract = useCallback(() => {
    contextPlaySound('imp.interact');
  }, [contextPlaySound]);

  /**
   * Play Imp appear sound
   */
  const playImpAppear = useCallback(() => {
    contextPlaySound('imp.appear');
  }, [contextPlaySound]);

  /**
   * Play Imp dismiss sound
   */
  const playImpDismiss = useCallback(() => {
    contextPlaySound('imp.dismiss');
  }, [contextPlaySound]);

  return {
    // State
    audioEnabled,

    // Core functions
    playSound,
    stopSound,
    stopAllSounds,
    toggleAudio,

    // UI shortcuts
    playClick,
    playToggle,
    playTab,

    // Modal shortcuts
    playModalOpen,
    playModalClose,

    // Feedback shortcuts
    playSuccess,
    playError,
    playWarning,

    // Wizard shortcuts
    playWizardStep,
    playWizardComplete,

    // Imp shortcuts
    playImpInteract,
    playImpAppear,
    playImpDismiss,
  };
}

export default useAudio;
