/**
 * Imp - Main Clippy-like assistant component
 * Always renders since Fun Mode is always active
 *
 * Features:
 * - Context-aware tips based on current page/route
 * - Animated Clippy sprite with multiple animations
 * - Speech balloon with word-by-word reveal
 * - Proactive tip display on route changes
 * - Minimizable and dismissible
 * - Easter eggs: double-click, rapid-click
 * - First-visit greeting
 * - Awakening messages when waking from sleep
 * - Mimic treasure chest when minimized (eyes peek occasionally!)
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useImp, LIFECYCLE_STATES } from '../../contexts/ImpContext';
import { useImpTip } from '../../hooks/useImpTip';
import { useImpMischief } from '../../hooks/useImpMischief';
import { useMimicMischief } from '../../hooks/useMimicMischief';
import { useAudio } from '../../hooks/useAudio';
import ImpSprite from './ImpSprite';
import ImpBalloon from './ImpBalloon';
import MimicChest from './MimicChest';
import styles from './Imp.module.css';

// Delay before showing tip after route change
const TIP_DELAY = 2000;

// First visit greeting message
const FIRST_VISIT_MESSAGE = "Greetings, data wanderer! I am Imp, your guide through the shadowy realm of documentation. Click me for wisdom... or entertainment.";

// Imp has no props - all state managed via ImpContext
Imp.propTypes = {};

export default function Imp() {
  const {
    isVisible,
    isMinimized,
    isDormant,
    lifecycleState,
    currentTip,
    currentAnimation,
    isFirstVisit,
    showTip,
    dismissTip,
    closeBalloon,
    resetAnimation,
    playRandomAnimation,
    wakeUp,
    markFirstVisitComplete,
  } = useImp();

  const { getNextTip } = useImpTip();
  const { playImpInteract, playImpAppear, playImpDismiss } = useAudio();
  const location = useLocation();

  const tipTimerRef = useRef(null);
  const lastPathRef = useRef(null);
  const spriteContainerRef = useRef(null);
  const firstVisitShownRef = useRef(false);

  // Track transition state for Imp ↔ Mimic animations
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Mouse tracking and easter eggs (for full Imp)
  const {
    handleRapidClick,
    handleDoubleClick,
    proximityLevel,
  } = useImpMischief(spriteContainerRef, !isMinimized && !isDormant);

  // Mimic chest behavior (for minimized state)
  const {
    currentAnimation: mimicAnimation,
    handleClick: handleMimicClick,
    handleAnimationComplete: handleMimicAnimationComplete,
  } = useMimicMischief(isMinimized);

  /**
   * Handle sprite click (full Imp)
   */
  const handleSpriteClick = useCallback(() => {
    // Check for rapid-click easter egg
    if (handleRapidClick()) {
      return; // Easter egg triggered
    }

    // Play interaction sound
    playImpInteract();

    // Wake up if dormant
    if (isDormant) {
      wakeUp();
      return;
    }

    if (!isVisible) {
      // Try to show a new tip, otherwise play random animation
      const tip = getNextTip();
      if (tip) {
        showTip(tip);
      } else {
        playRandomAnimation();
      }
    }
  }, [isVisible, isDormant, getNextTip, showTip, playRandomAnimation, wakeUp, handleRapidClick, playImpInteract]);

  /**
   * Handle mimic chest click - triggers surprise attack then expands to full Imp
   */
  const handleChestClick = useCallback(() => {
    // Play interaction sound
    playImpInteract();
    // Trigger surprise attack animation
    handleMimicClick();
  }, [handleMimicClick, playImpInteract]);

  /**
   * Handle mimic animation complete - expand to full Imp after surprise attack
   */
  const handleChestAnimationComplete = useCallback((animationName) => {
    handleMimicAnimationComplete(animationName);

    if (animationName === 'SurpriseAttack') {
      // Play appear sound when Imp emerges
      playImpAppear();
      // Transition to full Imp with greeting
      setIsTransitioning(true);
      setTimeout(() => {
        // Show tip or play greeting
        const tip = getNextTip();
        if (tip) {
          showTip(tip);
        } else {
          showTip({
            id: 'mimic-greeting',
            message: "Surprise! Did I scare you? ...No? Well, I tried.",
            animation: 'Greeting',
          });
        }
        setIsTransitioning(false);
      }, 100);
    }
  }, [handleMimicAnimationComplete, getNextTip, showTip, playImpAppear]);

  /**
   * Handle sprite double-click (easter egg)
   */
  const handleSpriteDoubleClick = useCallback(() => {
    if (!isDormant && !isMinimized) {
      handleDoubleClick();
    }
  }, [isDormant, isMinimized, handleDoubleClick]);

  /**
   * Handle dismiss
   */
  const handleDismiss = useCallback(() => {
    playImpDismiss();
    dismissTip();
  }, [dismissTip, playImpDismiss]);

  /**
   * Handle balloon complete (auto-close after speaking)
   */
  const handleBalloonComplete = useCallback(() => {
    closeBalloon();
  }, [closeBalloon]);

  /**
   * Handle animation complete
   */
  const handleAnimationComplete = useCallback((animationName) => {
    // Return to idle after non-idle animations (except idle variants)
    const idleVariants = ['Idle', 'IdleSideToSide', 'IdleFingerTap', 'IdleHeadScratch', 'IdleEyeBrowRaise', 'IdleSnooze'];
    if (!idleVariants.includes(animationName)) {
      resetAnimation();
    }
  }, [resetAnimation]);

  /**
   * First-visit greeting
   */
  useEffect(() => {
    if (isFirstVisit && !firstVisitShownRef.current && !isMinimized) {
      firstVisitShownRef.current = true;

      // Show first-visit greeting after a brief delay
      const timer = setTimeout(() => {
        showTip({
          id: 'first-visit',
          message: FIRST_VISIT_MESSAGE,
          animation: 'Wave',
        });
        markFirstVisitComplete();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isFirstVisit, isMinimized, showTip, markFirstVisitComplete]);

  /**
   * Show tip on route change (with delay)
   */
  useEffect(() => {
    const currentPath = location.pathname;

    // Don't show tip if we just rendered on the same path
    if (currentPath === lastPathRef.current) return;
    lastPathRef.current = currentPath;

    // Clear any pending tip timer
    if (tipTimerRef.current) {
      clearTimeout(tipTimerRef.current);
    }

    // Don't auto-show if user has minimized or first visit hasn't been handled
    if (isMinimized || isFirstVisit) return;

    // Schedule tip display
    tipTimerRef.current = setTimeout(() => {
      const tip = getNextTip();
      if (tip) {
        showTip(tip);
      }
    }, TIP_DELAY);

    return () => {
      if (tipTimerRef.current) {
        clearTimeout(tipTimerRef.current);
      }
    };
  }, [location.pathname, isMinimized, isFirstVisit, getNextTip, showTip]);

  /**
   * Handle keyboard events (Escape to dismiss)
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isVisible) {
        handleDismiss();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, handleDismiss]);

  // Determine if awakening (for suppressing balloon during animation)
  const isAwakening = lifecycleState === LIFECYCLE_STATES.AWAKENING;

  return (
    <div
      ref={spriteContainerRef}
      className={`${styles.container} ${isDormant ? styles.dormant : ''}`}
      role="complementary"
      aria-label="Imp Assistant"
      style={{ '--proximity': proximityLevel }}
    >
      {/* Speech balloon (when active and not in transition states) */}
      {!isDormant && !isAwakening && (
        <ImpBalloon
          text={currentTip?.message}
          isVisible={isVisible}
          type={currentTip?.type}
          position="top-left"
          onDismiss={handleDismiss}
          onComplete={handleBalloonComplete}
          hold={false}
        />
      )}

      {/* Mimic chest when minimized */}
      {isMinimized && !isTransitioning && (
        <MimicChest
          animation={mimicAnimation}
          onClick={handleChestClick}
          onAnimationComplete={handleChestAnimationComplete}
          proximityLevel={0}
        />
      )}

      {/* Full Clippy sprite when not minimized */}
      {!isMinimized && (
        <ImpSprite
          animation={currentAnimation}
          isMinimized={false}
          isDormant={isDormant}
          onClick={handleSpriteClick}
          onDoubleClick={handleSpriteDoubleClick}
          onAnimationComplete={handleAnimationComplete}
        />
      )}
    </div>
  );
}
