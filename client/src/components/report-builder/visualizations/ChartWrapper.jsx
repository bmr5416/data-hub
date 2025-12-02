import { memo } from 'react';
import PropTypes from 'prop-types';
import Card from '../../common/Card';
import PSXSprite from '../../common/PSXSprite';
import styles from './ChartWrapper.module.css';

/**
 * Chart Wrapper Component
 *
 * Provides consistent container styling for all chart types.
 * Win98 dungeon themed with title, optional subtitle, and loading state.
 */
function ChartWrapper({
  title,
  subtitle,
  loading = false,
  children,
  height = 300,
}) {
  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <PSXSprite sprite="star" size="sm" />
          <h4 className={styles.title}>{title}</h4>
        </div>
        {subtitle && (
          <p className={styles.subtitle}>{subtitle}</p>
        )}
      </div>

      <div className={styles.chartContainer} style={{ height }}>
        {loading ? (
          <div className={styles.loading}>
            <PSXSprite sprite="hourglass" size="lg" animation="spin" />
            <span className={styles.loadingText}>Loading data...</span>
          </div>
        ) : (
          children
        )}
      </div>
    </Card>
  );
}

ChartWrapper.propTypes = {
  /** Chart title */
  title: PropTypes.string.isRequired,
  /** Optional subtitle/description */
  subtitle: PropTypes.string,
  /** Loading state */
  loading: PropTypes.bool,
  /** Chart content */
  children: PropTypes.node,
  /** Chart height in pixels */
  height: PropTypes.number,
};

export default memo(ChartWrapper);
