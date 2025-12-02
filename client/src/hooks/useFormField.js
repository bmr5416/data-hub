import { useState, useCallback, useMemo } from 'react';

/**
 * useFormField - Individual field-level validation with error state
 *
 * Handles the common pattern of managing a single form field with
 * validation, error display, and accessibility attributes.
 *
 * @param {Object} options
 * @param {*} [options.initialValue=''] - Initial field value
 * @param {Function} [options.validate] - Validation function
 *   Should return error string or null/undefined if valid
 * @param {Function} [options.transform] - Transform value before setting
 * @param {number} [options.maxLength] - Maximum character length
 * @param {boolean} [options.required=false] - Whether field is required
 * @param {string} [options.requiredMessage] - Custom required message
 *
 * @returns {Object} Field state and controls
 *
 * @example
 * // Simple usage
 * const emailField = useFormField({
 *   initialValue: '',
 *   validate: (value) => {
 *     if (!value) return 'Email is required';
 *     if (!/\S+@\S+\.\S+/.test(value)) return 'Invalid email';
 *     return null;
 *   },
 * });
 *
 * // In JSX:
 * <input
 *   type="email"
 *   value={emailField.value}
 *   onChange={emailField.handleChange}
 *   {...emailField.getInputProps()}
 * />
 * {emailField.error && <span>{emailField.error}</span>}
 *
 * @example
 * // With max length and character count
 * const notesField = useFormField({
 *   initialValue: '',
 *   maxLength: 1000,
 * });
 *
 * // In JSX:
 * <textarea
 *   value={notesField.value}
 *   onChange={notesField.handleChange}
 *   maxLength={notesField.maxLength}
 * />
 * <span>{notesField.charCount}/{notesField.maxLength}</span>
 */
export function useFormField({
  initialValue = '',
  validate = null,
  transform = null,
  maxLength = null,
  required = false,
  requiredMessage = 'This field is required',
}) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState(null);
  const [touched, setTouched] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Character count for maxLength fields
  const charCount = useMemo(() => {
    if (typeof value === 'string') {
      return value.length;
    }
    return 0;
  }, [value]);

  // Validate the current value
  const validateValue = useCallback((val) => {
    // Check required
    if (required) {
      const isEmpty = val === '' || val === null || val === undefined;
      if (isEmpty) {
        return requiredMessage;
      }
    }

    // Custom validation
    if (validate) {
      return validate(val);
    }

    return null;
  }, [required, requiredMessage, validate]);

  // Run validation and update error state
  const runValidation = useCallback(() => {
    const errorMessage = validateValue(value);
    setError(errorMessage);
    return !errorMessage;
  }, [value, validateValue]);

  // Handle value change
  const handleChange = useCallback((eventOrValue) => {
    // Support both event and direct value
    const newValue = eventOrValue?.target !== undefined
      ? eventOrValue.target.value
      : eventOrValue;

    // Apply transform if provided
    const transformedValue = transform ? transform(newValue) : newValue;

    // Apply maxLength if provided
    const finalValue = maxLength && typeof transformedValue === 'string'
      ? transformedValue.slice(0, maxLength)
      : transformedValue;

    setValue(finalValue);
    setDirty(finalValue !== initialValue);

    // Clear error on change (will re-validate on blur or submit)
    if (error) {
      setError(null);
    }
  }, [transform, maxLength, initialValue, error]);

  // Handle blur event
  const handleBlur = useCallback(() => {
    setTouched(true);
    runValidation();
  }, [runValidation]);

  // Reset to initial state
  const reset = useCallback(() => {
    setValue(initialValue);
    setError(null);
    setTouched(false);
    setDirty(false);
  }, [initialValue]);

  // Set value programmatically (with validation)
  const setValueWithValidation = useCallback((newValue) => {
    const transformedValue = transform ? transform(newValue) : newValue;
    setValue(transformedValue);
    setDirty(transformedValue !== initialValue);

    // Run validation
    const errorMessage = validateValue(transformedValue);
    setError(errorMessage);
    return !errorMessage;
  }, [transform, initialValue, validateValue]);

  // Get props for input element
  const getInputProps = useCallback((overrides = {}) => {
    const props = {
      value,
      onChange: handleChange,
      onBlur: handleBlur,
      'aria-invalid': !!error,
    };

    if (maxLength) {
      props.maxLength = maxLength;
    }

    if (error && overrides.errorId) {
      props['aria-describedby'] = overrides.errorId;
    }

    return { ...props, ...overrides };
  }, [value, handleChange, handleBlur, error, maxLength]);

  // Check if field is valid (for form-level validation)
  const isValid = useMemo(() => {
    return !validateValue(value);
  }, [value, validateValue]);

  return {
    // State
    value,
    error,
    touched,
    dirty,
    isValid,
    charCount,
    maxLength,

    // Derived
    hasError: !!error,
    showError: touched && !!error, // Only show error if touched
    isNearMaxLength: maxLength && charCount > maxLength * 0.9,

    // Actions
    setValue,
    setError,
    handleChange,
    handleBlur,
    reset,
    setValueWithValidation,
    runValidation,

    // Helpers
    getInputProps,
  };
}

export default useFormField;
