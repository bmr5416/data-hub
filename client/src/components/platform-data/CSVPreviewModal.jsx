import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Icon from '../common/Icon';
import DataTable from '../common/DataTable';
import { useNotification } from '../../hooks/useNotification';
import { clientDataApi } from '../../services/api';
import styles from './CSVPreviewModal.module.css';

/**
 * Full-screen CSV data preview modal
 * Supports both platform-specific and blended data preview
 * Uses base Modal component for consistent behavior across the app.
 */
export default function CSVPreviewModal({
  isOpen,
  clientId,
  dataType,     // 'platform' | 'blended'
  platformId,   // Required if dataType === 'platform'
  platformName, // Optional display name
  onClose,
}) {
  const { showError } = useNotification();
  const [data, setData] = useState({ columns: [], rows: [], totalRows: 0 });
  const [loading, setLoading] = useState(true);
  const [rowLimit, setRowLimit] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);

  // Calculate pagination
  const effectiveLimit = rowLimit === 'all' ? data.totalRows : rowLimit;
  const totalPages = effectiveLimit > 0 ? Math.ceil(data.totalRows / effectiveLimit) : 1;

  // Fetch data when component mounts or pagination changes
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const offset = rowLimit === 'all' ? 0 : currentPage * rowLimit;
      const limit = rowLimit === 'all' ? 'all' : rowLimit;

      let result;
      if (dataType === 'blended') {
        result = await clientDataApi.getBlendedDataPreview(clientId, limit, offset);
      } else {
        result = await clientDataApi.getDataPreview(clientId, platformId, limit, offset);
      }

      setData(result);
    } catch (error) {
      showError(error.message || 'Failed to load data preview');
      setData({ columns: [], rows: [], totalRows: 0, error: error.message });
    } finally {
      setLoading(false);
    }
  }, [clientId, dataType, platformId, rowLimit, currentPage, showError]);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [fetchData, isOpen]);

  // Handle row limit change
  const handleRowLimitChange = (e) => {
    const value = e.target.value;
    setRowLimit(value === 'all' ? 'all' : parseInt(value));
    setCurrentPage(0); // Reset to first page
  };

  // Generate display title
  const title = dataType === 'blended'
    ? 'Blended Data Preview'
    : `${platformName || platformId} Data Preview`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      closeOnOverlayClick
      closeOnEscape
    >
      <header className={styles.header}>
          <div className={styles.titleSection}>
            <h2 id="csv-preview-title" className={styles.title}>
              <Icon name={dataType === 'blended' ? 'grid' : 'table'} size={24} />
              {title}
            </h2>
            <span className={styles.rowCount}>
              {data.totalRows.toLocaleString()} total rows
            </span>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close preview"
          >
            <Icon name="close" size={24} />
          </button>
        </header>

        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <label className={styles.rowLimitLabel}>
              Rows per page:
              <select
                value={rowLimit}
                onChange={handleRowLimitChange}
                className={styles.rowLimitSelect}
              >
                <option value={10}>10</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value="all">All</option>
              </select>
            </label>
          </div>
          <div className={styles.toolbarRight}>
            {data.rows?.length > 0 && rowLimit !== 'all' && (
              <span className={styles.pageInfo}>
                Showing {Math.min((currentPage * rowLimit) + 1, data.totalRows)}-
                {Math.min((currentPage + 1) * rowLimit, data.totalRows)} of {data.totalRows.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        <div className={styles.content}>
          <DataTable
            columns={data.columns}
            data={data.rows}
            loading={loading}
            emptyMessage={dataType === 'blended' ? 'No blended data available' : `No data uploaded for ${platformId}`}
          />
        </div>

        <footer className={styles.footer}>
          {/* Pagination Controls */}
          {rowLimit !== 'all' && totalPages > 1 && (
            <div className={styles.pagination}>
              <Button
                variant="ghost"
                size="sm"
                disabled={currentPage === 0 || loading}
                onClick={() => setCurrentPage(0)}
              >
                <Icon name="chevronLeft" size={14} />
                <Icon name="chevronLeft" size={14} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={currentPage === 0 || loading}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <Icon name="chevronLeft" size={14} />
                Previous
              </Button>
              <span className={styles.pageIndicator}>
                Page {currentPage + 1} of {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={currentPage >= totalPages - 1 || loading}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next
                <Icon name="chevronRight" size={14} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={currentPage >= totalPages - 1 || loading}
                onClick={() => setCurrentPage(totalPages - 1)}
              >
                <Icon name="chevronRight" size={14} />
                <Icon name="chevronRight" size={14} />
              </Button>
            </div>
          )}

          <Button variant="primary" onClick={onClose}>
            Close
          </Button>
        </footer>
    </Modal>
  );
}

CSVPreviewModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  clientId: PropTypes.string.isRequired,
  dataType: PropTypes.oneOf(['platform', 'blended']).isRequired,
  platformId: PropTypes.string, // Required when dataType === 'platform'
  platformName: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};
