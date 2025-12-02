import PropTypes from 'prop-types';
import styles from './BlendedTableCheckbox.module.css';

/**
 * Reusable checkbox for including blended data table in warehouse
 * Used by both DataWarehouseWizard (ReviewStep) and SourceWizard (WarehouseSelectionStep)
 */
export default function BlendedTableCheckbox({
  checked,
  onChange,
  label = 'Include Blended Data Table',
  helpText,
}) {
  return (
    <div className={styles.container}>
      <label className={styles.checkbox} onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className={styles.label}>{label}</span>
      </label>
      {helpText && <p className={styles.helpText}>{helpText}</p>}
    </div>
  );
}

BlendedTableCheckbox.propTypes = {
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string,
  helpText: PropTypes.string,
};
