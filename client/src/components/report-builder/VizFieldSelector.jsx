import { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import Icon from '../common/Icon';
import Button from '../common/Button';
import styles from './VizFieldSelector.module.css';

/**
 * VizFieldSelector
 *
 * Simplified field selector for visualization configuration.
 * Works with pre-loaded warehouse fields (no API fetching).
 * Supports single-select mode for KPI metric selection.
 */
export default function VizFieldSelector({
  fields = [],
  selectedFields = [],
  onChange,
  mode = 'metrics',
  singleSelect = false,
  loading = false,
  label,
}) {
  // Group fields by category if available
  const fieldsByCategory = useMemo(() => {
    return fields.reduce((acc, field) => {
      const category = field.category || 'other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(field);
      return acc;
    }, {});
  }, [fields]);

  // Toggle field selection
  const toggleField = useCallback((fieldId) => {
    if (singleSelect) {
      // Single select mode - replace selection
      onChange([fieldId]);
    } else {
      // Multi-select mode - toggle
      const newSelection = selectedFields.includes(fieldId)
        ? selectedFields.filter(id => id !== fieldId)
        : [...selectedFields, fieldId];
      onChange(newSelection);
    }
  }, [singleSelect, selectedFields, onChange]);

  // Select all fields
  const selectAll = useCallback(() => {
    if (singleSelect) return;
    onChange(fields.map(f => f.id));
  }, [singleSelect, fields, onChange]);

  // Clear all selections
  const clearAll = useCallback(() => {
    onChange([]);
  }, [onChange]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading fields...</div>
      </div>
    );
  }

  if (fields.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>No {mode} available</div>
      </div>
    );
  }

  const hasCategories = Object.keys(fieldsByCategory).length > 1;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Icon name={mode === 'metrics' ? 'chartBar' : 'tag'} size={14} />
          <span className={styles.label}>
            {label || (mode === 'metrics' ? 'Metrics' : 'Dimensions')}
          </span>
          <span className={styles.count}>
            {selectedFields.length} / {fields.length}
          </span>
        </div>
        {!singleSelect && (
          <div className={styles.headerActions}>
            <Button variant="ghost" size="xs" onClick={selectAll}>
              All
            </Button>
            <Button variant="ghost" size="xs" onClick={clearAll}>
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Field List */}
      <div className={styles.fieldList}>
        {hasCategories ? (
          // Grouped by category
          Object.entries(fieldsByCategory).map(([category, categoryFields]) => (
            <div key={category} className={styles.category}>
              <div className={styles.categoryLabel}>{category}</div>
              <div className={styles.categoryFields}>
                {categoryFields.map(field => {
                  const isSelected = selectedFields.includes(field.id);
                  return (
                    <label
                      key={field.id}
                      className={`${styles.field} ${isSelected ? styles.selected : ''}`}
                    >
                      <input
                        type={singleSelect ? 'radio' : 'checkbox'}
                        name={singleSelect ? `field-${mode}` : undefined}
                        checked={isSelected}
                        onChange={() => toggleField(field.id)}
                        className={styles.input}
                      />
                      <span className={styles.fieldName}>{field.name || field.id}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          // Flat list
          <div className={styles.flatList}>
            {fields.map(field => {
              const isSelected = selectedFields.includes(field.id);
              return (
                <label
                  key={field.id}
                  className={`${styles.field} ${isSelected ? styles.selected : ''}`}
                >
                  <input
                    type={singleSelect ? 'radio' : 'checkbox'}
                    name={singleSelect ? `field-${mode}` : undefined}
                    checked={isSelected}
                    onChange={() => toggleField(field.id)}
                    className={styles.input}
                  />
                  <span className={styles.fieldName}>{field.name || field.id}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

VizFieldSelector.propTypes = {
  /** Array of available fields { id, name, category? } */
  fields: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string,
    category: PropTypes.string,
  })),
  /** Currently selected field IDs */
  selectedFields: PropTypes.arrayOf(PropTypes.string),
  /** Callback when selection changes */
  onChange: PropTypes.func.isRequired,
  /** Field type - affects icon and default label */
  mode: PropTypes.oneOf(['metrics', 'dimensions']),
  /** Single select mode (for KPI metric) */
  singleSelect: PropTypes.bool,
  /** Loading state */
  loading: PropTypes.bool,
  /** Custom label override */
  label: PropTypes.string,
};
