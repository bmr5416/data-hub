import { useState, useEffect, useCallback } from 'react';

/**
 * useFileUpload - File upload workflow with validation
 *
 * Handles the common pattern of uploading files, listing uploads,
 * validating data, and managing upload lifecycle.
 *
 * @param {Object} options
 * @param {Function} options.listUploadsFn - Async function to list uploads
 *   Should return { uploads: [] }
 * @param {Function} options.uploadFn - Async function to upload a file
 *   Should accept (file) and return upload result
 * @param {Function} options.validateFn - Async function to validate uploads
 *   Should return { valid: boolean, issues?: [], rowCount?: number }
 * @param {Function} options.deleteFn - Async function to delete an upload
 *   Should accept (uploadId)
 * @param {Function} [options.onValidationSuccess] - Called when validation passes
 * @param {Function} [options.onDelete] - Called after successful deletion
 * @param {boolean} [options.autoValidate=true] - Auto-validate after upload
 * @param {boolean} [options.enabled=true] - Whether fetching is enabled
 *
 * @returns {Object} Upload state and controls
 *
 * @example
 * const {
 *   uploads,
 *   uploadsLoading,
 *   validating,
 *   validationResult,
 *   handleUpload,
 *   handleValidate,
 *   handleDelete,
 *   refreshUploads,
 * } = useFileUpload({
 *   listUploadsFn: () => workbookApi.listUploads(clientId, platformId),
 *   uploadFn: (file) => workbookApi.uploadFile(clientId, platformId, file),
 *   validateFn: () => workbookApi.validateData(clientId, platformId),
 *   deleteFn: (id) => workbookApi.deleteUpload(clientId, id),
 *   onValidationSuccess: () => onChange({ dataUploaded: true }),
 * });
 */
export function useFileUpload({
  listUploadsFn,
  uploadFn,
  validateFn,
  deleteFn,
  onValidationSuccess = null,
  onDelete = null,
  autoValidate = true,
  enabled = true,
}) {
  const [uploads, setUploads] = useState([]);
  const [uploadsLoading, setUploadsLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  // Fetch uploads on mount or when enabled changes
  const refreshUploads = useCallback(async () => {
    if (!listUploadsFn) return;

    try {
      setUploadsLoading(true);
      setUploadError(null);
      const response = await listUploadsFn();
      setUploads(response.uploads || []);
    } catch (error) {
      setUploadError(error.message);
      setUploads([]);
    } finally {
      setUploadsLoading(false);
    }
  }, [listUploadsFn]);

  useEffect(() => {
    if (enabled) {
      refreshUploads();
    }
  }, [enabled, refreshUploads]);

  // Handle file upload
  const handleUpload = useCallback(async (file) => {
    if (!uploadFn) {
      throw new Error('uploadFn not provided');
    }

    setUploadError(null);

    try {
      const result = await uploadFn(file);

      // Refresh uploads list
      await refreshUploads();

      // Auto-validate after upload if enabled
      if (autoValidate && validateFn) {
        try {
          const validation = await validateFn();
          setValidationResult(validation);

          if (validation.valid && onValidationSuccess) {
            onValidationSuccess(validation);
          }
        } catch {
          // Validation error - not critical, upload still succeeded
        }
      }

      return result;
    } catch (error) {
      setUploadError(error.message);
      throw error;
    }
  }, [uploadFn, refreshUploads, autoValidate, validateFn, onValidationSuccess]);

  // Handle manual validation
  const handleValidate = useCallback(async () => {
    if (!validateFn) {
      throw new Error('validateFn not provided');
    }

    try {
      setValidating(true);
      setUploadError(null);

      const result = await validateFn();
      setValidationResult(result);

      if (result.valid && onValidationSuccess) {
        onValidationSuccess(result);
      }

      return result;
    } catch (error) {
      const errorResult = {
        valid: false,
        issues: ['Failed to validate: ' + error.message],
      };
      setValidationResult(errorResult);
      return errorResult;
    } finally {
      setValidating(false);
    }
  }, [validateFn, onValidationSuccess]);

  // Handle upload deletion
  const handleDelete = useCallback(async (uploadId) => {
    if (!deleteFn) {
      throw new Error('deleteFn not provided');
    }

    try {
      setUploadError(null);
      await deleteFn(uploadId);

      // Remove from local state
      setUploads((prev) => prev.filter((u) => u.id !== uploadId));

      // Clear validation result since data changed
      setValidationResult(null);

      if (onDelete) {
        onDelete(uploadId);
      }

      return true;
    } catch (error) {
      setUploadError(error.message);
      throw error;
    }
  }, [deleteFn, onDelete]);

  // Clear validation result
  const clearValidation = useCallback(() => {
    setValidationResult(null);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setUploadError(null);
  }, []);

  return {
    // State
    uploads,
    uploadsLoading,
    validating,
    validationResult,
    uploadError,
    hasUploads: uploads.length > 0,

    // Actions
    handleUpload,
    handleValidate,
    handleDelete,
    refreshUploads,
    clearValidation,
    clearError,
  };
}

export default useFileUpload;
