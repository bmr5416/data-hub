import { useCallback } from 'react';
import PropTypes from 'prop-types';
import Icon from '../common/Icon';
import styles from './DateRangeSelector.module.css';

/**
 * DateRangeSelector
 *
 * Preset date ranges with optional custom range picker.
 * Win98 styled select + date inputs.
 */

const DATE_PRESETS = [
  { value: 'last_7_days', label: 'Last 7 Days' },
  { value: 'last_14_days', label: 'Last 14 Days' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'last_90_days', label: 'Last 90 Days' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_quarter', label: 'This Quarter' },
  { value: 'last_quarter', label: 'Last Quarter' },
  { value: 'this_year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
];

export default function DateRangeSelector({
  value = 'last_30_days',
  customStart = '',
  customEnd = '',
  onChange,
}) {
  const handlePresetChange = useCallback((e) => {
    const newValue = e.target.value;
    onChange({
      dateRange: newValue,
      customStartDate: newValue === 'custom' ? customStart : null,
      customEndDate: newValue === 'custom' ? customEnd : null,
    });
  }, [customStart, customEnd, onChange]);

  const handleStartDateChange = useCallback((e) => {
    onChange({
      dateRange: 'custom',
      customStartDate: e.target.value,
      customEndDate: customEnd,
    });
  }, [customEnd, onChange]);

  const handleEndDateChange = useCallback((e) => {
    onChange({
      dateRange: 'custom',
      customStartDate: customStart,
      customEndDate: e.target.value,
    });
  }, [customStart, onChange]);

  const isCustom = value === 'custom';

  return (
    <div className={styles.container}>
      {/* Preset Select */}
      <div className={styles.selectWrapper}>
        <Icon name="clock" size={14} className={styles.icon} />
        <select
          value={value}
          onChange={handlePresetChange}
          className={styles.select}
          aria-label="Date range"
        >
          {DATE_PRESETS.map(preset => (
            <option key={preset.value} value={preset.value}>
              {preset.label}
            </option>
          ))}
        </select>
      </div>

      {/* Custom Date Inputs */}
      {isCustom && (
        <div className={styles.customRange}>
          <div className={styles.dateField}>
            <label htmlFor="date-start" className={styles.dateLabel}>
              From
            </label>
            <input
              type="date"
              id="date-start"
              value={customStart || ''}
              onChange={handleStartDateChange}
              className={styles.dateInput}
            />
          </div>
          <span className={styles.dateSeparator}>to</span>
          <div className={styles.dateField}>
            <label htmlFor="date-end" className={styles.dateLabel}>
              To
            </label>
            <input
              type="date"
              id="date-end"
              value={customEnd || ''}
              onChange={handleEndDateChange}
              className={styles.dateInput}
            />
          </div>
        </div>
      )}
    </div>
  );
}

DateRangeSelector.propTypes = {
  /** Selected date range preset */
  value: PropTypes.oneOf([
    'last_7_days',
    'last_14_days',
    'last_30_days',
    'last_90_days',
    'this_month',
    'last_month',
    'this_quarter',
    'last_quarter',
    'this_year',
    'custom',
  ]),
  /** Custom start date (YYYY-MM-DD) */
  customStart: PropTypes.string,
  /** Custom end date (YYYY-MM-DD) */
  customEnd: PropTypes.string,
  /** Callback with { dateRange, customStartDate, customEndDate } */
  onChange: PropTypes.func.isRequired,
};
