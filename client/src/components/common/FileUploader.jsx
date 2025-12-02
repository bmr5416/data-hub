import { useState, useCallback, useRef, useEffect, memo } from 'react';
import PropTypes from 'prop-types';
import { useAudio } from '../../hooks/useAudio';
import PSXSprite from './PSXSprite';
import ProgressBar from './ProgressBar';
import styles from './FileUploader.module.css';

/**
 * FileUploader Component
 *
 * Drag-and-drop file upload with progress tracking.
 * Supports CSV files with 10MB limit (matching server config).
 * Includes AbortController for upload cancellation and cleanup.
 */
function FileUploader({
  onUpload,
  accept = '.csv',
  maxSize = 10 * 1024 * 1024, // 10MB
  disabled = false,
  className = '',
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState({
    status: 'idle', // idle, uploading, success, error, cancelled
    progress: 0,
    filename: null,
    error: null,
    result: null,
  });
  const fileInputRef = useRef(null);
  const abortControllerRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const mountedRef = useRef(true);
  const { playClick } = useAudio();

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Cancel any in-progress upload
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Clear progress interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const validateFile = useCallback((file) => {
    if (!file) {
      return { valid: false, error: 'No file selected' };
    }

    // Check file type
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
    const isValidType = validTypes.includes(file.type) || file.name.endsWith('.csv');
    if (!isValidType) {
      return { valid: false, error: 'Only CSV files are allowed' };
    }

    // Check file size
    if (file.size > maxSize) {
      const maxMB = Math.round(maxSize / 1024 / 1024);
      return { valid: false, error: `File size must be under ${maxMB}MB` };
    }

    return { valid: true, error: null };
  }, [maxSize]);

  const handleFile = useCallback(async (file) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      if (mountedRef.current) {
        setUploadState({
          status: 'error',
          progress: 0,
          filename: file?.name,
          error: validation.error,
          result: null,
        });
      }
      return;
    }

    // Cancel any previous upload
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    // Create new AbortController for this upload
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    if (mountedRef.current) {
      setUploadState({
        status: 'uploading',
        progress: 10, // Start at 10% to show activity
        filename: file.name,
        error: null,
        result: null,
      });
    }

    try {
      // Simulate progress while upload happens
      progressIntervalRef.current = setInterval(() => {
        if (mountedRef.current) {
          setUploadState((prev) => ({
            ...prev,
            progress: Math.min(prev.progress + 10, 90),
          }));
        }
      }, 200);

      const result = await onUpload(file, signal);

      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;

      if (mountedRef.current) {
        setUploadState({
          status: 'success',
          progress: 100,
          filename: file.name,
          error: null,
          result,
        });
      }
    } catch (err) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;

      // Don't update state if aborted (component likely unmounting)
      if (err.name === 'AbortError') {
        if (mountedRef.current) {
          setUploadState({
            status: 'idle',
            progress: 0,
            filename: null,
            error: null,
            result: null,
          });
        }
        return;
      }

      if (mountedRef.current) {
        setUploadState({
          status: 'error',
          progress: 0,
          filename: file.name,
          error: err.message || 'Upload failed',
          result: null,
        });
      }
    }
  }, [onUpload, validateFile]);

  const handleCancel = useCallback(() => {
    playClick();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setUploadState({
      status: 'idle',
      progress: 0,
      filename: null,
      error: null,
      result: null,
    });
  }, [playClick]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const file = e.dataTransfer?.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [disabled, handleFile]);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  }, [handleFile]);

  const handleClick = useCallback(() => {
    if (!disabled && uploadState.status !== 'uploading') {
      fileInputRef.current?.click();
    }
  }, [disabled, uploadState.status]);

  const handleReset = useCallback(() => {
    playClick();
    setUploadState({
      status: 'idle',
      progress: 0,
      filename: null,
      error: null,
      result: null,
    });
  }, [playClick]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }, [handleClick]);

  const isUploading = uploadState.status === 'uploading';
  const isSuccess = uploadState.status === 'success';
  const isError = uploadState.status === 'error';

  return (
    <div className={`${styles.container} ${className}`}>
      <div
        className={`
          ${styles.dropZone}
          ${isDragging ? styles.dragging : ''}
          ${isUploading ? styles.uploading : ''}
          ${isSuccess ? styles.success : ''}
          ${isError ? styles.error : ''}
          ${disabled ? styles.disabled : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload file"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className={styles.fileInput}
          disabled={disabled || isUploading}
        />

        {isUploading && (
          <div className={styles.uploadingContent}>
            <PSXSprite sprite="hourglass" size="lg" className={styles.spinner} ariaLabel="Uploading" />
            <span className={styles.filename}>{uploadState.filename}</span>
            <ProgressBar
              value={uploadState.progress}
              max={100}
              size="md"
              showLabel
              color="primary"
            />
            <button
              type="button"
              className={styles.cancelButton}
              onClick={(e) => {
                e.stopPropagation();
                handleCancel();
              }}
            >
              Cancel
            </button>
          </div>
        )}

        {isSuccess && (
          <div className={styles.successContent}>
            <PSXSprite sprite="coin" size="lg" className={styles.successIcon} ariaLabel="Success" />
            <span className={styles.filename}>{uploadState.filename}</span>
            <span className={styles.successText}>
              {uploadState.result?.rowsProcessed || 0} rows uploaded
            </span>
            <button
              type="button"
              className={styles.resetButton}
              onClick={(e) => {
                e.stopPropagation();
                handleReset();
              }}
            >
              Upload another file
            </button>
          </div>
        )}

        {isError && (
          <div className={styles.errorContent}>
            <PSXSprite sprite="tubeRed" size="lg" className={styles.errorIcon} ariaLabel="Error" />
            <span className={styles.filename}>{uploadState.filename}</span>
            <span className={styles.errorText}>{uploadState.error}</span>
            <button
              type="button"
              className={styles.resetButton}
              onClick={(e) => {
                e.stopPropagation();
                handleReset();
              }}
            >
              Try again
            </button>
          </div>
        )}

        {uploadState.status === 'idle' && (
          <div className={styles.idleContent}>
            <PSXSprite sprite="floppy" size="lg" className={styles.uploadIcon} ariaLabel="Upload file" />
            <span className={styles.mainText}>
              {isDragging ? 'Drop your file here' : 'Drag & drop your CSV file'}
            </span>
            <span className={styles.subText}>or click to browse</span>
            <span className={styles.hint}>CSV files up to 10MB</span>
          </div>
        )}
      </div>
    </div>
  );
}

FileUploader.propTypes = {
  onUpload: PropTypes.func.isRequired,
  accept: PropTypes.string,
  maxSize: PropTypes.number,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

export default memo(FileUploader);
