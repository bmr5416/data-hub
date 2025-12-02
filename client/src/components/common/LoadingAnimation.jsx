import { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { funModeMessages } from '../../data/funModeMessages';
import Card from './Card';
import styles from './LoadingAnimation.module.css';

/**
 * Calculate display time based on text length.
 * Longer messages get more time, capped at 3.5 seconds.
 * @param {string} text - The message to display
 * @returns {number} - Display time in milliseconds
 */
function calculateDisplayTime(text) {
  const charsPerSecond = 15; // Slightly faster reading speed
  const minTime = 2000;      // 2 seconds minimum
  const maxTime = 3500;      // 3.5 seconds maximum
  const readTime = (text.length / charsPerSecond) * 1000;
  return Math.min(maxTime, Math.max(minTime, readTime));
}

/**
 * LoadingAnimation - Displays a loading spinner with quest-style messages.
 *
 * Shows quest-style rotating messages with pixel spinner,
 * plus a separate card displaying dark humor "sayings".
 */
export default function LoadingAnimation({
  phrases,
  interval = 4000,
  className = '',
}) {
  // Always show fun mode messages
  const activePhrases = phrases || funModeMessages.loading;
  const sayings = funModeMessages.sayings;

  // Quest message state
  const [currentIndex, setCurrentIndex] = useState(() =>
    Math.floor(Math.random() * activePhrases.length)
  );
  const [isAnimating, setIsAnimating] = useState(false);

  // Sayings state (separate rotation)
  const [sayingIndex, setSayingIndex] = useState(() =>
    Math.floor(Math.random() * sayings.length)
  );
  const [sayingAnimating, setSayingAnimating] = useState(false);

  // Ref for sayings timer to allow cleanup
  const sayingsTimerRef = useRef(null);

  // Quest message rotation timer (fixed interval - all similar length)
  useEffect(() => {
    const timer = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % activePhrases.length);
        setIsAnimating(false);
      }, 275);
    }, interval);

    return () => clearInterval(timer);
  }, [activePhrases, interval]);

  // Schedule next saying with dynamic timing based on message length
  const scheduleNextSaying = useCallback(() => {
    setSayingIndex((prevIndex) => {
      const nextIndex = (prevIndex + 1) % sayings.length;
      const nextSaying = sayings[nextIndex];
      const displayTime = calculateDisplayTime(nextSaying);

      // Schedule the next rotation
      sayingsTimerRef.current = setTimeout(() => {
        setSayingAnimating(true);
        setTimeout(() => {
          setSayingAnimating(false);
          scheduleNextSaying();
        }, 275);
      }, displayTime);

      return nextIndex;
    });
  }, [sayings]);

  // Sayings rotation with dynamic timing
  useEffect(() => {
    // Initial schedule based on first saying's length
    const initialSaying = sayings[sayingIndex];
    const initialDisplayTime = calculateDisplayTime(initialSaying);

    sayingsTimerRef.current = setTimeout(() => {
      setSayingAnimating(true);
      setTimeout(() => {
        setSayingAnimating(false);
        scheduleNextSaying();
      }, 275);
    }, initialDisplayTime);

    return () => {
      if (sayingsTimerRef.current) {
        clearTimeout(sayingsTimerRef.current);
      }
    };
  }, [sayings, scheduleNextSaying]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`${styles.container} ${styles.funMode} ${className}`}>
      <img
        src="/assets/psx/loading-target.gif"
        alt="Loading"
        className={styles.loadingIcon}
      />
      <div className={styles.textWrapper}>
        <span
          className={`${styles.text} ${isAnimating ? styles.slideOut : styles.slideIn}`}
          aria-live="polite"
        >
          {activePhrases[currentIndex]}
        </span>
      </div>
      <Card className={styles.sayingsCard} padding="md">
        <p
          className={`${styles.saying} ${sayingAnimating ? styles.slideOut : styles.slideIn}`}
          aria-live="polite"
        >
          {sayings[sayingIndex]}
        </p>
      </Card>
    </div>
  );
}

LoadingAnimation.propTypes = {
  phrases: PropTypes.arrayOf(PropTypes.string),
  interval: PropTypes.number,
  className: PropTypes.string,
};
