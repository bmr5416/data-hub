import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import Modal from '../common/Modal';
import Card from '../common/Card';
import Button from '../common/Button';
import Icon from '../common/Icon';
import PSXSprite from '../common/PSXSprite';
import DataTable from '../common/DataTable';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useDataPreview } from '../../hooks/useDataPreview';
import { workbookApi } from '../../services/api';
import styles from './WarehouseDetailModal.module.css';

/**
 * Modal for viewing and managing warehouse details
 * Shows schema, stats, and allows edit/delete operations
 * Uses base Modal component for consistent behavior across the app.
 */
export default function WarehouseDetailModal({
  isOpen,
  warehouse,
  clientId,
  loading,
  onClose,
  onUpdate,
  onDelete,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);

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
      if (!selectedPlatform || !clientId) {
        return { columns: [], rows: [], totalRows: 0 };
      }
      return await workbookApi.getDataPreview(clientId, selectedPlatform, limit, 0);
    }, [clientId, selectedPlatform]),
    enabled: !!selectedPlatform && !!clientId,
  });

  // Initialize edited name when warehouse loads
  useEffect(() => {
    if (warehouse?.name) {
      setEditedName(warehouse.name);
    }
  }, [warehouse?.name]);

  // Handle platform selection for preview
  const handlePlatformPreview = useCallback((platformId) => {
    setSelectedPlatform(platformId);
    setShowPreview(true);
  }, [setShowPreview]);

  // Handle escape key for sub-states (base Modal handles final close)
  useEscapeKey({
    enabled: isOpen,
    handlers: [
      [confirmDelete, () => setConfirmDelete(false)],
      [isEditing, () => setIsEditing(false)],
      [showPreview, () => { setShowPreview(false); setSelectedPlatform(null); }],
    ],
    // No fallback - base Modal handles close
  });

  const handleSave = useCallback(async () => {
    if (editedName.trim() && editedName !== warehouse?.name) {
      await onUpdate({ name: editedName.trim() });
    }
    setIsEditing(false);
  }, [editedName, warehouse?.name, onUpdate]);

  const handleDelete = useCallback(async () => {
    await onDelete();
  }, [onDelete]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      closeOnOverlayClick
      closeOnEscape
    >
      {loading ? (
        <div className={styles.loading}>
          <PSXSprite sprite="hourglass" size="sm" ariaLabel="Loading" />
          <p>Loading warehouse details...</p>
        </div>
      ) : !warehouse ? (
        <div className={styles.loading}>
          <p>Warehouse not found</p>
        </div>
      ) : (
        <>
        <header className={styles.header}>
          <div className={styles.titleSection}>
            {isEditing ? (
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className={styles.titleInput}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') setIsEditing(false);
                }}
              />
            ) : (
              <h2 id="warehouse-detail-title" className={styles.title}>
                {warehouse.name}
              </h2>
            )}
            <span className={styles.subtitle}>
              {warehouse.platforms?.length || 0} {warehouse.platforms?.length === 1 ? 'platform' : 'platforms'}
            </span>
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
          {/* Stats Section */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Overview</h3>
            <div className={styles.stats}>
              <Card className={styles.statCard}>
                <div className={styles.statValue}>
                  {warehouse.canonicalDimensions?.length || 0}
                </div>
                <div className={styles.statLabel}>Dimensions</div>
              </Card>
              <Card className={styles.statCard}>
                <div className={styles.statValue}>
                  {warehouse.canonicalMetrics?.length || 0}
                </div>
                <div className={styles.statLabel}>Metrics</div>
              </Card>
              <Card className={styles.statCard}>
                <div className={styles.statValue}>
                  {warehouse.platforms?.length || 0}
                </div>
                <div className={styles.statLabel}>Platforms</div>
              </Card>
            </div>
          </section>

          {/* Platforms Section */}
          {warehouse.platforms?.length > 0 && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Platforms</h3>
              <div className={styles.platformList}>
                {warehouse.platforms.map((platform) => (
                  <button
                    key={platform}
                    className={`${styles.platformTag} ${styles.platformTagClickable} ${selectedPlatform === platform ? styles.platformTagActive : ''}`}
                    onClick={() => handlePlatformPreview(platform)}
                    title="Click to preview data"
                  >
                    {platform}
                    <Icon name="eye" size={12} />
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Schema Section */}
          {(warehouse.canonicalDimensions?.length > 0 || warehouse.canonicalMetrics?.length > 0) && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Schema</h3>
              <div className={styles.schemaGrid}>
                {warehouse.canonicalDimensions?.length > 0 && (
                  <div className={styles.schemaColumn}>
                    <h4 className={styles.columnTitle}>Dimensions</h4>
                    <ul className={styles.fieldList}>
                      {warehouse.canonicalDimensions.map((dim) => (
                        <li key={dim} className={styles.field}>
                          <Icon name="tag" size={14} />
                          {dim}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {warehouse.canonicalMetrics?.length > 0 && (
                  <div className={styles.schemaColumn}>
                    <h4 className={styles.columnTitle}>Metrics</h4>
                    <ul className={styles.fieldList}>
                      {warehouse.canonicalMetrics.map((metric) => (
                        <li key={metric} className={styles.field}>
                          <Icon name="chart" size={14} />
                          {metric}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}


          {/* Data Preview Section */}
          {showPreview && selectedPlatform && (
            <section className={styles.section}>
              <div className={styles.previewHeader}>
                <h3 className={styles.sectionTitle}>
                  Data Preview: {selectedPlatform}
                </h3>
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
                    onClick={() => {
                      setShowPreview(false);
                      setSelectedPlatform(null);
                    }}
                  >
                    <Icon name="close" size={14} />
                    Close
                  </Button>
                </div>
              </div>
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
                emptyMessage={`No data uploaded for ${selectedPlatform}`}
              />
            </section>
          )}
        </div>

        <footer className={styles.footer}>
          {confirmDelete ? (
            <div className={styles.confirmDelete}>
              <span>Are you sure you want to delete this warehouse?</span>
              <div className={styles.confirmActions}>
                <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={handleDelete}>
                  Delete
                </Button>
              </div>
            </div>
          ) : (
            <div className={styles.actions}>
              {isEditing ? (
                <>
                  <Button variant="ghost" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={handleSave}>
                    Save Changes
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => setConfirmDelete(true)}>
                    Delete
                  </Button>
                  <Button variant="secondary" onClick={() => setIsEditing(true)}>
                    Edit Name
                  </Button>
                  <Button variant="primary" onClick={onClose}>
                    Done
                  </Button>
                </>
              )}
            </div>
          )}
        </footer>
        </>
      )}
    </Modal>
  );
}

WarehouseDetailModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  warehouse: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    platforms: PropTypes.arrayOf(PropTypes.string),
    canonicalDimensions: PropTypes.arrayOf(PropTypes.string),
    canonicalMetrics: PropTypes.arrayOf(PropTypes.string),
    spreadsheetUrl: PropTypes.string,
  }),
  clientId: PropTypes.string,
  loading: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
