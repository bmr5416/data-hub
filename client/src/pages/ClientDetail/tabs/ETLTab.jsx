/**
 * ETL Tab Component
 *
 * Displays the list of ETL processes for a client.
 */

import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import StatusBadge from '../../../components/common/StatusBadge';
import ConfirmDeleteModal from '../../../components/common/ConfirmDeleteModal';
import styles from '../../ClientDetail.module.css';

export default function ETLTab({ etlProcesses, onDelete }) {
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = useCallback((etl) => {
    setDeleteTarget(etl);
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

  if (etlProcesses.length === 0) {
    return (
      <Card>
        <div className={styles.empty}>
          <p>No ETL processes documented yet</p>
          <p className={styles.emptyHint}>Document your data pipelines and transformations</p>
        </div>
      </Card>
    );
  }

  return (
    <div className={styles.entityGrid}>
      {etlProcesses.map((etl) => (
        <Card key={etl.id} className={styles.entityCard}>
          <div className={styles.entityHeader}>
            <div>
              <div className={styles.entityName}>{etl.name}</div>
              <div className={styles.entityPlatform}>
                <span className={styles.platformBadge}>{etl.orchestrator}</span>
              </div>
            </div>
            <StatusBadge status={etl.status} size="sm" />
          </div>
          <div className={styles.entityMeta}>
            <span className={styles.metaItem}>Destination: {etl.destination}</span>
            {etl.schedule && <span className={styles.metaItem}>Schedule: {etl.schedule}</span>}
          </div>
          {etl.transformDescription && (
            <div className={styles.entityDescription}>{etl.transformDescription}</div>
          )}
          <div className={styles.entityActions}>
            <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(etl)}>
              Delete
            </Button>
          </div>
        </Card>
      ))}

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        entityType="ETL Process"
        entityName={deleteTarget?.name || ''}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        loading={isDeleting}
      />
    </div>
  );
}

ETLTab.propTypes = {
  etlProcesses: PropTypes.array.isRequired,
  onDelete: PropTypes.func.isRequired,
};
