/**
 * useImpMischief - Hook for Imp reactive mouse tracking behavior
 *
 * Features:
 * - Tracks mouse position and triggers Look animations toward cursor
 * - Proximity-based intensity (closer = more alert)
 * - Double-click easter egg
 * - Rapid-click detection for special reactions
 * - Smooth return to idle when cursor leaves range
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useImp, LIFECYCLE_STATES } from '../contexts/ImpContext';

// Throttle delay for mouse tracking (ms) - responsive but not jittery
const THROTTLE_MS = 150;

// Distance thresholds (pixels)
const MIN_DISTANCE = 40;   // Closer than this = too close, no look
const MAX_DISTANCE = 250;  // Further than this = out of range

// Time to return to idle after cursor leaves range (ms)
const IDLE_RETURN_DELAY = 800;

// Easter egg: rapid click detection
const RAPID_CLICK_WINDOW = 2000;  // Window to count clicks
const RAPID_CLICK_THRESHOLD = 5;  // Clicks needed for easter egg

/**
 * Determine the look direction based on angle from Imp to cursor
 * NOTE: Animations are from Imp's perspective (LookRight = look toward screen-left)
 * We calculate the angle TO the cursor, then map to the correct animation
 *
 * @param {number} angle - Angle in degrees (0° = cursor right of Imp)
 * @returns {string} - Animation name
 */
function getDirectionFromAngle(angle) {
  // Normalize angle to 0-360 range for easier reasoning
  const normalized = ((angle % 360) + 360) % 360;

  // Map angles to Imp's look direction (animations are from Imp's POV)
  // Cursor position → Imp should look toward it
  // 0° = cursor to right → Imp looks right (LookLeft animation - Imp's left is screen right)
  // 180° = cursor to left → Imp looks left (LookRight animation)

  // 8 directions with 45° sectors
  if (normalized >= 337.5 || normalized < 22.5) {
    return 'LookLeft';      // Cursor right → Imp looks to his left (toward cursor)
  }
  if (normalized >= 22.5 && normalized < 67.5) {
    return 'LookUpLeft';    // Cursor up-right
  }
  if (normalized >= 67.5 && normalized < 112.5) {
    return 'LookUp';        // Cursor above
  }
  if (normalized >= 112.5 && normalized < 157.5) {
    return 'LookUpRight';   // Cursor up-left
  }
  if (normalized >= 157.5 && normalized < 202.5) {
    return 'LookRight';     // Cursor left → Imp looks to his right (toward cursor)
  }
  if (normalized >= 202.5 && normalized < 247.5) {
    return 'LookDownRight'; // Cursor down-left
  }
  if (normalized >= 247.5 && normalized < 292.5) {
    return 'LookDown';      // Cursor below
  }
  if (normalized >= 292.5 && normalized < 337.5) {
    return 'LookDownLeft';  // Cursor down-right
  }

  return null;
}

/**
 * Hook for reactive mouse tracking and click easter eggs
 * @param {React.RefObject} spriteRef - Ref to the Imp container element
 * @param {boolean} enabled - Whether tracking is enabled
 */
export function useImpMischief(spriteRef, enabled = true) {
  const {
    lifecycleState,
    playAnimation,
    resetAnimation,
    resetInactivityTimer,
  } = useImp();

  const [currentLookDirection, setCurrentLookDirection] = useState(null);
  const [proximityLevel, setProximityLevel] = useState(0); // 0-1 for glow intensity

  const lastUpdateRef = useRef(0);
  const lastDirectionRef = useRef(null);
  const idleReturnTimerRef = useRef(null);
  const clickTimestampsRef = useRef([]);
  const isLookingRef = useRef(false);

  /**
   * Calculate direction and distance from Imp to cursor
   */
  const calculateTrackingData = useCallback((mouseX, mouseY) => {
    if (!spriteRef?.current) return { direction: null, distance: Infinity, proximity: 0 };

    const rect = spriteRef.current.getBoundingClientRect();
    const impCenterX = rect.left + rect.width / 2;
    const impCenterY = rect.top + rect.height / 2;

    // Vector from Imp to cursor
    const dx = mouseX - impCenterX;
    const dy = mouseY - impCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Calculate proximity level (1 = very close, 0 = far)
    let proximity = 0;
    if (distance < MAX_DISTANCE) {
      proximity = Math.max(0, 1 - (distance / MAX_DISTANCE));
    }

    // Check if in tracking range
    if (distance < MIN_DISTANCE || distance > MAX_DISTANCE) {
      return { direction: null, distance, proximity };
    }

    // Calculate angle in degrees (0° = right, counterclockwise positive)
    // atan2 gives us angle from positive X axis
    const angle = Math.atan2(-dy, dx) * (180 / Math.PI);
    // Convert to 0-360 range
    const normalizedAngle = ((angle % 360) + 360) % 360;

    const direction = getDirectionFromAngle(normalizedAngle);

    return { direction, distance, proximity };
  }, [spriteRef]);

  /**
   * Return to idle state smoothly
   */
  const returnToIdle = useCallback(() => {
    if (isLookingRef.current) {
      isLookingRef.current = false;
      lastDirectionRef.current = null;
      setCurrentLookDirection(null);
      resetAnimation();
    }
  }, [resetAnimation]);

  /**
   * Handle mouse movement
   */
  const handleMouseMove = useCallback((e) => {
    // Only track when idle or already looking
    if (lifecycleState !== LIFECYCLE_STATES.IDLE && lifecycleState !== LIFECYCLE_STATES.MISCHIEF) {
      return;
    }
    if (!enabled) return;

    // Clear any pending idle return
    if (idleReturnTimerRef.current) {
      clearTimeout(idleReturnTimerRef.current);
      idleReturnTimerRef.current = null;
    }

    // Throttle updates
    const now = Date.now();
    if (now - lastUpdateRef.current < THROTTLE_MS) return;
    lastUpdateRef.current = now;

    const { direction, proximity } = calculateTrackingData(e.clientX, e.clientY);

    // Update proximity for glow effect
    setProximityLevel(proximity);

    if (direction && direction !== lastDirectionRef.current) {
      // New direction - look toward cursor
      lastDirectionRef.current = direction;
      isLookingRef.current = true;
      setCurrentLookDirection(direction);
      playAnimation(direction);
      resetInactivityTimer();
    } else if (!direction && lastDirectionRef.current) {
      // Cursor moved out of range - schedule return to idle
      idleReturnTimerRef.current = setTimeout(returnToIdle, IDLE_RETURN_DELAY);
    }
  }, [lifecycleState, enabled, calculateTrackingData, playAnimation, resetInactivityTimer, returnToIdle]);

  /**
   * Handle mouse leaving window
   */
  const handleMouseLeave = useCallback(() => {
    setProximityLevel(0);
    if (idleReturnTimerRef.current) {
      clearTimeout(idleReturnTimerRef.current);
    }
    idleReturnTimerRef.current = setTimeout(returnToIdle, IDLE_RETURN_DELAY);
  }, [returnToIdle]);

  /**
   * Handle rapid clicks for easter egg
   */
  const handleRapidClick = useCallback(() => {
    const now = Date.now();

    // Add this click timestamp
    clickTimestampsRef.current.push(now);

    // Remove clicks outside the window
    clickTimestampsRef.current = clickTimestampsRef.current.filter(
      ts => now - ts < RAPID_CLICK_WINDOW
    );

    // Check for easter egg
    if (clickTimestampsRef.current.length >= RAPID_CLICK_THRESHOLD) {
      // Easter egg triggered! Play special animation
      clickTimestampsRef.current = []; // Reset

      // Pick a special animation
      const specialAnimations = ['GetWizardy', 'GetArtsy', 'GetTechy', 'Congratulate'];
      const special = specialAnimations[Math.floor(Math.random() * specialAnimations.length)];
      playAnimation(special);
      resetInactivityTimer();
      return true;
    }

    return false;
  }, [playAnimation, resetInactivityTimer]);

  /**
   * Handle double-click easter egg
   */
  const handleDoubleClick = useCallback(() => {
    // Double-click triggers a wizard animation
    const wizardAnimations = ['GetWizardy', 'GetArtsy', 'GetTechy'];
    const animation = wizardAnimations[Math.floor(Math.random() * wizardAnimations.length)];
    playAnimation(animation);
    resetInactivityTimer();
  }, [playAnimation, resetInactivityTimer]);

  // Set up event listeners
  useEffect(() => {
    if (!enabled) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (idleReturnTimerRef.current) {
        clearTimeout(idleReturnTimerRef.current);
      }
    };
  }, [enabled, handleMouseMove, handleMouseLeave]);

  // Reset when lifecycle changes away from idle
  useEffect(() => {
    if (lifecycleState !== LIFECYCLE_STATES.IDLE && lifecycleState !== LIFECYCLE_STATES.MISCHIEF) {
      lastDirectionRef.current = null;
      isLookingRef.current = false;
      setCurrentLookDirection(null);
      setProximityLevel(0);
    }
  }, [lifecycleState]);

  return {
    currentLookDirection,
    proximityLevel,
    handleRapidClick,
    handleDoubleClick,
  };
}

export default useImpMischief;
