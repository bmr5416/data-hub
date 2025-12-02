/**
 * KPIs Tab Component
 *
 * Displays the list of KPIs for a client.
 */

import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import ConfirmDeleteModal from '../../../components/common/ConfirmDeleteModal';
import styles from '../../ClientDetail.module.css';

export default function KPIsTab({ kpis, onEdit, onDelete }) {
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = useCallback((kpi) => {
    setDeleteTarget(kpi);
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

  if (kpis.length === 0) {
    return (
      <Card>
        <div className={styles.empty}>
          <p>No KPIs tracked yet</p>
          <p className={styles.emptyHint}>Add key performance indicators for this client</p>
        </div>
      </Card>
    );
  }

  return (
    <div className={styles.entityGrid}>
      {kpis.map((kpi) => (
        <Card key={kpi.id} className={styles.entityCard}>
          <div className={styles.entityHeader}>
            <div>
              <div className={styles.entityName}>{kpi.name}</div>
              <div className={styles.entityPlatform}>
                <span className={styles.platformBadge}>{kpi.category}</span>
              </div>
            </div>
          </div>
          <div className={styles.entityMeta}>
            <span className={styles.metaItem}>Frequency: {kpi.reportingFrequency}</span>
            {kpi.targetValue && <span className={styles.metaItem}>Target: {kpi.targetValue}</span>}
          </div>
          {kpi.definition && (
            <div className={styles.entityDescription}>{kpi.definition}</div>
          )}
          <div className={styles.entityActions}>
            <Button variant="ghost" size="sm" onClick={() => onEdit(kpi)}>
              Edit
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(kpi)}>
              Delete
            </Button>
          </div>
        </Card>
      ))}

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        entityType="KPI"
        entityName={deleteTarget?.name || ''}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        loading={isDeleting}
      />
    </div>
  );
}

KPIsTab.propTypes = {
  kpis: PropTypes.array.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
