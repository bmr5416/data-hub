/**
 * Reports Tab Component
 *
 * Displays the list of reports for a client.
 */

import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import ConfirmDeleteModal from '../../../components/common/ConfirmDeleteModal';
import styles from '../../ClientDetail.module.css';

export default function ReportsTab({ reports, onViewDetails, onDelete }) {
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = useCallback((report) => {
    setDeleteTarget(report);
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

  if (reports.length === 0) {
    return (
      <Card>
        <div className={styles.empty}>
          <p>No reports configured yet</p>
          <p className={styles.emptyHint}>Document dashboards and scheduled reports</p>
        </div>
      </Card>
    );
  }

  return (
    <div className={styles.entityGrid}>
      {reports.map((report) => (
        <Card key={report.id} className={styles.entityCard}>
          <div className={styles.entityHeader}>
            <div>
              <div className={styles.entityName}>{report.name}</div>
              <div className={styles.entityPlatform}>
                <span className={styles.platformBadge}>{report.type}</span>
              </div>
            </div>
          </div>
          <div className={styles.entityMeta}>
            <span className={styles.metaItem}>Frequency: {report.frequency}</span>
            {report.recipients && (
              <span className={styles.metaItem}>Recipients: {report.recipients}</span>
            )}
          </div>
          {report.url && (
            <a
              href={report.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.entityDescription}
            >
              View Report &rarr;
            </a>
          )}
          <div className={styles.entityActions}>
            <Button variant="ghost" size="sm" onClick={() => onViewDetails(report.id)}>
              View Details
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(report)}>
              Delete
            </Button>
          </div>
        </Card>
      ))}

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        entityType="Report"
        entityName={deleteTarget?.name || ''}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        loading={isDeleting}
      />
    </div>
  );
}

ReportsTab.propTypes = {
  reports: PropTypes.array.isRequired,
  onViewDetails: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
