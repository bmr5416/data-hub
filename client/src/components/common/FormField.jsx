/**
 * FormField - Reusable form field wrapper with validation UX
 *
 * Provides:
 * - Required field indicators (*)
 * - Inline validation error messages
 * - Character counters for text fields
 * - Win98 dungeon themed styling
 */

import { useState, useCallback, useId } from 'react';
import PropTypes from 'prop-types';
import styles from './FormField.module.css';

/**
 * @param {Object} props
 * @param {string} props.label - Field label
 * @param {string} props.name - Field name (used for id if not provided)
 * @param {string} props.type - Input type: 'text' | 'email' | 'number' | 'password' | 'textarea' | 'select'
 * @param {string} props.value - Current value
 * @param {Function} props.onChange - Change handler (receives event or value)
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.required - Whether field is required
 * @param {string} props.error - Error message to display
 * @param {string} props.hint - Helper text below field
 * @param {number} props.maxLength - Maximum characters (shows counter)
 * @param {number} props.minLength - Minimum characters
 * @param {number} props.rows - Rows for textarea
 * @param {Array} props.options - Options for select [{value, label}]
 * @param {boolean} props.disabled - Whether field is disabled
 * @param {Function} props.validate - Custom validation function (value) => errorMessage | null
 * @param {boolean} props.showCharCount - Force show character count
 * @param {string} props.className - Additional CSS class
 */
export default function FormField({
  label,
  name,
  type = 'text',
  value = '',
  onChange,
  placeholder,
  required = false,
  error: externalError,
  hint,
  maxLength,
  minLength,
  rows = 3,
  options = [],
  disabled = false,
  validate,
  showCharCount = false,
  className = '',
}) {
  const generatedId = useId();
  const fieldId = name || generatedId;
  const [touched, setTouched] = useState(false);
  const [internalError, setInternalError] = useState(null);

  // Determine which error to show
  const error = externalError || (touched ? internalError : null);
  const hasError = Boolean(error);
  const charCount = typeof value === 'string' ? value.length : 0;
  const showCounter = showCharCount || maxLength;

  // Validate on blur
  const handleBlur = useCallback(() => {
    setTouched(true);

    // Run validations
    let validationError = null;

    if (required && !value?.toString().trim()) {
      validationError = `${label || 'This field'} is required`;
    } else if (minLength && value?.length < minLength) {
      validationError = `Minimum ${minLength} characters required`;
    } else if (maxLength && value?.length > maxLength) {
      validationError = `Maximum ${maxLength} characters allowed`;
    } else if (type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      validationError = 'Please enter a valid email address';
    } else if (validate) {
      validationError = validate(value);
    }

    setInternalError(validationError);
  }, [required, value, label, minLength, maxLength, type, validate]);

  // Handle change
  const handleChange = useCallback(
    (e) => {
      const newValue = e.target.value;
      onChange(e);

      // Clear error on change if it was previously set
      if (touched && internalError) {
        // Re-validate on change for better UX
        let validationError = null;
        if (required && !newValue?.toString().trim()) {
          validationError = `${label || 'This field'} is required`;
        } else if (maxLength && newValue?.length > maxLength) {
          validationError = `Maximum ${maxLength} characters allowed`;
        }
        setInternalError(validationError);
      }
    },
    [onChange, touched, internalError, required, label, maxLength]
  );

  const fieldClass = [
    styles.field,
    hasError && styles.hasError,
    disabled && styles.disabled,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const inputClass = [styles.input, hasError && styles.inputError]
    .filter(Boolean)
    .join(' ');

  // Render input based on type
  const renderInput = () => {
    const commonProps = {
      id: fieldId,
      name,
      value,
      onChange: handleChange,
      onBlur: handleBlur,
      placeholder,
      disabled,
      'aria-invalid': hasError,
      'aria-describedby': hasError ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined,
    };

    if (type === 'textarea') {
      return (
        <textarea
          {...commonProps}
          className={inputClass}
          rows={rows}
          maxLength={maxLength}
        />
      );
    }

    if (type === 'select') {
      return (
        <select {...commonProps} className={inputClass}>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        {...commonProps}
        type={type}
        className={inputClass}
        maxLength={maxLength}
        minLength={minLength}
      />
    );
  };

  return (
    <div className={fieldClass}>
      {label && (
        <label htmlFor={fieldId} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}

      <div className={styles.inputWrapper}>
        {renderInput()}
        {showCounter && (
          <span
            className={`${styles.charCount} ${
              maxLength && charCount > maxLength ? styles.charCountError : ''
            }`}
          >
            {charCount}
            {maxLength && `/${maxLength}`}
          </span>
        )}
      </div>

      {hint && !hasError && (
        <p id={`${fieldId}-hint`} className={styles.hint}>
          {hint}
        </p>
      )}

      {hasError && (
        <p id={`${fieldId}-error`} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

FormField.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string,
  type: PropTypes.oneOf(['text', 'email', 'number', 'password', 'textarea', 'select']),
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  error: PropTypes.string,
  hint: PropTypes.string,
  maxLength: PropTypes.number,
  minLength: PropTypes.number,
  rows: PropTypes.number,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
  disabled: PropTypes.bool,
  validate: PropTypes.func,
  showCharCount: PropTypes.bool,
  className: PropTypes.string,
};
