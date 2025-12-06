import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { getAnimationNames, getRandomAnimationFromCategory, getAnimationDuration } from '../data/impAnimations';

const ImpContext = createContext(null);

// localStorage keys
const SEEN_TIPS_KEY = 'capi-imp-seen-tips';
const DISMISSED_KEY = 'capi-imp-dismissed';

// Lifecycle states
export const LIFECYCLE_STATES = {
  DORMANT: 'dormant',       // Sleeping (IdleSnooze animation)
  AWAKENING: 'awakening',   // Waking up animation
  IDLE: 'idle',             // Active but no tip showing
  ACTIVE: 'active',         // Showing a tip
  MISCHIEF: 'mischief',     // Playing random fun animation
  DEPARTING: 'departing',   // Going to sleep animation
};

// Timing constants (in ms)
const INACTIVITY_TO_MISCHIEF = 5000;   // 5 seconds of idle before mischief
const MISCHIEF_TO_DORMANT = 15000;     // 15 seconds total before sleep
const IDLE_VARIETY_INTERVAL = 8000;    // Cycle idle animations every 8 seconds

// Idle variety animations (cycle through these when idle)
const IDLE_VARIETY_ANIMATIONS = [
  'Idle',
  'IdleSideToSide',
  'IdleFingerTap',
  'IdleHeadScratch',
  'IdleEyeBrowRaise',
];

// First-visit key
const FIRST_VISIT_KEY = 'capi-imp-first-visit';

/**
 * ImpProvider - Manages state for the Imp assistant
 *
 * State:
 * - lifecycleState: current lifecycle state (dormant, awakening, idle, active, mischief, departing)
 * - isVisible: whether the balloon is currently showing
 * - isMinimized: whether Imp has been dismissed (shows small icon)
 * - currentTip: the tip object currently being displayed
 * - seenTipIds: array of tip IDs that have been shown
 * - currentAnimation: animation currently playing
 */
export function ImpProvider({ children }) {
  // Lifecycle state
  const [lifecycleState, setLifecycleState] = useState(LIFECYCLE_STATES.IDLE);

  // Visibility state
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(() => {
    try {
      return localStorage.getItem(DISMISSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Current tip and animation
  const [currentTip, setCurrentTip] = useState(null);
  const [currentAnimation, setCurrentAnimation] = useState('Idle');

  // First visit tracking
  const [isFirstVisit, setIsFirstVisit] = useState(() => {
    try {
      return localStorage.getItem(FIRST_VISIT_KEY) !== 'true';
    } catch {
      return true;
    }
  });

  // Timers
  const inactivityTimerRef = useRef(null);
  const mischiefTimerRef = useRef(null);
  const idleVarietyTimerRef = useRef(null);
  const lastInteractionRef = useRef(Date.now());
  const idleAnimationIndexRef = useRef(0);

  // Ref for goToDormant to avoid circular dependency
  const goToDormantRef = useRef(null);

  // Ref to track current lifecycle state for use in timer callbacks (prevents stale closures)
  const lifecycleStateRef = useRef(lifecycleState);

  // Seen tips tracking (persisted)
  const [seenTipIds, setSeenTipIds] = useState(() => {
    try {
      const stored = localStorage.getItem(SEEN_TIPS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persist seen tips to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SEEN_TIPS_KEY, JSON.stringify(seenTipIds));
    } catch {
      // Silently ignore localStorage errors (quota exceeded, private browsing, etc.)
    }
  }, [seenTipIds]);

  // Persist dismissed state
  useEffect(() => {
    try {
      localStorage.setItem(DISMISSED_KEY, isMinimized.toString());
    } catch {
      // Silently ignore localStorage errors
    }
  }, [isMinimized]);

  // Keep lifecycle state ref in sync (prevents stale closures in timer callbacks)
  useEffect(() => {
    lifecycleStateRef.current = lifecycleState;
  }, [lifecycleState]);

  /**
   * Reset inactivity timer
   */
  const resetInactivityTimer = useCallback(() => {
    lastInteractionRef.current = Date.now();

    // Clear existing timers
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (mischiefTimerRef.current) {
      clearTimeout(mischiefTimerRef.current);
    }
  }, []);

  /**
   * Start inactivity timer (for mischief and dormant transitions)
   */
  const startInactivityTimer = useCallback(() => {
    if (isMinimized) return;

    resetInactivityTimer();

    // Timer for mischief - use ref to get current state (avoids stale closure)
    inactivityTimerRef.current = setTimeout(() => {
      if (lifecycleStateRef.current === LIFECYCLE_STATES.IDLE) {
        setLifecycleState(LIFECYCLE_STATES.MISCHIEF);
        setCurrentAnimation(getRandomAnimationFromCategory('mischief'));
      }
    }, INACTIVITY_TO_MISCHIEF);

    // Timer for dormant - use ref to get current state (avoids stale closure)
    mischiefTimerRef.current = setTimeout(() => {
      if (lifecycleStateRef.current !== LIFECYCLE_STATES.ACTIVE) {
        goToDormantRef.current?.();
      }
    }, MISCHIEF_TO_DORMANT);
  }, [isMinimized, resetInactivityTimer]);

  /**
   * Start idle variety timer (cycles through idle animations)
   */
  const startIdleVarietyTimer = useCallback(() => {
    // Clear existing timer
    if (idleVarietyTimerRef.current) {
      clearInterval(idleVarietyTimerRef.current);
    }

    idleVarietyTimerRef.current = setInterval(() => {
      // Only cycle if in idle state - use ref to avoid stale closure
      if (lifecycleStateRef.current === LIFECYCLE_STATES.IDLE) {
        idleAnimationIndexRef.current = (idleAnimationIndexRef.current + 1) % IDLE_VARIETY_ANIMATIONS.length;
        setCurrentAnimation(IDLE_VARIETY_ANIMATIONS[idleAnimationIndexRef.current]);
      }
    }, IDLE_VARIETY_INTERVAL);
  }, []);

  /**
   * Stop idle variety timer
   */
  const stopIdleVarietyTimer = useCallback(() => {
    if (idleVarietyTimerRef.current) {
      clearInterval(idleVarietyTimerRef.current);
      idleVarietyTimerRef.current = null;
    }
  }, []);

  /**
   * Transition to dormant (sleep) state
   */
  const goToDormant = useCallback(() => {
    // Stop idle variety timer
    stopIdleVarietyTimer();

    setLifecycleState(LIFECYCLE_STATES.DEPARTING);
    setCurrentAnimation('GoodBye');

    // After goodbye animation, transition to sleep
    setTimeout(() => {
      setLifecycleState(LIFECYCLE_STATES.DORMANT);
      setCurrentAnimation('IdleSnooze');
      setIsVisible(false);
    }, 4000); // GoodBye animation duration
  }, [stopIdleVarietyTimer]);

  // Keep ref in sync with callback
  goToDormantRef.current = goToDormant;

  /**
   * Wake up from dormant state
   */
  const wakeUp = useCallback(() => {
    if (lifecycleState !== LIFECYCLE_STATES.DORMANT) return;

    setLifecycleState(LIFECYCLE_STATES.AWAKENING);
    setCurrentAnimation('Greeting');

    // After greeting, transition to idle
    setTimeout(() => {
      setLifecycleState(LIFECYCLE_STATES.IDLE);
      setCurrentAnimation('Idle');
      startInactivityTimer();
      startIdleVarietyTimer();
    }, 4000); // Greeting animation duration
  }, [lifecycleState, startInactivityTimer, startIdleVarietyTimer]);

  /**
   * Play a random mischief animation
   */
  const playMischief = useCallback(() => {
    if (lifecycleState !== LIFECYCLE_STATES.IDLE && lifecycleState !== LIFECYCLE_STATES.MISCHIEF) return;

    setLifecycleState(LIFECYCLE_STATES.MISCHIEF);
    setCurrentAnimation(getRandomAnimationFromCategory('mischief'));

    // Return to idle after animation
    setTimeout(() => {
      setLifecycleState(LIFECYCLE_STATES.IDLE);
      setCurrentAnimation('Idle');
    }, 5000); // Approximate mischief animation duration
  }, [lifecycleState]);

  /**
   * Show a tip with optional animation
   */
  const showTip = useCallback((tip) => {
    if (!tip) return;

    setCurrentTip(tip);
    setIsVisible(true);
    setIsMinimized(false);
    setLifecycleState(LIFECYCLE_STATES.ACTIVE);

    // Set animation based on tip
    if (tip.animation) {
      setCurrentAnimation(tip.animation);
    }

    // Mark tip as seen
    if (tip.id && !seenTipIds.includes(tip.id)) {
      setSeenTipIds(prev => [...prev, tip.id]);
    }

    resetInactivityTimer();
  }, [seenTipIds, resetInactivityTimer]);

  /**
   * Dismiss the current tip (plays exit animation then minimizes Imp)
   */
  const dismissTip = useCallback(() => {
    // Stop idle variety timer
    stopIdleVarietyTimer();

    // Hide the balloon immediately
    setIsVisible(false);

    // Play GoodBye exit animation
    setLifecycleState(LIFECYCLE_STATES.DEPARTING);
    setCurrentAnimation('GoodBye');

    // After animation completes, minimize to resting state
    const goodByeDuration = getAnimationDuration('GoodBye');
    setTimeout(() => {
      setIsMinimized(true);
      setLifecycleState(LIFECYCLE_STATES.IDLE);
      setCurrentAnimation('Idle'); // Rest pose for minimized state
    }, goodByeDuration);

    resetInactivityTimer();
  }, [stopIdleVarietyTimer, resetInactivityTimer]);

  /**
   * Close balloon without minimizing (for auto-close)
   */
  const closeBalloon = useCallback(() => {
    setIsVisible(false);
    setLifecycleState(LIFECYCLE_STATES.IDLE);
    setCurrentAnimation('Idle');
    startInactivityTimer();
  }, [startInactivityTimer]);

  /**
   * Show Imp without a tip (just the character)
   */
  const showImp = useCallback(() => {
    setIsMinimized(false);

    // Wake up if dormant
    if (lifecycleState === LIFECYCLE_STATES.DORMANT) {
      wakeUp();
    } else {
      setLifecycleState(LIFECYCLE_STATES.IDLE);
      startInactivityTimer();
    }
  }, [lifecycleState, wakeUp, startInactivityTimer]);

  /**
   * Hide Imp completely (plays exit animation then minimizes)
   */
  const hideImp = useCallback(() => {
    // Stop idle variety timer
    stopIdleVarietyTimer();

    // Hide the balloon immediately
    setIsVisible(false);

    // Play GoodBye exit animation
    setLifecycleState(LIFECYCLE_STATES.DEPARTING);
    setCurrentAnimation('GoodBye');

    // After animation completes, minimize to resting state
    const goodByeDuration = getAnimationDuration('GoodBye');
    setTimeout(() => {
      setIsMinimized(true);
      setLifecycleState(LIFECYCLE_STATES.IDLE);
      setCurrentAnimation('Idle'); // Rest pose for minimized state
    }, goodByeDuration);

    resetInactivityTimer();
  }, [stopIdleVarietyTimer, resetInactivityTimer]);

  /**
   * Play an animation
   */
  const playAnimation = useCallback((animationName) => {
    setCurrentAnimation(animationName);
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  /**
   * Play a random non-idle animation
   */
  const playRandomAnimation = useCallback(() => {
    const names = getAnimationNames().filter(name =>
      name !== 'Idle' && name !== 'IdleSnooze' && name !== 'Hide' && name !== 'Show'
    );
    const randomName = names[Math.floor(Math.random() * names.length)];
    setCurrentAnimation(randomName);
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  /**
   * Reset to idle animation
   */
  const resetAnimation = useCallback(() => {
    if (lifecycleState === LIFECYCLE_STATES.DORMANT) {
      setCurrentAnimation('IdleSnooze');
    } else {
      setCurrentAnimation('Idle');
    }
  }, [lifecycleState]);

  /**
   * Clear all seen tips (for testing)
   */
  const clearSeenTips = useCallback(() => {
    setSeenTipIds([]);
  }, []);

  /**
   * Check if a tip has been seen
   */
  const hasTipBeenSeen = useCallback((tipId) => {
    return seenTipIds.includes(tipId);
  }, [seenTipIds]);

  /**
   * Check if Imp is sleeping
   */
  const isDormant = lifecycleState === LIFECYCLE_STATES.DORMANT;

  /**
   * Mark first visit as complete
   */
  const markFirstVisitComplete = useCallback(() => {
    setIsFirstVisit(false);
    try {
      localStorage.setItem(FIRST_VISIT_KEY, 'true');
    } catch {
      // Silently ignore localStorage errors
    }
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (mischiefTimerRef.current) clearTimeout(mischiefTimerRef.current);
      if (idleVarietyTimerRef.current) clearInterval(idleVarietyTimerRef.current);
    };
  }, []);

  // Start inactivity timer and idle variety when in idle state
  useEffect(() => {
    if (lifecycleState === LIFECYCLE_STATES.IDLE && !isMinimized) {
      startInactivityTimer();
      startIdleVarietyTimer();
    } else {
      stopIdleVarietyTimer();
    }
  }, [lifecycleState, isMinimized, startInactivityTimer, startIdleVarietyTimer, stopIdleVarietyTimer]);

  const value = {
    // State
    lifecycleState,
    isVisible,
    isMinimized,
    isDormant,
    currentTip,
    currentAnimation,
    seenTipIds,
    isFirstVisit,

    // Actions
    showTip,
    dismissTip,
    closeBalloon,
    showImp,
    hideImp,
    playAnimation,
    playRandomAnimation,
    resetAnimation,
    clearSeenTips,
    hasTipBeenSeen,
    markFirstVisitComplete,

    // Lifecycle actions
    goToDormant,
    wakeUp,
    playMischief,
    resetInactivityTimer,
  };

  return (
    <ImpContext.Provider value={value}>
      {children}
    </ImpContext.Provider>
  );
}

ImpProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Hook to access Imp context
 */
export function useImp() {
  const context = useContext(ImpContext);
  if (!context) {
    throw new Error('useImp must be used within an ImpProvider');
  }
  return context;
}
