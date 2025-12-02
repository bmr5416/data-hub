/**
 * ImpSprite - Animated Clippy sprite component
 * Adapted from modern-clippy (MIT License)
 * Source: https://github.com/vchaindz/modern-clippy/blob/main/src/agent.ts
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { FRAME_WIDTH, FRAME_HEIGHT, SPRITE_PATH, getAnimation, getAnimationDuration } from '../../data/impAnimations';
import styles from './ImpSprite.module.css';

export default function ImpSprite({
  animation = 'Idle',
  isMinimized = false,
  isDormant = false,
  onClick,
  onDoubleClick,
  onAnimationComplete,
}) {
  const [currentFrame, setCurrentFrame] = useState({ x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef(null);
  const frameIndexRef = useRef(0);
  const currentAnimationRef = useRef(animation);

  /**
   * Play animation frame by frame
   * Extracted from modern-clippy agent.ts playAnimation method
   */
  const playAnimation = useCallback((animationName) => {
    const anim = getAnimation(animationName);
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

    const animate = () => {
      const frameIndex = frameIndexRef.current;
      const frame = anim.frames[frameIndex];

      if (!frame) {
        // Animation complete
        setIsAnimating(false);
        // Return to idle
        if (animationName !== 'Idle') {
          setCurrentFrame({ x: 0, y: 0 });
        }
        // Include duration in completion callback for UI synchronization
        const totalDuration = getAnimationDuration(animationName);
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
      const anim = getAnimation(animation);
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

  const spriteStyle = {
    width: `${FRAME_WIDTH}px`,
    height: `${FRAME_HEIGHT}px`,
    backgroundImage: `url(${SPRITE_PATH})`,
    backgroundPosition: `-${currentFrame.x}px -${currentFrame.y}px`,
    backgroundRepeat: 'no-repeat',
    imageRendering: 'pixelated',
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

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    onDoubleClick?.(e);
  };

  return (
    <button
      type="button"
      className={`${styles.sprite} ${isMinimized ? styles.minimized : ''} ${isAnimating ? styles.animating : ''} ${isDormant ? styles.sleeping : ''}`}
      style={isMinimized ? {} : spriteStyle}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      aria-label={isMinimized ? 'Show Imp assistant' : isDormant ? 'Imp is sleeping - click to wake' : 'Imp assistant - click for tip'}
      title={isMinimized ? 'Click to show Imp' : isDormant ? 'Click to wake Imp' : 'Imp - your CAPI assistant'}
    >
      {isMinimized && (
        <div className={styles.minimizedIcon} style={spriteStyle} />
      )}
    </button>
  );
}

ImpSprite.propTypes = {
  animation: PropTypes.string,
  isMinimized: PropTypes.bool,
  isDormant: PropTypes.bool,
  onClick: PropTypes.func,
  onDoubleClick: PropTypes.func,
  onAnimationComplete: PropTypes.func,
};
