/**
 * DataPreview - Inline sample data preview for wizard steps
 *
 * Shows a compact table of sample data with:
 * - Column headers
 * - Limited rows (default 5)
 * - Expandable view option
 * - Win98 dungeon styling
 */

import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import Icon from './Icon';
import PSXSprite from './PSXSprite';
import Button from './Button';
import styles from './DataPreview.module.css';

/**
 * @param {Object} props
 * @param {Array<string>} props.columns - Column headers
 * @param {Array<Object>} props.rows - Data rows (array of objects)
 * @param {number} props.maxRows - Maximum rows to show (default 5)
 * @param {number} props.totalRows - Total row count (for "showing X of Y" message)
 * @param {string} props.title - Optional title for the preview
 * @param {boolean} props.loading - Loading state
 * @param {string} props.emptyMessage - Message when no data
 * @param {boolean} props.expandable - Allow expanding to show more rows
 * @param {Function} props.onExpand - Callback when expand button clicked
 * @param {string} props.className - Additional CSS class
 */
export default function DataPreview({
  columns = [],
  rows = [],
  maxRows = 5,
  totalRows,
  title,
  loading = false,
  emptyMessage = 'No data available',
  expandable = false,
  onExpand,
  className = '',
}) {
  const [expanded, setExpanded] = useState(false);

  // Calculate visible rows
  const visibleRows = useMemo(() => {
    if (expanded) return rows;
    return rows.slice(0, maxRows);
  }, [rows, maxRows, expanded]);

  const displayTotalRows = totalRows ?? rows.length;
  const hasMoreRows = rows.length > maxRows;

  // Handle expand toggle
  const handleExpandToggle = () => {
    if (onExpand) {
      onExpand();
    } else {
      setExpanded(!expanded);
    }
  };

  // Truncate long cell values
  const truncateValue = (value, maxLength = 50) => {
    if (value === null || value === undefined) return '—';
    const str = String(value);
    if (str.length > maxLength) {
      return str.substring(0, maxLength) + '...';
    }
    return str;
  };

  // Loading state
  if (loading) {
    return (
      <div className={`${styles.container} ${className}`}>
        {title && <h4 className={styles.title}>{title}</h4>}
        <div className={styles.loading}>
          <PSXSprite sprite="hourglass" size="sm" animation="spin" />
          <span>Loading preview...</span>
        </div>
      </div>
    );
  }

  // Empty state
  if (columns.length === 0 || rows.length === 0) {
    return (
      <div className={`${styles.container} ${className}`}>
        {title && <h4 className={styles.title}>{title}</h4>}
        <div className={styles.empty}>
          <PSXSprite sprite="floppy" size="sm" />
          <span>{emptyMessage}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className}`}>
      {/* Header */}
      <div className={styles.header}>
        {title && <h4 className={styles.title}>{title}</h4>}
        <div className={styles.meta}>
          <span className={styles.rowCount}>
            Showing {visibleRows.length} of {displayTotalRows.toLocaleString()} rows
          </span>
          <span className={styles.columnCount}>
            {columns.length} columns
          </span>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table} aria-label={title || 'Data preview table'}>
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th key={i} className={styles.th}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, rowIndex) => (
              <tr key={rowIndex} className={styles.tr}>
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className={styles.td}>
                    {truncateValue(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer with expand option */}
      {expandable && hasMoreRows && (
        <div className={styles.footer}>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExpandToggle}
          >
            <Icon name={expanded ? 'chevronUp' : 'chevronDown'} size={14} />
            {expanded ? 'Show Less' : `Show All ${rows.length} Rows`}
          </Button>
        </div>
      )}
    </div>
  );
}

DataPreview.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.string),
  rows: PropTypes.arrayOf(PropTypes.object),
  maxRows: PropTypes.number,
  totalRows: PropTypes.number,
  title: PropTypes.string,
  loading: PropTypes.bool,
  emptyMessage: PropTypes.string,
  expandable: PropTypes.bool,
  onExpand: PropTypes.func,
  className: PropTypes.string,
};

/**
 * SampleDataPreview - Shows sample/mock data based on a schema
 *
 * Generates fake data rows based on field definitions
 */
export function SampleDataPreview({
  fields = [],
  rowCount = 3,
  title = 'Sample Data Preview',
  className = '',
}) {
  // Generate sample data based on field types
  const sampleData = useMemo(() => {
    if (fields.length === 0) return { columns: [], rows: [] };

    const columns = fields.map(f => f.name || f.platformField || f);

    // Generate sample rows
    const rows = Array.from({ length: rowCount }, (_, i) => {
      const row = {};
      fields.forEach(field => {
        const fieldName = field.name || field.platformField || field;
        const fieldType = field.type || field.dataType || 'string';

        // Generate sample value based on type
        if (fieldType === 'date' || fieldName.toLowerCase().includes('date')) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          row[fieldName] = date.toISOString().split('T')[0];
        } else if (fieldType === 'number' || fieldType === 'float' || fieldType === 'integer' ||
                   fieldName.toLowerCase().includes('spend') ||
                   fieldName.toLowerCase().includes('cost') ||
                   fieldName.toLowerCase().includes('revenue')) {
          row[fieldName] = (Math.random() * 1000 + 100).toFixed(2);
        } else if (fieldName.toLowerCase().includes('impressions') ||
                   fieldName.toLowerCase().includes('clicks') ||
                   fieldName.toLowerCase().includes('conversions')) {
          row[fieldName] = Math.floor(Math.random() * 10000);
        } else if (fieldName.toLowerCase().includes('rate') ||
                   fieldName.toLowerCase().includes('ctr') ||
                   fieldName.toLowerCase().includes('roas')) {
          row[fieldName] = (Math.random() * 5).toFixed(2) + '%';
        } else if (fieldName.toLowerCase().includes('campaign')) {
          row[fieldName] = `Campaign ${String.fromCharCode(65 + i)}`;
        } else if (fieldName.toLowerCase().includes('ad_set') || fieldName.toLowerCase().includes('adset')) {
          row[fieldName] = `Ad Set ${i + 1}`;
        } else if (fieldName.toLowerCase().includes('platform')) {
          row[fieldName] = ['Meta Ads', 'Google Ads', 'TikTok'][i % 3];
        } else {
          row[fieldName] = `Sample ${i + 1}`;
        }
      });
      return row;
    });

    return { columns, rows };
  }, [fields, rowCount]);

  if (fields.length === 0) {
    return null;
  }

  return (
    <DataPreview
      columns={sampleData.columns}
      rows={sampleData.rows}
      title={title}
      totalRows={rowCount}
      emptyMessage="Select fields to see sample data"
      className={className}
    />
  );
}

SampleDataPreview.propTypes = {
  fields: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        name: PropTypes.string,
        platformField: PropTypes.string,
        type: PropTypes.string,
        dataType: PropTypes.string,
      }),
    ])
  ),
  rowCount: PropTypes.number,
  title: PropTypes.string,
  className: PropTypes.string,
};
