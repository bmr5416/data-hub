import PropTypes from 'prop-types';
import styles from './WarehouseNameInput.module.css';

/**
 * Reusable warehouse name input field
 * Used by both DataWarehouseWizard (ReviewStep) and SourceWizard (WarehouseSelectionStep)
 */
export default function WarehouseNameInput({
  value,
  onChange,
  placeholder,
  id = 'warehouse-name',
  label = 'Warehouse Name',
  optional = true,
}) {
  return (
    <div className={styles.formGroup}>
      <label className={styles.label} htmlFor={id}>
        {label}
        {optional && <span className={styles.optional}>(optional)</span>}
      </label>
      <input
        id={id}
        type="text"
        className={styles.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

WarehouseNameInput.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  id: PropTypes.string,
  label: PropTypes.string,
  optional: PropTypes.bool,
};
