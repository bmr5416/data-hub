/**
 * VideoPlayer Component
 *
 * Win98-styled video player with lazy loading,
 * poster frame support, and fallback handling.
 */

import { useState, useRef, useCallback, useEffect, memo } from 'react';
import PropTypes from 'prop-types';
import { useAudio } from '../../hooks/useAudio';
import PSXSprite from './PSXSprite';
import Button from './Button';
import styles from './VideoPlayer.module.css';

function VideoPlayer({
  src,
  poster,
  title = 'Video',
  autoPlay = false,
  muted = true,
  loop = false,
  className = '',
}) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPoster, setShowPoster] = useState(true);
  const [isInView, setIsInView] = useState(false);
  const { playClick } = useAudio();

  // Lazy loading with Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px', threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoadedData = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    setShowPoster(false);
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handlePlayClick = useCallback(() => {
    playClick();
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay may be blocked - show controls instead
        setShowPoster(false);
      });
    }
  }, [playClick]);

  const handleRetry = useCallback(() => {
    setHasError(false);
    setIsLoading(true);
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, []);

  return (
    <div ref={containerRef} className={`${styles.container} ${className}`}>
      <div className={styles.videoWrapper}>
        {/* Loading state */}
        {isLoading && isInView && !hasError && (
          <div className={styles.loadingOverlay}>
            <PSXSprite sprite="hourglass" size="lg" animation="spin" />
            <span className={styles.loadingText}>Loading video...</span>
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div className={styles.errorOverlay}>
            <PSXSprite sprite="tubeRed" size="lg" />
            <p className={styles.errorText}>Video failed to load</p>
            <Button onClick={handleRetry} size="sm" variant="secondary">
              Retry
            </Button>
          </div>
        )}

        {/* Poster overlay with play button */}
        {showPoster && poster && !isLoading && !hasError && (
          <button
            className={styles.posterOverlay}
            onClick={handlePlayClick}
            type="button"
            aria-label={`Play ${title}`}
          >
            <img
              src={poster}
              alt={`${title} preview`}
              className={styles.poster}
            />
            <span className={styles.playButton}>
              <span className={styles.playIcon}>&#9658;</span>
            </span>
          </button>
        )}

        {/* Video element */}
        <video
          ref={videoRef}
          className={styles.video}
          controls={!showPoster || isPlaying}
          autoPlay={autoPlay}
          muted={muted}
          loop={loop}
          playsInline
          preload={isInView ? 'metadata' : 'none'}
          onLoadedData={handleLoadedData}
          onError={handleError}
          onPlay={handlePlay}
          onPause={handlePause}
          aria-label={title}
        >
          {isInView && (
            <>
              <source src={src} type="video/mp4" />
              <source src={src.replace('.mp4', '.webm')} type="video/webm" />
              <p className={styles.fallback}>
                Your browser does not support HTML5 video.
              </p>
            </>
          )}
        </video>
      </div>

      {/* Title bar (Win98 style) */}
      <div className={styles.titleBar}>
        <span className={styles.title}>{title}</span>
        {isPlaying && <PSXSprite sprite="star" size="sm" animation="pulse" />}
      </div>
    </div>
  );
}

VideoPlayer.propTypes = {
  src: PropTypes.string.isRequired,
  poster: PropTypes.string,
  title: PropTypes.string,
  autoPlay: PropTypes.bool,
  muted: PropTypes.bool,
  loop: PropTypes.bool,
  className: PropTypes.string,
};

export default memo(VideoPlayer);
