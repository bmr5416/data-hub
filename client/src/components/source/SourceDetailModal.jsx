import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Icon from '../common/Icon';
import PSXSprite from '../common/PSXSprite';
import StatusBadge from '../common/StatusBadge';
import DataTable from '../common/DataTable';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useDataPreview } from '../../hooks/useDataPreview';
import { useNotification } from '../../hooks/useNotification';
import { workbookApi } from '../../services/api';
import styles from './SourceDetailModal.module.css';

/**
 * Modal for viewing data source details
 * Shows configuration, upload history, validation status, and data preview
 * Uses base Modal component for consistent behavior across the app.
 */
export default function SourceDetailModal({
  isOpen,
  source,
  clientId,
  onClose,
}) {
  const { showError } = useNotification();

  // Upload history state
  const [uploads, setUploads] = useState([]);
  const [uploadsLoading, setUploadsLoading] = useState(true);

  // Validation state
  const [validation, setValidation] = useState(null);
  const [validationLoading, setValidationLoading] = useState(true);

  // Data preview hook
  const {
    showPreview,
    setShowPreview,
    previewData,
    previewLoading,
    rowLimit,
    setRowLimit,
  } = useDataPreview({
    fetchFn: useCallback(async (limit) => {
      if (!source?.platform || !clientId) {
        return { columns: [], rows: [], totalRows: 0 };
      }
      return await workbookApi.getDataPreview(clientId, source.platform, limit, 0);
    }, [clientId, source?.platform]),
    enabled: !!source?.platform && !!clientId,
  });

  // Fetch uploads and validation on mount
  useEffect(() => {
    if (!source || !clientId) return;

    const fetchData = async () => {
      // Fetch uploads
      setUploadsLoading(true);
      try {
        const uploadsResult = await workbookApi.listUploads(clientId, source.platform);
        setUploads(uploadsResult.uploads || []);
      } catch (error) {
        showError(error.message || 'Failed to load upload history');
        setUploads([]);
      } finally {
        setUploadsLoading(false);
      }

      // Fetch validation
      setValidationLoading(true);
      try {
        const validationResult = await workbookApi.validateData(clientId, source.platform);
        setValidation(validationResult);
      } catch (error) {
        showError(error.message || 'Failed to validate data');
        setValidation(null);
      } finally {
        setValidationLoading(false);
      }
    };

    fetchData();
  }, [source, clientId, showError]);

  // Handle escape key for preview sub-state (base Modal handles final close)
  useEscapeKey({
    enabled: isOpen,
    handlers: [
      [showPreview, () => setShowPreview(false)],
    ],
    // No fallback - base Modal handles close
  });

  const handlePreviewClick = useCallback(() => {
    setShowPreview(true);
  }, [setShowPreview]);

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      closeOnOverlayClick
      closeOnEscape
    >
      {!source ? (
        <div className={styles.loadingState}>
          <p>Source not found</p>
        </div>
      ) : (
        <>
        <header className={styles.header}>
          <div className={styles.titleSection}>
            <h2 id="source-detail-title" className={styles.title}>
              {source.name}
            </h2>
            <div className={styles.titleMeta}>
              <span className={styles.platformBadge}>{source.platform}</span>
              <StatusBadge status={source.status} size="sm" />
            </div>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close modal"
          >
            <Icon name="close" size={20} />
          </button>
        </header>

        <div className={styles.content}>
          {/* Connection Configuration */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Connection Configuration</h3>
            <div className={styles.configGrid}>
              <div className={styles.configItem}>
                <span className={styles.configLabel}>Platform</span>
                <span className={styles.configValue}>{source.platform}</span>
              </div>
              <div className={styles.configItem}>
                <span className={styles.configLabel}>Source Type</span>
                <span className={styles.configValue}>{source.sourceType || '-'}</span>
              </div>
              <div className={styles.configItem}>
                <span className={styles.configLabel}>Connection Method</span>
                <span className={styles.configValue}>{source.connectionMethod || '-'}</span>
              </div>
              <div className={styles.configItem}>
                <span className={styles.configLabel}>Refresh Frequency</span>
                <span className={styles.configValue}>{source.refreshFrequency || '-'}</span>
              </div>
            </div>
            {source.notes && (
              <div className={styles.notes}>
                <span className={styles.configLabel}>Notes</span>
                <p className={styles.notesText}>{source.notes}</p>
              </div>
            )}
          </section>

          {/* Upload History */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Upload History</h3>
            {uploadsLoading ? (
              <div className={styles.loadingState}>
                <PSXSprite sprite="hourglass" size="sm" ariaLabel="Loading" />
                <span>Loading uploads...</span>
              </div>
            ) : uploads.length === 0 ? (
              <div className={styles.emptyState}>
                <PSXSprite sprite="floppy" size="sm" ariaLabel="No uploads" />
                <span>No uploads yet</span>
              </div>
            ) : (
              <div className={styles.uploadList}>
                {uploads.map((upload) => (
                  <div key={upload.id} className={styles.uploadItem}>
                    <div className={styles.uploadInfo}>
                      <span className={styles.uploadFilename}>
                        {upload.originalFilename || upload.filename}
                      </span>
                      <span className={styles.uploadMeta}>
                        {upload.rowCount} rows • {formatDate(upload.uploadedAt)}
                      </span>
                    </div>
                    <StatusBadge status={upload.status} size="sm" />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Validation Status */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Data Validation</h3>
            {validationLoading ? (
              <div className={styles.loadingState}>
                <PSXSprite sprite="hourglass" size="sm" ariaLabel="Validating" />
                <span>Validating data...</span>
              </div>
            ) : !validation ? (
              <div className={styles.emptyState}>
                <PSXSprite sprite="tubeRed" size="sm" ariaLabel="No validation data" />
                <span>No validation data available</span>
              </div>
            ) : (
              <div className={styles.validationResult}>
                <div className={`${styles.validationBadge} ${validation.valid ? styles.valid : styles.invalid}`}>
                  <PSXSprite sprite={validation.valid ? 'coin' : 'tubeRed'} size="xs" ariaLabel={validation.valid ? 'Valid' : 'Invalid'} />
                  {validation.valid ? 'Valid' : 'Issues Found'}
                </div>
                {validation.issues?.length > 0 && (
                  <ul className={styles.issuesList}>
                    {validation.issues.map((issue, idx) => (
                      <li key={idx} className={styles.issueItem}>
                        <PSXSprite sprite="tubeRed" size="xs" ariaLabel="Issue" />
                        {issue}
                      </li>
                    ))}
                  </ul>
                )}
                <div className={styles.validationMeta}>
                  <span>{validation.rowCount} rows</span>
                  {validation.headers?.length > 0 && (
                    <span>{validation.headers.length} columns</span>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Data Preview */}
          <section className={styles.section}>
            <div className={styles.previewHeader}>
              <h3 className={styles.sectionTitle}>Data Preview</h3>
              {!showPreview ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handlePreviewClick}
                  disabled={uploads.length === 0}
                >
                  <Icon name="eye" size={14} />
                  View Data
                </Button>
              ) : (
                <div className={styles.previewControls}>
                  <label className={styles.rowLimitLabel}>
                    Rows:
                    <select
                      value={rowLimit}
                      onChange={(e) => setRowLimit(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                      className={styles.rowLimitSelect}
                    >
                      <option value={10}>10</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value="all">All</option>
                    </select>
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(false)}
                  >
                    <Icon name="close" size={14} />
                    Close
                  </Button>
                </div>
              )}
            </div>
            {showPreview && (
              <>
                <div className={styles.previewInfo}>
                  <span>{previewData.totalRows} total rows</span>
                  {previewData.rows?.length > 0 && previewData.rows.length < previewData.totalRows && (
                    <span>Showing {previewData.rows.length} rows</span>
                  )}
                </div>
                <DataTable
                  columns={previewData.columns}
                  data={previewData.rows}
                  loading={previewLoading}
                  emptyMessage={`No data uploaded for ${source.platform}`}
                />
              </>
            )}
          </section>
        </div>

        <footer className={styles.footer}>
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </footer>
        </>
      )}
    </Modal>
  );
}

SourceDetailModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  source: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    platform: PropTypes.string,
    sourceType: PropTypes.string,
    connectionMethod: PropTypes.string,
    refreshFrequency: PropTypes.string,
    status: PropTypes.string,
    notes: PropTypes.string,
  }),
  clientId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};
