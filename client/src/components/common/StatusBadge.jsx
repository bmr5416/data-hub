import { memo } from 'react';
import PropTypes from 'prop-types';
import PSXSprite from './PSXSprite';
import styles from './StatusBadge.module.css';

const STATUS_CONFIG = {
  // Client statuses
  active: { label: 'Active', color: 'green', heart: 'heartGreen' },
  inactive: { label: 'Inactive', color: 'gray', heart: 'heartBlue' },
  onboarding: { label: 'Onboarding', color: 'blue', heart: 'heartYellow' },
  // Data source statuses
  connected: { label: 'Connected', color: 'green', heart: 'heartGreen' },
  pending: { label: 'Pending', color: 'yellow', heart: 'heartYellow' },
  disconnected: { label: 'Disconnected', color: 'gray', heart: 'heartRed' },
  // ETL statuses
  paused: { label: 'Paused', color: 'yellow', heart: 'heartBlue' },
  deprecated: { label: 'Deprecated', color: 'gray', heart: 'heartBlue' },
  // General statuses
  error: { label: 'Error', color: 'red', heart: 'heartRed' },
  // Legacy statuses (for compatibility)
  not_started: { label: 'Not Started', color: 'gray', heart: 'heartBlue' },
  in_progress: { label: 'In Progress', color: 'blue', heart: 'heartYellow' },
  pending_review: { label: 'Pending Review', color: 'yellow', heart: 'heartYellow' },
  completed: { label: 'Completed', color: 'green', heart: 'heartGreen' },
  needs_attention: { label: 'Needs Attention', color: 'orange', heart: 'heartRed' },
};

function StatusBadge({ status, size = 'md', showHeart = false }) {
  const config = STATUS_CONFIG[status] || { label: status, color: 'gray', heart: 'heartBlue' };

  // Map badge size to PSXSprite size
  // sm badge → xs sprite, md badge → sm sprite, lg badge → md sprite
  const SPRITE_SIZE_MAP = { sm: 'xs', md: 'sm', lg: 'md' };
  const spriteSize = SPRITE_SIZE_MAP[size] || 'sm';

  return (
    <span
      className={`${styles.badge} ${styles[config.color]} ${styles[size]} ${showHeart ? styles.withHeart : ''}`}
      role="status"
    >
      {showHeart ? (
        <PSXSprite
          sprite={config.heart}
          size={spriteSize}
          className={styles.heart}
          ariaLabel={`${config.label} status`}
        />
      ) : (
        <span className={styles.dot} />
      )}
      {config.label}
    </span>
  );
}

StatusBadge.propTypes = {
  status: PropTypes.oneOf([
    // Data Hub statuses
    'active',
    'inactive',
    'onboarding',
    'connected',
    'pending',
    'disconnected',
    'paused',
    'deprecated',
    'error',
    // Legacy statuses
    'not_started',
    'in_progress',
    'pending_review',
    'completed',
    'needs_attention',
  ]).isRequired,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  /** Show animated PSX heart icon instead of dot */
  showHeart: PropTypes.bool,
};

export default memo(StatusBadge);
