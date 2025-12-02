/**
 * Sources Tab Component
 *
 * Displays the list of data sources for a client.
 */

import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import StatusBadge from '../../../components/common/StatusBadge';
import ConfirmDeleteModal from '../../../components/common/ConfirmDeleteModal';
import styles from '../../ClientDetail.module.css';

export default function SourcesTab({ sources, onDelete, onViewDetails }) {
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = useCallback((source) => {
    setDeleteTarget(source);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await onDelete(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, onDelete]);

  const handleCancelDelete = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  if (sources.length === 0) {
    return (
      <Card>
        <div className={styles.empty}>
          <p>No data sources configured yet</p>
          <p className={styles.emptyHint}>Add a data source to start documenting the data flow</p>
        </div>
      </Card>
    );
  }

  return (
    <div className={styles.entityGrid}>
      {sources.map((source) => (
        <Card key={source.id} className={styles.entityCard}>
          <div className={styles.entityHeader}>
            <div>
              <div className={styles.entityName}>{source.name}</div>
              <div className={styles.entityPlatform}>
                <span className={styles.platformBadge}>{source.platform}</span>
                <span>{source.sourceType}</span>
              </div>
            </div>
            <StatusBadge status={source.status} size="sm" />
          </div>
          <div className={styles.entityMeta}>
            <span className={styles.metaItem}>Method: {source.connectionMethod}</span>
            <span className={styles.metaItem}>Refresh: {source.refreshFrequency}</span>
          </div>
          {source.notes && (
            <div className={styles.entityDescription}>{source.notes}</div>
          )}
          <div className={styles.entityActions}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewDetails(source.id)}
            >
              View Details
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(source)}>
              Delete
            </Button>
          </div>
        </Card>
      ))}

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        entityType="Source"
        entityName={deleteTarget?.name || ''}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        loading={isDeleting}
      />
    </div>
  );
}

SourcesTab.propTypes = {
  sources: PropTypes.array.isRequired,
  onDelete: PropTypes.func.isRequired,
  onViewDetails: PropTypes.func.isRequired,
};
