/**
 * PSXSprite - Animated PSX pixel art sprite component
 *
 * Renders animated sprites from PSX asset sprite sheets.
 * Follows the same pattern as ImpSprite for consistency.
 */

import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import PropTypes from 'prop-types';
import {
  FRAME_SIZE,
  SPRITE_PATHS,
  SIZES,
  sprites,
} from '../../data/psxAnimations';
import styles from './PSXSprite.module.css';

function PSXSprite({
  sprite = 'hourglass',
  animation = null,
  size = 'md',
  paused = false,
  onClick,
  className = '',
  ariaLabel,
}) {
  const [currentFrame, setCurrentFrame] = useState({ x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef(null);
  const frameIndexRef = useRef(0);

  // Get sprite and animation config (memoized to avoid recalc)
  const { animConfig, sheetPath, isValid } = useMemo(() => {
    const config = sprites[sprite];
    if (!config) {
      console.warn(`PSXSprite: Unknown sprite "${sprite}"`);
      return { isValid: false };
    }

    const animName = animation || Object.keys(config.animations)[0];
    const anim = config.animations[animName];
    if (!anim) {
      console.warn(`PSXSprite: Unknown animation "${animName}" for sprite "${sprite}"`);
      return { isValid: false };
    }

    return {
      animConfig: anim,
      sheetPath: SPRITE_PATHS[config.sheet],
      isValid: true,
    };
  }, [sprite, animation]);

  // Calculate display size
  const displaySize = SIZES[size] || SIZES.md;
  const scale = displaySize / FRAME_SIZE;

  /**
   * Play animation frame by frame
   */
  const playAnimation = useCallback(() => {
    if (!isValid || !animConfig) return;

    const frames = animConfig.frames;
    if (!frames || frames.length === 0) return;

    // Clear any existing animation
    if (animationRef.current) {
      clearTimeout(animationRef.current);
    }

    if (paused) {
      // Show first frame when paused
      setCurrentFrame({ x: frames[0].x, y: frames[0].y });
      setIsAnimating(false);
      return;
    }

    setIsAnimating(true);
    frameIndexRef.current = 0;

    const animate = () => {
      const frameIndex = frameIndexRef.current;
      const frame = frames[frameIndex];

      if (!frame) {
        // Loop if configured
        if (animConfig.loop) {
          frameIndexRef.current = 0;
          animationRef.current = setTimeout(animate, frames[0].duration);
        } else {
          setIsAnimating(false);
        }
        return;
      }

      // Render current frame
      setCurrentFrame({ x: frame.x, y: frame.y });
      frameIndexRef.current++;

      // Schedule next frame
      animationRef.current = setTimeout(animate, frame.duration);
    };

    animate();
  }, [animConfig, paused, isValid]);

  // Play animation on mount and when props change
  useEffect(() => {
    if (!isValid || !animConfig) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      // Just show first frame
      const frames = animConfig.frames;
      if (frames?.[0]) {
        setCurrentFrame({ x: frames[0].x, y: frames[0].y });
      }
      return;
    }

    playAnimation();

    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [playAnimation, animConfig, isValid]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, []);

  // Memoized event handlers (must be defined before early return)
  const handleClick = useCallback((e) => {
    e.stopPropagation();
    onClick?.(e);
  }, [onClick]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.(e);
    }
  }, [onClick]);

  // Early return after all hooks
  if (!isValid) {
    return null;
  }

  const spriteStyle = {
    width: `${FRAME_SIZE}px`,
    height: `${FRAME_SIZE}px`,
    backgroundImage: `url(${sheetPath})`,
    backgroundPosition: `-${currentFrame.x}px -${currentFrame.y}px`,
    backgroundRepeat: 'no-repeat',
    imageRendering: 'pixelated',
    transform: scale !== 1 ? `scale(${scale})` : undefined,
    transformOrigin: 'center center',
  };

  const wrapperStyle = {
    width: `${displaySize}px`,
    height: `${displaySize}px`,
  };

  const isInteractive = !!onClick;
  const Component = isInteractive ? 'button' : 'div';

  return (
    <Component
      type={isInteractive ? 'button' : undefined}
      className={`${styles.wrapper} ${isAnimating ? styles.animating : ''} ${className}`}
      style={wrapperStyle}
      onClick={isInteractive ? handleClick : undefined}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      aria-label={ariaLabel || `${sprite} icon`}
      role={isInteractive ? undefined : 'img'}
    >
      <div className={styles.sprite} style={spriteStyle} />
    </Component>
  );
}

PSXSprite.propTypes = {
  /** Sprite name from psxAnimations.js */
  sprite: PropTypes.oneOf([
    'hourglass', 'star', 'coin',
    'heartRed', 'heartGreen', 'heartBlue', 'heartYellow',
    'tubeRed', 'tubeGreen', 'tubeBlue',
    'floppy', 'monitor', 'lock', 'gameboy',
  ]),
  /** Animation name (defaults to first available) */
  animation: PropTypes.string,
  /** Display size: xs (16px), sm (24px), md (32px), lg (48px) */
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg']),
  /** Pause animation (shows first frame) */
  paused: PropTypes.bool,
  /** Click handler (makes component a button) */
  onClick: PropTypes.func,
  /** Additional CSS classes */
  className: PropTypes.string,
  /** Accessibility label */
  ariaLabel: PropTypes.string,
};

export default memo(PSXSprite);
