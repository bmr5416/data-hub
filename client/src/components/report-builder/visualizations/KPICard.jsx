import { memo } from 'react';
import PropTypes from 'prop-types';
import Card from '../../common/Card';
import PSXSprite from '../../common/PSXSprite';
import Icon from '../../common/Icon';
import { formatValue, calculateTrend, getTrendColor } from './chartTheme';
import styles from './KPICard.module.css';

/**
 * KPI Card Component
 *
 * Displays a key metric with optional trend indicator.
 * Win98 dungeon themed with PSX sprites.
 */
function KPICard({
  title,
  value,
  previousValue = null,
  format = 'number',
  showTrend = true,
  higherIsBetter = true,
  icon = 'coin',
  loading = false,
}) {
  const trend = showTrend && previousValue !== null
    ? calculateTrend(value, previousValue)
    : null;

  const trendColor = getTrendColor(trend, higherIsBetter);
  const formattedValue = formatValue(value, format);
  const formattedTrend = trend !== null
    ? `${trend > 0 ? '+' : ''}${trend.toFixed(1)}%`
    : null;

  if (loading) {
    return (
      <Card className={styles.card}>
        <div className={styles.loading}>
          <PSXSprite sprite="hourglass" size="md" animation="spin" />
        </div>
      </Card>
    );
  }

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <PSXSprite sprite={icon} size="sm" />
        <h4 className={styles.title}>{title}</h4>
      </div>

      <div className={styles.valueContainer}>
        <span className={styles.value}>{formattedValue}</span>

        {formattedTrend && (
          <div
            className={styles.trend}
            style={{ color: trendColor }}
          >
            <Icon
              name={trend > 0 ? 'chevronUp' : 'chevronDown'}
              size={14}
            />
            <span>{formattedTrend}</span>
          </div>
        )}
      </div>

      {previousValue !== null && showTrend && (
        <div className={styles.comparison}>
          vs. previous: {formatValue(previousValue, format)}
        </div>
      )}
    </Card>
  );
}

KPICard.propTypes = {
  /** Title displayed above the value */
  title: PropTypes.string.isRequired,
  /** The main metric value */
  value: PropTypes.number,
  /** Previous period value for trend calculation */
  previousValue: PropTypes.number,
  /** How to format the value */
  format: PropTypes.oneOf(['number', 'currency', 'percentage', 'decimal', 'compact']),
  /** Whether to show trend indicator */
  showTrend: PropTypes.bool,
  /** Whether higher values are considered better (affects trend color) */
  higherIsBetter: PropTypes.bool,
  /** PSX sprite icon name */
  icon: PropTypes.string,
  /** Loading state */
  loading: PropTypes.bool,
};

export default memo(KPICard);
