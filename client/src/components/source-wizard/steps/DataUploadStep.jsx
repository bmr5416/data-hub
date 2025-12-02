import { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { workbookApi, clientDataApi } from '../../../services/api';
import { useAudio } from '../../../hooks/useAudio';
import Button from '../../common/Button';
import Icon from '../../common/Icon';
import PSXSprite from '../../common/PSXSprite';
import FileUploader from '../../common/FileUploader';
import DataPreview from '../../common/DataPreview';
import { useNotification } from '../../../hooks/useNotification';
import styles from './DataUploadStep.module.css';

/**
 * Step 4: Data Upload
 *
 * Upload CSV data directly to the platform workspace.
 * Shows validation results and allows re-upload if needed.
 */
export default function DataUploadStep({ data, onChange }) {
  const { showError } = useNotification();
  const { playClick } = useAudio();
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [loadingUploads, setLoadingUploads] = useState(true);
  const [previewData, setPreviewData] = useState({ columns: [], rows: [], totalRows: 0 });
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Fetch existing uploads for this platform
  useEffect(() => {
    const fetchUploads = async () => {
      try {
        setLoadingUploads(true);
        const response = await workbookApi.listUploads(data.clientId, data.selectedPlatform);
        setUploads(response.uploads || []);
      } catch (err) {
        showError(err.message || 'Failed to load upload history');
      } finally {
        setLoadingUploads(false);
      }
    };

    if (data.clientId && data.selectedPlatform) {
      fetchUploads();
    }
  }, [data.clientId, data.selectedPlatform, showError]);

  // Fetch data preview when uploads change
  const fetchPreview = useCallback(async () => {
    if (!data.clientId || !data.selectedPlatform || uploads.length === 0) {
      setPreviewData({ columns: [], rows: [], totalRows: 0 });
      return;
    }

    try {
      setLoadingPreview(true);
      const result = await clientDataApi.getDataPreview(data.clientId, data.selectedPlatform, 5, 0);
      setPreviewData(result);
    } catch (err) {
      showError(err.message || 'Failed to load data preview');
      setPreviewData({ columns: [], rows: [], totalRows: 0 });
    } finally {
      setLoadingPreview(false);
    }
  }, [data.clientId, data.selectedPlatform, uploads.length, showError]);

  useEffect(() => {
    fetchPreview();
  }, [fetchPreview]);

  const handleUpload = useCallback(async (file) => {
    const result = await workbookApi.uploadFile(
      data.clientId,
      data.selectedPlatform,
      file
    );

    // Refresh uploads list
    const uploadsResponse = await workbookApi.listUploads(data.clientId, data.selectedPlatform);
    setUploads(uploadsResponse.uploads || []);

    // Fetch preview immediately after successful upload
    if (uploadsResponse.uploads?.length > 0) {
      try {
        setLoadingPreview(true);
        const previewResult = await clientDataApi.getDataPreview(data.clientId, data.selectedPlatform, 5, 0);
        setPreviewData(previewResult);
      } catch {
        // Preview fetch error - not critical, will retry via effect
      } finally {
        setLoadingPreview(false);
      }
    }

    // Auto-validate after upload
    try {
      const validation = await workbookApi.validateData(data.clientId, data.selectedPlatform);
      setValidationResult(validation);

      if (validation.valid) {
        onChange({ dataUploaded: true });
      }
    } catch {
      // Validation error - not critical
    }

    return result;
  }, [data.clientId, data.selectedPlatform, onChange]);

  const handleValidate = useCallback(async () => {
    playClick();
    try {
      setValidating(true);
      const result = await workbookApi.validateData(data.clientId, data.selectedPlatform);
      setValidationResult(result);

      if (result.valid) {
        onChange({ dataUploaded: true });
      }
    } catch (err) {
      setValidationResult({
        valid: false,
        issues: ['Failed to validate: ' + err.message]
      });
    } finally {
      setValidating(false);
    }
  }, [playClick, data.clientId, data.selectedPlatform, onChange]);

  const handleDeleteUpload = useCallback(async (uploadId) => {
    playClick();
    try {
      await workbookApi.deleteUpload(data.clientId, uploadId);
      setUploads((prev) => prev.filter((u) => u.id !== uploadId));
      setValidationResult(null);
      onChange({ dataUploaded: false });
    } catch (err) {
      showError(err.message || 'Failed to delete upload');
    }
  }, [playClick, data.clientId, onChange, showError]);

  const handleSkip = useCallback(() => {
    playClick();
    onChange({ dataUploaded: true });
  }, [playClick, onChange]);

  const hasUploads = uploads.length > 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Upload Your Data</h3>
        <p className={styles.description}>
          Upload your {data.schema?.platformName || 'platform'} data as a CSV file.
          The columns should match the schema you approved in the previous step.
        </p>
      </div>

      {/* Schema Hint */}
      {data.schema?.dimensions && (
        <div className={styles.schemaHint}>
          <Icon name="info" size={16} />
          <div>
            <strong>Expected columns:</strong>
            <span className={styles.columnList}>
              {data.schema.dimensions.slice(0, 3).map(d => d.platformField).join(', ')}
              {data.schema.dimensions.length > 3 && '...'}
            </span>
          </div>
        </div>
      )}

      {/* File Uploader */}
      <div className={styles.uploadSection}>
        <FileUploader
          onUpload={handleUpload}
          accept=".csv"
          disabled={data.dataUploaded}
        />
      </div>

      {/* Existing Uploads */}
      {!loadingUploads && hasUploads && (
        <div className={styles.uploadsSection}>
          <h4 className={styles.uploadsTitle}>Uploaded Files</h4>
          <div className={styles.uploadsList}>
            {uploads.map((upload) => (
              <div key={upload.id} className={styles.uploadItem}>
                <div className={styles.uploadInfo}>
                  <Icon name="file" size={16} />
                  <span className={styles.uploadFilename}>
                    {upload.originalFilename || upload.filename}
                  </span>
                  <span className={styles.uploadMeta}>
                    {upload.rowCount} rows
                  </span>
                </div>
                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={() => handleDeleteUpload(upload.id)}
                  aria-label="Delete upload"
                >
                  <Icon name="trash" size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Preview */}
      {hasUploads && (
        <div className={styles.previewSection}>
          <DataPreview
            columns={previewData.columns}
            rows={previewData.rows}
            totalRows={previewData.totalRows}
            loading={loadingPreview}
            title="Data Preview"
            maxRows={5}
            emptyMessage="Upload a CSV to see data preview"
          />
        </div>
      )}

      {/* Validation Result */}
      {validationResult && (
        <div className={validationResult.valid ? styles.validationSuccess : styles.validationError}>
          {validationResult.valid ? (
            <>
              <PSXSprite sprite="coin" size="sm" ariaLabel="Valid" />
              <div>
                <strong>Data Validated!</strong>
                <p>{validationResult.rowCount} rows ready for blending</p>
              </div>
            </>
          ) : (
            <>
              <PSXSprite sprite="tubeRed" size="sm" ariaLabel="Issues" />
              <div>
                <strong>Validation Issues</strong>
                <ul>
                  {validationResult.issues?.map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      )}

      {/* Actions */}
      <div className={styles.actions}>
        {data.dataUploaded ? (
          <div className={styles.confirmed}>
            <PSXSprite sprite="coin" size="sm" ariaLabel="Confirmed" />
            <span>Upload Confirmed</span>
          </div>
        ) : (
          <>
            {hasUploads && (
              <Button
                onClick={handleValidate}
                variant="primary"
                disabled={validating}
              >
                {validating ? (
                  <>
                    <PSXSprite sprite="hourglass" size="xs" ariaLabel="Validating" />
                    Validating...
                  </>
                ) : (
                  <>
                    <PSXSprite sprite="coin" size="xs" ariaLabel="Validate" />
                    Validate Data
                  </>
                )}
              </Button>
            )}
            <Button
              onClick={handleSkip}
              variant="ghost"
            >
              Skip - I&apos;ll upload later
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

DataUploadStep.propTypes = {
  data: PropTypes.shape({
    clientId: PropTypes.string.isRequired,
    selectedPlatform: PropTypes.string,
    schema: PropTypes.object,
    tableName: PropTypes.string,
    dataUploaded: PropTypes.bool
  }).isRequired,
  onChange: PropTypes.func.isRequired
};
