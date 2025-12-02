import PropTypes from 'prop-types';
import { useMemo } from 'react';
import Card from '../../common/Card';
import PSXSprite from '../../common/PSXSprite';
import styles from './DataSourceStep.module.css';

/**
 * Data Source Step
 *
 * Step 1 of the Report Builder wizard.
 * Allows selecting which warehouse to pull data from.
 */
export default function DataSourceStep({ data, onChange }) {
  const { availableWarehouses = [], warehouseId, selectedPlatforms = [], dateRange } = data;

  // Get the selected warehouse details
  const selectedWarehouse = useMemo(() => {
    return availableWarehouses.find((w) => w.id === warehouseId);
  }, [availableWarehouses, warehouseId]);

  // Calculate available metrics/dimensions from warehouse
  const warehouseStats = useMemo(() => {
    if (!selectedWarehouse?.fieldSelections) {
      return { dimensions: 0, metrics: 0, platforms: 0 };
    }

    const selections = selectedWarehouse.fieldSelections;
    let dimensions = 0;
    let metrics = 0;

    Object.values(selections).forEach((selection) => {
      dimensions += selection.dimensions?.length || 0;
      metrics += selection.metrics?.length || 0;
    });

    return {
      dimensions,
      metrics,
      platforms: selectedWarehouse.platforms?.length || 0,
    };
  }, [selectedWarehouse]);

  const handleWarehouseChange = (newWarehouseId) => {
    const warehouse = availableWarehouses.find((w) => w.id === newWarehouseId);
    onChange({
      warehouseId: newWarehouseId,
      selectedPlatforms: warehouse?.platforms || [],
    });
  };

  const handlePlatformToggle = (platformId) => {
    const newPlatforms = selectedPlatforms.includes(platformId)
      ? selectedPlatforms.filter((p) => p !== platformId)
      : [...selectedPlatforms, platformId];

    onChange({ selectedPlatforms: newPlatforms });
  };

  const handleDateRangeChange = (newRange) => {
    onChange({ dateRange: newRange });
  };

  const dateRangeOptions = [
    { value: 'last_7_days', label: 'Last 7 Days' },
    { value: 'last_14_days', label: 'Last 14 Days' },
    { value: 'last_30_days', label: 'Last 30 Days' },
    { value: 'last_90_days', label: 'Last 90 Days' },
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'this_quarter', label: 'This Quarter' },
    { value: 'this_year', label: 'This Year' },
  ];

  if (availableWarehouses.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <PSXSprite sprite="floppy" size="lg" />
          <h3 className={styles.emptyTitle}>No Data Warehouse Found</h3>
          <p className={styles.emptyText}>
            You need to create a data warehouse before building reports.
            Go to the Warehouse tab to set one up.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Select Data Source</h3>
        <p className={styles.description}>
          Choose which data warehouse to pull your report data from.
        </p>
      </div>

      {/* Warehouse Selection */}
      <div className={styles.section}>
        <label className={styles.label}>Data Warehouse</label>
        <select
          className={styles.select}
          value={warehouseId || ''}
          onChange={(e) => handleWarehouseChange(e.target.value)}
        >
          <option value="" disabled>Select a warehouse...</option>
          {availableWarehouses.map((warehouse) => (
            <option key={warehouse.id} value={warehouse.id}>
              {warehouse.name || 'Unnamed Warehouse'}
            </option>
          ))}
        </select>
      </div>

      {/* Warehouse Stats */}
      {selectedWarehouse && (
        <Card className={styles.statsCard}>
          <div className={styles.statsGrid}>
            <div className={styles.stat}>
              <PSXSprite sprite="floppy" size="sm" />
              <span className={styles.statValue}>{warehouseStats.platforms}</span>
              <span className={styles.statLabel}>Platforms</span>
            </div>
            <div className={styles.stat}>
              <PSXSprite sprite="star" size="sm" />
              <span className={styles.statValue}>{warehouseStats.dimensions}</span>
              <span className={styles.statLabel}>Dimensions</span>
            </div>
            <div className={styles.stat}>
              <PSXSprite sprite="coin" size="sm" />
              <span className={styles.statValue}>{warehouseStats.metrics}</span>
              <span className={styles.statLabel}>Metrics</span>
            </div>
          </div>
        </Card>
      )}

      {/* Platform Filter */}
      {selectedWarehouse && selectedWarehouse.platforms?.length > 1 && (
        <div className={styles.section}>
          <label className={styles.label}>Include Platforms (optional filter)</label>
          <p className={styles.hint}>Deselect platforms to exclude them from this report.</p>
          <div className={styles.platformGrid}>
            {selectedWarehouse.platforms.map((platformId) => (
              <label key={platformId} className={styles.platformCheckbox}>
                <input
                  type="checkbox"
                  checked={selectedPlatforms.includes(platformId)}
                  onChange={() => handlePlatformToggle(platformId)}
                />
                <span className={styles.platformName}>
                  {platformId.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Date Range */}
      <div className={styles.section}>
        <label className={styles.label}>Date Range</label>
        <p className={styles.hint}>Select the time period for your report data.</p>
        <select
          className={styles.select}
          value={dateRange}
          onChange={(e) => handleDateRangeChange(e.target.value)}
        >
          {dateRangeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

DataSourceStep.propTypes = {
  data: PropTypes.shape({
    availableWarehouses: PropTypes.array,
    warehouseId: PropTypes.string,
    selectedPlatforms: PropTypes.arrayOf(PropTypes.string),
    dateRange: PropTypes.string,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
};
