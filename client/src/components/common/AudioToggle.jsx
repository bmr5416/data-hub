import { memo } from 'react';
import PropTypes from 'prop-types';
import { useAudioContext } from '../../contexts/AudioContext';
import styles from './AudioToggle.module.css';

/**
 * AudioToggle - Win98-styled audio mute/unmute toggle
 *
 * Displays a speaker icon that toggles global audio state.
 * Shows speaker with waves when enabled, muted speaker when disabled.
 */
function AudioToggle({ className = '', size = 'md' }) {
  const { audioEnabled, toggleAudio } = useAudioContext();

  return (
    <button
      type="button"
      onClick={toggleAudio}
      className={`${styles.toggle} ${styles[size]} ${audioEnabled ? styles.enabled : styles.disabled} ${className}`}
      aria-label={audioEnabled ? 'Mute sounds' : 'Unmute sounds'}
      aria-pressed={audioEnabled}
      title={audioEnabled ? 'Sound: ON (click to mute)' : 'Sound: OFF (click to unmute)'}
    >
      <span className={styles.iconWrapper}>
        {/* Speaker base */}
        <svg
          className={styles.speakerIcon}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Speaker body */}
          <path
            d="M3 9V15H7L12 20V4L7 9H3Z"
            fill="currentColor"
          />

          {audioEnabled ? (
            /* Sound waves when enabled */
            <>
              <path
                d="M15 9C15.5 9.5 16 10.5 16 12C16 13.5 15.5 14.5 15 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="square"
                className={styles.wave1}
              />
              <path
                d="M18 6C19.5 7.5 20.5 9.5 20.5 12C20.5 14.5 19.5 16.5 18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="square"
                className={styles.wave2}
              />
            </>
          ) : (
            /* Mute X when disabled */
            <>
              <path
                d="M16 9L22 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="square"
              />
              <path
                d="M22 9L16 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="square"
              />
            </>
          )}
        </svg>
      </span>
      <span className={styles.label}>
        {audioEnabled ? 'SFX' : 'MUTE'}
      </span>
    </button>
  );
}

AudioToggle.propTypes = {
  className: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md']),
};

export default memo(AudioToggle);
