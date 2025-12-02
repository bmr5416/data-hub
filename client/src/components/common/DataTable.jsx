import { memo } from 'react';
import PropTypes from 'prop-types';
import PSXSprite from './PSXSprite';
import styles from './DataTable.module.css';

/**
 * DataTable - Reusable tabular data display component
 * Supports horizontal scrolling, loading states, and Win98 styling
 */
function DataTable({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data available',
  className = '',
}) {
  // Format cell value for display
  const formatValue = (value) => {
    if (value === null || value === undefined) {
      return '-';
    }
    if (typeof value === 'number') {
      // Format numbers with commas
      return value.toLocaleString();
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    return String(value);
  };

  if (loading) {
    return (
      <div className={`${styles.wrapper} ${className}`}>
        <div className={styles.loading}>
          <PSXSprite sprite="hourglass" size="sm" ariaLabel="Loading" />
          <span>Loading data...</span>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={`${styles.wrapper} ${className}`}>
        <div className={styles.empty}>
          <PSXSprite sprite="monitor" size="md" ariaLabel="No data" />
          <span>{emptyMessage}</span>
        </div>
      </div>
    );
  }

  // If no columns provided, derive from first row
  const displayColumns = columns && columns.length > 0
    ? columns
    : Object.keys(data[0] || {});

  return (
    <div className={`${styles.wrapper} ${className}`}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.rowNumber}>#</th>
            {displayColumns.map((col) => (
              <th key={col} className={styles.headerCell}>
                {col.replace(/_/g, ' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className={rowIndex % 2 === 0 ? styles.evenRow : styles.oddRow}>
              <td className={styles.rowNumber}>{rowIndex + 1}</td>
              {displayColumns.map((col) => (
                <td key={col} className={styles.cell}>
                  {formatValue(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

DataTable.propTypes = {
  /** Array of column names/keys to display */
  columns: PropTypes.arrayOf(PropTypes.string),
  /** Array of data objects (each object is a row) */
  data: PropTypes.arrayOf(PropTypes.object),
  /** Show loading spinner */
  loading: PropTypes.bool,
  /** Message shown when data is empty */
  emptyMessage: PropTypes.string,
  /** Additional CSS class */
  className: PropTypes.string,
};

export default memo(DataTable);
