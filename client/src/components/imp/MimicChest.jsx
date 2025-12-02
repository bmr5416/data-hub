/**
 * MimicChest - Animated treasure chest mimic for minimized Imp state
 *
 * Sprite source: OpenGameArt - "Chest and Mimic" by IndigoFenix/Redshrike
 * License: CC-BY 3.0 (Credit: Stephen Challener/Redshrike)
 * URL: https://opengameart.org/content/chest-and-mimic
 *
 * Features:
 * - Dormant closed chest state
 * - Occasional "eyes peeking" animation
 * - Surprise attack animation on click
 * - Wiggle easter egg
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  MIMIC_FRAME_WIDTH,
  MIMIC_FRAME_HEIGHT,
  MIMIC_SPRITE_PATH,
  MIMIC_DISPLAY_SIZE,
  getMimicAnimation,
  getMimicAnimationDuration,
  isMimicAnimationLoop,
} from '../../data/mimicAnimations';
import styles from './MimicChest.module.css';

export default function MimicChest({
  animation = 'HiddenIdle',
  onClick,
  onAnimationComplete,
  proximityLevel = 0,
}) {
  const [currentFrame, setCurrentFrame] = useState({ x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef(null);
  const frameIndexRef = useRef(0);
  const currentAnimationRef = useRef(animation);

  /**
   * Play animation frame by frame
   * Following the same pattern as ImpSprite.jsx
   */
  const playAnimation = useCallback((animationName) => {
    const anim = getMimicAnimation(animationName);
    if (!anim || !anim.frames || anim.frames.length === 0) {
      setCurrentFrame({ x: 0, y: 0 });
      return;
    }

    // Clear any existing animation
    if (animationRef.current) {
      clearTimeout(animationRef.current);
    }

    setIsAnimating(true);
    frameIndexRef.current = 0;
    currentAnimationRef.current = animationName;

    const shouldLoop = isMimicAnimationLoop(animationName);

    const animate = () => {
      const frameIndex = frameIndexRef.current;
      const frame = anim.frames[frameIndex];

      if (!frame) {
        // Animation complete
        if (shouldLoop) {
          // Restart looping animation
          frameIndexRef.current = 0;
          animationRef.current = setTimeout(animate, 0);
          return;
        }

        setIsAnimating(false);
        // Return to hidden idle
        if (animationName !== 'HiddenIdle') {
          setCurrentFrame({ x: 0, y: 0 });
        }
        // Include duration in completion callback
        const totalDuration = getMimicAnimationDuration(animationName);
        onAnimationComplete?.(animationName, totalDuration);
        return;
      }

      // Render current frame
      setCurrentFrame({ x: frame.x, y: frame.y });
      frameIndexRef.current++;

      // Schedule next frame
      animationRef.current = setTimeout(animate, frame.duration);
    };

    animate();
  }, [onAnimationComplete]);

  // Play animation when prop changes
  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      // Just show first frame
      const anim = getMimicAnimation(animation);
      if (anim?.frames?.[0]) {
        setCurrentFrame({ x: anim.frames[0].x, y: anim.frames[0].y });
      }
      return;
    }

    playAnimation(animation);

    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [animation, playAnimation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, []);

  // Calculate the sprite position and scale
  const spriteStyle = {
    width: `${MIMIC_FRAME_WIDTH}px`,
    height: `${MIMIC_FRAME_HEIGHT}px`,
    backgroundImage: `url(${MIMIC_SPRITE_PATH})`,
    backgroundPosition: `-${currentFrame.x}px -${currentFrame.y}px`,
    backgroundRepeat: 'no-repeat',
    imageRendering: 'pixelated',
    // Scale up for visibility (16px -> 48px = 3x scale)
    transform: `scale(${MIMIC_DISPLAY_SIZE / MIMIC_FRAME_WIDTH})`,
    transformOrigin: 'center center',
  };

  const handleClick = (e) => {
    e.stopPropagation();
    onClick?.(e);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.(e);
    }
  };

  // Determine if chest is showing eyes (peeking)
  const isPeeking = animation === 'RevealedIdle' || animation === 'QuickPeek';

  return (
    <button
      type="button"
      className={`${styles.chest} ${isAnimating ? styles.animating : ''} ${isPeeking ? styles.peeking : ''}`}
      style={{ '--proximity': proximityLevel }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label="Imp assistant (minimized) - click to expand"
      title="A suspicious treasure chest... click to open"
    >
      <div className={styles.spriteContainer}>
        <div className={styles.sprite} style={spriteStyle} />
      </div>
    </button>
  );
}

MimicChest.propTypes = {
  animation: PropTypes.string,
  onClick: PropTypes.func,
  onAnimationComplete: PropTypes.func,
  proximityLevel: PropTypes.number,
};
