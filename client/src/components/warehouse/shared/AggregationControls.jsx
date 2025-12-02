import PropTypes from 'prop-types';
import Icon from '../../common/Icon';
import { capitalize } from '../../../utils/string';
import styles from './AggregationControls.module.css';

/**
 * Reusable aggregation controls for dimension/metric selection
 * Provides Group By dimension selection and Date Granularity options
 * Used by FieldSelector when showAggregation is true
 */
export default function AggregationControls({
  selectedDimensions = [],
  groupBy = ['date'],
  dateGranularity = 'day',
  onGroupByChange,
  onDateGranularityChange,
  requiredGroupBy = ['date'],
}) {
  const toggleGroupBy = (dimensionId) => {
    // Don't allow removing required dimensions
    if (requiredGroupBy.includes(dimensionId) && groupBy.includes(dimensionId)) {
      return;
    }

    const newGroupBy = groupBy.includes(dimensionId)
      ? groupBy.filter(id => id !== dimensionId)
      : [...groupBy, dimensionId];

    onGroupByChange(newGroupBy);
  };

  return (
    <div className={styles.container}>
      <h4 className={styles.title}>
        <Icon name="settings" size={16} />
        Aggregation Settings
      </h4>

      {/* Group By Selection */}
      <div className={styles.row}>
        <label className={styles.label}>Group By:</label>
        <div className={styles.chipGroup}>
          {selectedDimensions.map(dim => {
            const isSelected = groupBy.includes(dim.id);
            const isRequired = requiredGroupBy.includes(dim.id);

            return (
              <label
                key={dim.id}
                className={`${styles.chip} ${isSelected ? styles.chipSelected : ''} ${isRequired ? styles.chipRequired : ''}`}
                title={isRequired ? 'Required - cannot be removed' : dim.name}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={isRequired && isSelected}
                  onChange={() => toggleGroupBy(dim.id)}
                  className={styles.hiddenCheckbox}
                />
                <span className={styles.chipText}>{dim.id}</span>
                {isRequired && <Icon name="lock" size={12} />}
              </label>
            );
          })}
          {selectedDimensions.length === 0 && (
            <span className={styles.emptyText}>Select dimensions first</span>
          )}
        </div>
      </div>

      {/* Date Granularity Selection */}
      <div className={styles.row}>
        <label className={styles.label}>Date Granularity:</label>
        <div className={styles.radioGroup}>
          {['day', 'week', 'month'].map(granularity => (
            <label
              key={granularity}
              className={`${styles.radioLabel} ${dateGranularity === granularity ? styles.radioSelected : ''}`}
            >
              <input
                type="radio"
                name="dateGranularity"
                value={granularity}
                checked={dateGranularity === granularity}
                onChange={() => onDateGranularityChange(granularity)}
                className={styles.radio}
              />
              <span className={styles.radioText}>
                {capitalize(granularity)}
              </span>
            </label>
          ))}
        </div>
      </div>

      <p className={styles.helpText}>
        <Icon name="info" size={14} />
        Metrics will be summed when aggregating by the selected dimensions.
      </p>
    </div>
  );
}

AggregationControls.propTypes = {
  /** Available dimensions that can be selected for groupBy */
  selectedDimensions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  /** Currently selected groupBy dimension IDs */
  groupBy: PropTypes.arrayOf(PropTypes.string),
  /** Current date granularity setting */
  dateGranularity: PropTypes.oneOf(['day', 'week', 'month']),
  /** Callback when groupBy changes */
  onGroupByChange: PropTypes.func.isRequired,
  /** Callback when date granularity changes */
  onDateGranularityChange: PropTypes.func.isRequired,
  /** Dimension IDs that cannot be removed from groupBy (e.g., 'date') */
  requiredGroupBy: PropTypes.arrayOf(PropTypes.string),
};
