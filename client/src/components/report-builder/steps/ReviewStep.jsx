import { useMemo } from 'react';
import PropTypes from 'prop-types';
import Card from '../../common/Card';
import PSXSprite from '../../common/PSXSprite';
import { capitalize, toTitleCase } from '../../../utils/string';
import styles from './ReviewStep.module.css';

/**
 * Review Step
 *
 * Step 4 of the Report Builder wizard.
 * Preview configuration and name the report before creation.
 */
export default function ReviewStep({ data, onChange }) {
  const {
    availableWarehouses = [],
    warehouseId,
    selectedPlatforms = [],
    dateRange,
    visualizations = [],
    schedule = {},
    reportName = '',
  } = data;

  // Get selected warehouse details
  const selectedWarehouse = useMemo(() => {
    return availableWarehouses.find((w) => w.id === warehouseId);
  }, [availableWarehouses, warehouseId]);

  // Format frequency for display
  const formatFrequency = (freq) => {
    const labels = {
      on_demand: 'On Demand',
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
    };
    return labels[freq] || freq;
  };

  // Format delivery format for display
  const formatDelivery = (format) => {
    const labels = {
      view_only: 'View Only',
      csv: 'CSV Download',
      pdf: 'PDF Report',
    };
    return labels[format] || format;
  };

  // Format date range for display
  const formatDateRange = (range) => {
    const labels = {
      last_7_days: 'Last 7 Days',
      last_14_days: 'Last 14 Days',
      last_30_days: 'Last 30 Days',
      last_90_days: 'Last 90 Days',
      this_month: 'This Month',
      last_month: 'Last Month',
      this_quarter: 'This Quarter',
      this_year: 'This Year',
    };
    return labels[range] || range;
  };

  // Count visualizations by type
  const vizCounts = useMemo(() => {
    const counts = { kpi: 0, bar: 0, line: 0, pie: 0 };
    visualizations.forEach((viz) => {
      if (counts[viz.type] !== undefined) {
        counts[viz.type]++;
      }
    });
    return counts;
  }, [visualizations]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Review & Create</h3>
        <p className={styles.description}>
          Review your report configuration and give it a name.
        </p>
      </div>

      {/* Report Name Input */}
      <Card className={styles.nameCard}>
        <h4 className={styles.sectionTitle}>Report Name</h4>
        <input
          type="text"
          className={styles.nameInput}
          placeholder="Enter report name..."
          value={reportName}
          onChange={(e) => onChange({ reportName: e.target.value })}
          maxLength={100}
        />
        <p className={styles.hint}>
          Choose a descriptive name for easy identification.
        </p>
      </Card>

      {/* Configuration Summary */}
      <Card className={styles.summaryCard}>
        <h4 className={styles.sectionTitle}>Configuration Summary</h4>

        <div className={styles.summaryGrid}>
          {/* Data Source */}
          <div className={styles.summarySection}>
            <div className={styles.summaryHeader}>
              <PSXSprite sprite="floppy" size="sm" />
              <h5 className={styles.summaryLabel}>Data Source</h5>
            </div>
            <div className={styles.summaryContent}>
              <div className={styles.summaryItem}>
                <span className={styles.itemLabel}>Warehouse</span>
                <span className={styles.itemValue}>
                  {selectedWarehouse?.name || 'Unknown'}
                </span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.itemLabel}>Platforms</span>
                <span className={styles.itemValue}>
                  {selectedPlatforms.length > 0
                    ? selectedPlatforms.map((p) => toTitleCase(p)).join(', ')
                    : 'All'}
                </span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.itemLabel}>Date Range</span>
                <span className={styles.itemValue}>{formatDateRange(dateRange)}</span>
              </div>
            </div>
          </div>

          {/* Visualizations */}
          <div className={styles.summarySection}>
            <div className={styles.summaryHeader}>
              <PSXSprite sprite="star" size="sm" />
              <h5 className={styles.summaryLabel}>Visualizations</h5>
            </div>
            <div className={styles.summaryContent}>
              <div className={styles.summaryItem}>
                <span className={styles.itemLabel}>Total</span>
                <span className={styles.itemValue}>{visualizations.length} items</span>
              </div>
              {vizCounts.kpi > 0 && (
                <div className={styles.summaryItem}>
                  <span className={styles.itemLabel}>KPI Cards</span>
                  <span className={styles.itemValue}>{vizCounts.kpi}</span>
                </div>
              )}
              {vizCounts.bar > 0 && (
                <div className={styles.summaryItem}>
                  <span className={styles.itemLabel}>Bar Charts</span>
                  <span className={styles.itemValue}>{vizCounts.bar}</span>
                </div>
              )}
              {vizCounts.line > 0 && (
                <div className={styles.summaryItem}>
                  <span className={styles.itemLabel}>Line Charts</span>
                  <span className={styles.itemValue}>{vizCounts.line}</span>
                </div>
              )}
              {vizCounts.pie > 0 && (
                <div className={styles.summaryItem}>
                  <span className={styles.itemLabel}>Pie Charts</span>
                  <span className={styles.itemValue}>{vizCounts.pie}</span>
                </div>
              )}
            </div>
          </div>

          {/* Schedule */}
          <div className={styles.summarySection}>
            <div className={styles.summaryHeader}>
              <PSXSprite sprite="hourglass" size="sm" />
              <h5 className={styles.summaryLabel}>Schedule</h5>
            </div>
            <div className={styles.summaryContent}>
              <div className={styles.summaryItem}>
                <span className={styles.itemLabel}>Frequency</span>
                <span className={styles.itemValue}>
                  {formatFrequency(schedule.frequency)}
                </span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.itemLabel}>Format</span>
                <span className={styles.itemValue}>
                  {formatDelivery(schedule.deliveryFormat)}
                </span>
              </div>
              {schedule.frequency !== 'on_demand' && (
                <>
                  {schedule.frequency === 'weekly' && (
                    <div className={styles.summaryItem}>
                      <span className={styles.itemLabel}>Day</span>
                      <span className={styles.itemValue}>
                        {capitalize(schedule.dayOfWeek)}
                      </span>
                    </div>
                  )}
                  {schedule.frequency === 'monthly' && (
                    <div className={styles.summaryItem}>
                      <span className={styles.itemLabel}>Day</span>
                      <span className={styles.itemValue}>
                        {schedule.dayOfMonth}
                        {schedule.dayOfMonth === 1
                          ? 'st'
                          : schedule.dayOfMonth === 2
                            ? 'nd'
                            : schedule.dayOfMonth === 3
                              ? 'rd'
                              : 'th'}
                      </span>
                    </div>
                  )}
                  <div className={styles.summaryItem}>
                    <span className={styles.itemLabel}>Time</span>
                    <span className={styles.itemValue}>{schedule.time}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.itemLabel}>Recipients</span>
                    <span className={styles.itemValue}>
                      {schedule.recipients?.length || 0} email(s)
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Validation Messages */}
      {!reportName?.trim() && (
        <div className={styles.validationMessage}>
          <PSXSprite sprite="heartYellow" size="sm" />
          <span>Please enter a report name to continue.</span>
        </div>
      )}

      {visualizations.length === 0 && (
        <div className={styles.validationMessage}>
          <PSXSprite sprite="heartYellow" size="sm" />
          <span>No visualizations added. Go back to Step 2 to add some.</span>
        </div>
      )}
    </div>
  );
}

ReviewStep.propTypes = {
  data: PropTypes.shape({
    availableWarehouses: PropTypes.array,
    warehouseId: PropTypes.string,
    selectedPlatforms: PropTypes.arrayOf(PropTypes.string),
    dateRange: PropTypes.string,
    visualizations: PropTypes.array,
    schedule: PropTypes.shape({
      frequency: PropTypes.string,
      dayOfWeek: PropTypes.string,
      dayOfMonth: PropTypes.number,
      time: PropTypes.string,
      timezone: PropTypes.string,
      deliveryFormat: PropTypes.string,
      recipients: PropTypes.arrayOf(PropTypes.string),
    }),
    reportName: PropTypes.string,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
};
