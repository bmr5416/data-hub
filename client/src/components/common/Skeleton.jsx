/**
 * Skeleton - Win98-themed loading placeholder component
 *
 * Shows placeholder shapes while content loads, providing
 * better perceived performance than spinners.
 */

import PropTypes from 'prop-types';
import styles from './Skeleton.module.css';

/**
 * @param {Object} props
 * @param {'text'|'title'|'card'|'avatar'|'button'|'badge'|'row'} props.variant - Shape variant
 * @param {'sm'|'md'|'lg'} props.size - Size variant
 * @param {number} props.width - Custom width (px or %)
 * @param {number} props.height - Custom height (px)
 * @param {number} props.count - Number of skeletons to render
 * @param {string} props.className - Additional CSS class
 */
export default function Skeleton({
  variant = 'text',
  size = 'md',
  width,
  height,
  count = 1,
  className = '',
}) {
  const skeletonClass = [
    styles.skeleton,
    styles[variant],
    styles[size],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const customStyle = {};
  if (width) customStyle.width = typeof width === 'number' ? `${width}px` : width;
  if (height) customStyle.height = typeof height === 'number' ? `${height}px` : height;

  if (count > 1) {
    return (
      <div className={styles.group}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={skeletonClass}
            style={customStyle}
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={skeletonClass}
      style={customStyle}
      aria-hidden="true"
    />
  );
}

Skeleton.propTypes = {
  variant: PropTypes.oneOf(['text', 'title', 'card', 'avatar', 'button', 'badge', 'row']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.number,
  count: PropTypes.number,
  className: PropTypes.string,
};

/**
 * SkeletonCard - Pre-composed card skeleton
 */
export function SkeletonCard({ className = '' }) {
  return (
    <div className={`${styles.cardWrapper} ${className}`}>
      <Skeleton variant="title" width="60%" />
      <Skeleton variant="text" count={2} />
      <div className={styles.cardFooter}>
        <Skeleton variant="badge" />
        <Skeleton variant="button" />
      </div>
    </div>
  );
}

SkeletonCard.propTypes = {
  className: PropTypes.string,
};

/**
 * SkeletonTable - Pre-composed table skeleton
 */
export function SkeletonTable({ rows = 5, columns = 4, className = '' }) {
  return (
    <div className={`${styles.tableWrapper} ${className}`}>
      <div className={styles.tableHeader}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} variant="badge" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className={styles.tableRow}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} variant="text" />
          ))}
        </div>
      ))}
    </div>
  );
}

SkeletonTable.propTypes = {
  rows: PropTypes.number,
  columns: PropTypes.number,
  className: PropTypes.string,
};

/**
 * SkeletonList - Pre-composed list skeleton
 */
export function SkeletonList({ count = 3, className = '' }) {
  return (
    <div className={`${styles.listWrapper} ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.listItem}>
          <Skeleton variant="avatar" size="sm" />
          <div className={styles.listContent}>
            <Skeleton variant="title" width="40%" size="sm" />
            <Skeleton variant="text" width="80%" />
          </div>
        </div>
      ))}
    </div>
  );
}

SkeletonList.propTypes = {
  count: PropTypes.number,
  className: PropTypes.string,
};
