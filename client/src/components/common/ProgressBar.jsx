import { memo } from 'react';
import PropTypes from 'prop-types';
import styles from './ProgressBar.module.css';

function ProgressBar({
  value,
  max = 100,
  size = 'md',
  showLabel = false,
  color = 'primary',
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`${styles.container} ${styles[size]}`}>
      <div
        className={styles.track}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={`${styles.fill} ${styles[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className={styles.label}>{Math.round(percentage)}%</span>
      )}
    </div>
  );
}

ProgressBar.propTypes = {
  value: PropTypes.number.isRequired,
  max: PropTypes.number,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  showLabel: PropTypes.bool,
  color: PropTypes.oneOf(['primary', 'success', 'warning', 'error']),
};

export default memo(ProgressBar);
