import { useState, useCallback } from 'react';

/**
 * useModalForm - Form state management for modal forms
 *
 * Handles common modal form patterns: form data, loading state,
 * error handling, and field-level validation.
 *
 * @param {Object} options
 * @param {Object} options.initialData - Initial form data values
 * @param {Function} [options.validate] - Validation function that returns { fieldName: errorMessage }
 * @param {Function} options.onSubmit - Async submit handler (receives trimmed formData)
 * @param {Function} [options.onSuccess] - Called after successful submit
 * @param {Function} [options.transformData] - Transform data before submit (e.g., trim strings)
 *
 * @returns {Object} Form state and handlers
 *
 * @example
 * const {
 *   formData,
 *   setFormData,
 *   loading,
 *   error,
 *   fieldErrors,
 *   handleChange,
 *   handleSubmit,
 *   reset,
 * } = useModalForm({
 *   initialData: { name: '', email: '' },
 *   validate: (data) => {
 *     const errors = {};
 *     if (!data.name.trim()) errors.name = 'Name is required';
 *     return errors;
 *   },
 *   onSubmit: async (data) => {
 *     return await api.create(data);
 *   },
 *   onSuccess: (result) => {
 *     onClose();
 *   },
 * });
 */
export function useModalForm({
  initialData = {},
  validate = null,
  onSubmit,
  onSuccess = null,
  transformData = null,
}) {
  const [formData, setFormData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  /**
   * Handle input change, clearing field errors
   */
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData((prev) => ({ ...prev, [name]: newValue }));

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
  }, [fieldErrors]);

  /**
   * Update form data programmatically (for complex updates)
   */
  const updateFormData = useCallback((updates) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async (e) => {
    if (e) e.preventDefault();

    setError(null);
    setFieldErrors({});

    // Validate if validation function provided
    if (validate) {
      const errors = validate(formData);
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return { success: false, errors };
      }
    }

    setLoading(true);

    try {
      // Transform data if transformer provided
      const dataToSubmit = transformData ? transformData(formData) : formData;

      const result = await onSubmit(dataToSubmit);

      // Handle success callback
      if (onSuccess) {
        onSuccess(result);
      }

      return { success: true, data: result };
    } catch (err) {
      const errorMessage = err.message || 'An error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [formData, validate, onSubmit, onSuccess, transformData]);

  /**
   * Reset form to initial state
   */
  const reset = useCallback(() => {
    setFormData(initialData);
    setLoading(false);
    setError(null);
    setFieldErrors({});
  }, [initialData]);

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setError(null);
    setFieldErrors({});
  }, []);

  return {
    formData,
    setFormData,
    updateFormData,
    loading,
    error,
    setError,
    fieldErrors,
    setFieldErrors,
    handleChange,
    handleSubmit,
    reset,
    clearErrors,
  };
}

export default useModalForm;
