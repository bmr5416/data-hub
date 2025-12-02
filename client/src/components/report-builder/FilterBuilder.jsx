import { useCallback } from 'react';
import PropTypes from 'prop-types';
import Icon from '../common/Icon';
import Button from '../common/Button';
import styles from './FilterBuilder.module.css';

/**
 * FilterBuilder
 *
 * Add/remove dimension-based filters.
 * Operators: equals, not_equals, contains, starts_with
 */

const OPERATORS = [
  { value: 'equals', label: 'equals' },
  { value: 'not_equals', label: 'not equals' },
  { value: 'contains', label: 'contains' },
  { value: 'starts_with', label: 'starts with' },
];

export default function FilterBuilder({
  filters = [],
  availableFields = [],
  onChange,
}) {
  // Add a new empty filter
  const addFilter = useCallback(() => {
    const defaultField = availableFields[0]?.id || '';
    onChange([
      ...filters,
      { field: defaultField, operator: 'equals', value: '' },
    ]);
  }, [filters, availableFields, onChange]);

  // Remove filter at index
  const removeFilter = useCallback((index) => {
    onChange(filters.filter((_, i) => i !== index));
  }, [filters, onChange]);

  // Update filter at index
  const updateFilter = useCallback((index, updates) => {
    onChange(
      filters.map((filter, i) =>
        i === index ? { ...filter, ...updates } : filter
      )
    );
  }, [filters, onChange]);

  return (
    <div className={styles.container}>
      {/* Filter List */}
      {filters.length > 0 ? (
        <div className={styles.filterList}>
          {filters.map((filter, index) => (
            <div key={index} className={styles.filterRow}>
              {/* Field Select */}
              <select
                value={filter.field}
                onChange={(e) => updateFilter(index, { field: e.target.value })}
                className={styles.fieldSelect}
                aria-label="Filter field"
              >
                {availableFields.map(field => (
                  <option key={field.id} value={field.id}>
                    {field.name || field.id}
                  </option>
                ))}
              </select>

              {/* Operator Select */}
              <select
                value={filter.operator}
                onChange={(e) => updateFilter(index, { operator: e.target.value })}
                className={styles.operatorSelect}
                aria-label="Filter operator"
              >
                {OPERATORS.map(op => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>

              {/* Value Input */}
              <input
                type="text"
                value={filter.value}
                onChange={(e) => updateFilter(index, { value: e.target.value })}
                className={styles.valueInput}
                placeholder="Value..."
                aria-label="Filter value"
              />

              {/* Remove Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFilter(index)}
                aria-label="Remove filter"
                className={styles.removeBtn}
              >
                <Icon name="x" size={14} />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <Icon name="settings" size={16} />
          <span>No filters applied</span>
        </div>
      )}

      {/* Add Filter Button */}
      <Button
        variant="secondary"
        size="sm"
        onClick={addFilter}
        disabled={availableFields.length === 0}
        className={styles.addBtn}
      >
        <Icon name="plus" size={14} />
        Add Filter
      </Button>
    </div>
  );
}

FilterBuilder.propTypes = {
  /** Array of filter objects { field, operator, value } */
  filters: PropTypes.arrayOf(PropTypes.shape({
    field: PropTypes.string.isRequired,
    operator: PropTypes.oneOf(['equals', 'not_equals', 'contains', 'starts_with']).isRequired,
    value: PropTypes.string.isRequired,
  })),
  /** Available dimension fields for filtering */
  availableFields: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string,
  })),
  /** Callback when filters change */
  onChange: PropTypes.func.isRequired,
};
