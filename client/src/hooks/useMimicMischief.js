/**
 * useMimicMischief - Hook for periodic mimic chest peeking behavior
 *
 * Features:
 * - Random interval peeking (eyes visible briefly)
 * - Rare wiggle/crawl easter egg
 * - Click triggers surprise attack animation
 * - Respects reduced motion preferences
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getMimicAnimationDuration } from '../data/mimicAnimations';

// Timing constants (milliseconds)
const PEEK_INTERVAL_MIN = 15000;  // 15 seconds minimum between peeks
const PEEK_INTERVAL_MAX = 45000;  // 45 seconds maximum
const PEEK_DELAY_INITIAL = 5000;  // Wait 5 seconds before first possible peek

// Easter egg chances
const WIGGLE_CHANCE = 0.08;       // 8% chance for wiggle instead of peek
const QUICK_PEEK_CHANCE = 0.3;   // 30% chance for quick peek vs revealed idle

/**
 * Mimic states
 */
export const MIMIC_STATES = {
  HIDDEN: 'hidden',      // Closed chest (HiddenIdle)
  PEEKING: 'peeking',    // Eyes visible (RevealedIdle or QuickPeek)
  AWAKENING: 'awakening', // Surprise attack (SurpriseAttack)
  WIGGLING: 'wiggling',  // Easter egg (Wiggle)
};

/**
 * Map mimic states to animations
 */
const STATE_TO_ANIMATION = {
  [MIMIC_STATES.HIDDEN]: 'HiddenIdle',
  [MIMIC_STATES.PEEKING]: 'RevealedIdle',
  [MIMIC_STATES.AWAKENING]: 'SurpriseAttack',
  [MIMIC_STATES.WIGGLING]: 'Wiggle',
};

/**
 * Get random interval between peeks
 */
function getRandomPeekInterval() {
  return Math.floor(
    Math.random() * (PEEK_INTERVAL_MAX - PEEK_INTERVAL_MIN) + PEEK_INTERVAL_MIN
  );
}

/**
 * Hook for mimic mischief behavior
 * @param {boolean} isActive - Whether the mimic is visible (minimized state active)
 * @returns {Object} Mimic state and handlers
 */
export function useMimicMischief(isActive = false) {
  const [mimicState, setMimicState] = useState(MIMIC_STATES.HIDDEN);
  const [currentAnimation, setCurrentAnimation] = useState('HiddenIdle');

  const peekTimerRef = useRef(null);
  const returnToHiddenTimerRef = useRef(null);
  const isFirstPeekRef = useRef(true);

  /**
   * Clear all timers
   */
  const clearTimers = useCallback(() => {
    if (peekTimerRef.current) {
      clearTimeout(peekTimerRef.current);
      peekTimerRef.current = null;
    }
    if (returnToHiddenTimerRef.current) {
      clearTimeout(returnToHiddenTimerRef.current);
      returnToHiddenTimerRef.current = null;
    }
  }, []);

  /**
   * Return to hidden state
   */
  const returnToHidden = useCallback(() => {
    setMimicState(MIMIC_STATES.HIDDEN);
    setCurrentAnimation('HiddenIdle');
  }, []);

  /**
   * Play a peek animation
   */
  const doPeek = useCallback(() => {
    // Check for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      // Schedule next peek without playing animation
      peekTimerRef.current = setTimeout(doPeek, getRandomPeekInterval());
      return;
    }

    // Random chance for wiggle easter egg
    if (Math.random() < WIGGLE_CHANCE) {
      setMimicState(MIMIC_STATES.WIGGLING);
      setCurrentAnimation('Wiggle');
      const wiggleDuration = getMimicAnimationDuration('Wiggle');

      returnToHiddenTimerRef.current = setTimeout(() => {
        returnToHidden();
        // Schedule next peek
        peekTimerRef.current = setTimeout(doPeek, getRandomPeekInterval());
      }, wiggleDuration);
      return;
    }

    // Choose between quick peek and revealed idle
    const animation = Math.random() < QUICK_PEEK_CHANCE ? 'QuickPeek' : 'RevealedIdle';
    setMimicState(MIMIC_STATES.PEEKING);
    setCurrentAnimation(animation);

    const peekDuration = getMimicAnimationDuration(animation);

    // Return to hidden after animation completes
    returnToHiddenTimerRef.current = setTimeout(() => {
      returnToHidden();
      // Schedule next peek
      peekTimerRef.current = setTimeout(doPeek, getRandomPeekInterval());
    }, peekDuration);
  }, [returnToHidden]);

  /**
   * Start the peek timer
   */
  const startPeekTimer = useCallback(() => {
    clearTimers();

    // Delay before first peek
    const initialDelay = isFirstPeekRef.current
      ? PEEK_DELAY_INITIAL + Math.random() * 5000  // 5-10 seconds initial
      : getRandomPeekInterval();

    isFirstPeekRef.current = false;
    peekTimerRef.current = setTimeout(doPeek, initialDelay);
  }, [clearTimers, doPeek]);

  /**
   * Handle click - triggers surprise attack
   * @returns {string} The animation that was triggered
   */
  const handleClick = useCallback(() => {
    clearTimers();

    // Play surprise attack
    setMimicState(MIMIC_STATES.AWAKENING);
    setCurrentAnimation('SurpriseAttack');

    return 'SurpriseAttack';
  }, [clearTimers]);

  /**
   * Handle animation complete
   * @param {string} animationName - The animation that completed
   */
  const handleAnimationComplete = useCallback((animationName) => {
    if (animationName === 'SurpriseAttack') {
      // Don't return to hidden - the parent should handle transition to full Imp
      return;
    }

    // For other animations, return to hidden if still active
    if (mimicState !== MIMIC_STATES.HIDDEN) {
      returnToHidden();
    }
  }, [mimicState, returnToHidden]);

  /**
   * Reset to initial state
   */
  const reset = useCallback(() => {
    clearTimers();
    isFirstPeekRef.current = true;
    returnToHidden();
  }, [clearTimers, returnToHidden]);

  // Start/stop peek timer based on active state
  useEffect(() => {
    if (isActive) {
      startPeekTimer();
    } else {
      clearTimers();
      reset();
    }

    return clearTimers;
  }, [isActive, startPeekTimer, clearTimers, reset]);

  // Cleanup on unmount
  useEffect(() => {
    return clearTimers;
  }, [clearTimers]);

  return {
    mimicState,
    currentAnimation,
    handleClick,
    handleAnimationComplete,
    reset,
    // Expose for testing/debugging
    STATE_TO_ANIMATION,
    MIMIC_STATES,
  };
}

export default useMimicMischief;
