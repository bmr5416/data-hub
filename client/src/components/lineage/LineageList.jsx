import { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useAudio } from '../../hooks/useAudio';
import Button from '../common/Button';
import Icon from '../common/Icon';
import ConfirmDeleteModal from '../common/ConfirmDeleteModal';
import ErrorMessage from '../common/ErrorMessage';
import styles from './LineageList.module.css';

/**
 * Displays data lineage connections for a client
 */
export default function LineageList({
  lineage,
  loading,
  error = null,
  sources = [],
  etlProcesses = [],
  kpis = [],
  reports = [],
  onFetch,
  onDelete,
  onAddClick,
}) {
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const { playClick } = useAudio();

  useEffect(() => {
    onFetch();
  }, [onFetch]);

  // Toggle expansion on card click
  const handleCardClick = useCallback((connectionId) => {
    playClick();
    setExpandedId((prev) => (prev === connectionId ? null : connectionId));
  }, [playClick]);

  // Helper to get source name by ID
  const getSourceName = (sourceId) => {
    const source = sources?.find((s) => s.id === sourceId);
    return source?.name || source?.platform || 'Unknown Source';
  };

  // Helper to get destination name by type and ID
  const getDestinationName = (type, id) => {
    let list;
    switch (type) {
      case 'etl':
        list = etlProcesses;
        break;
      case 'kpi':
        list = kpis;
        break;
      case 'report':
        list = reports;
        break;
      default:
        return 'Unknown';
    }
    const item = list?.find((i) => i.id === id);
    return item?.name || 'Unknown';
  };

  // Helper to get destination type label
  const getTypeLabel = (type) => {
    switch (type) {
      case 'etl':
        return 'ETL';
      case 'kpi':
        return 'KPI';
      case 'report':
        return 'Report';
      default:
        return type;
    }
  };

  // Helper to get full source details
  const getSourceDetails = useCallback((sourceId) => {
    const source = sources?.find((s) => s.id === sourceId);
    if (!source) return null;
    return {
      name: source.name || source.platform || 'Unknown',
      platform: source.platform,
      status: source.status,
      type: source.sourceType,
    };
  }, [sources]);

  // Helper to get full destination details
  const getDestinationDetails = useCallback((type, id) => {
    let list;
    switch (type) {
      case 'etl':
        list = etlProcesses;
        break;
      case 'kpi':
        list = kpis;
        break;
      case 'report':
        list = reports;
        break;
      default:
        return null;
    }
    const item = list?.find((i) => i.id === id);
    if (!item) return null;
    return {
      name: item.name || 'Unknown',
      description: item.description || item.notes,
      status: item.status,
    };
  }, [etlProcesses, kpis, reports]);

  // Get a descriptive name for the connection
  const getConnectionName = (connection) => {
    const source = getSourceName(connection.sourceId);
    const dest = getDestinationName(connection.destinationType, connection.destinationId);
    return `${source} → ${dest}`;
  };

  const handleDeleteClick = useCallback((connection) => {
    playClick();
    setDeleteTarget(connection);
  }, [playClick]);

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

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading lineage data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <ErrorMessage
          error={error}
          variant="card"
          title="Failed to Load Lineage"
          onRetry={onFetch}
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Button onClick={onAddClick} size="sm">
          + Add Connection
        </Button>
      </div>

      {lineage.length === 0 ? (
        <div className={styles.empty}>
          <p>No lineage connections defined.</p>
          <p className={styles.hint}>
            Add connections to track how data flows from sources to ETL processes, KPIs, and reports.
          </p>
        </div>
      ) : (
        <div className={styles.list}>
          {lineage.map((connection) => {
            const isExpanded = expandedId === connection.id;
            const sourceDetails = getSourceDetails(connection.sourceId);
            const destDetails = getDestinationDetails(connection.destinationType, connection.destinationId);

            return (
              <div
                key={connection.id}
                className={`${styles.connectionCard} ${isExpanded ? styles.expanded : ''}`}
                onClick={() => handleCardClick(connection.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCardClick(connection.id);
                  }
                }}
                aria-expanded={isExpanded}
              >
                <div className={styles.connectionHeader}>
                  <div className={styles.connectionFlow}>
                    <span className={styles.source}>{getSourceName(connection.sourceId)}</span>
                    <span className={styles.arrow}>→</span>
                    <span className={styles.destinationType}>
                      [{getTypeLabel(connection.destinationType)}]
                    </span>
                    <span className={styles.destination}>
                      {getDestinationName(connection.destinationType, connection.destinationId)}
                    </span>
                  </div>
                  <Icon
                    name={isExpanded ? 'chevronUp' : 'chevronDown'}
                    size={16}
                    className={styles.chevron}
                    aria-hidden="true"
                  />
                </div>

                {isExpanded && (
                  <div className={styles.expandedDetails}>
                    <div className={styles.detailsGrid}>
                      {/* Source Details */}
                      <div className={styles.detailSection}>
                        <h5 className={styles.detailTitle}>Source</h5>
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Name:</span>
                          <span className={styles.detailValue}>{sourceDetails?.name || 'Unknown'}</span>
                        </div>
                        {sourceDetails?.platform && (
                          <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>Platform:</span>
                            <span className={styles.detailValue}>{sourceDetails.platform}</span>
                          </div>
                        )}
                        {sourceDetails?.status && (
                          <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>Status:</span>
                            <span className={styles.detailValue}>{sourceDetails.status}</span>
                          </div>
                        )}
                      </div>

                      {/* Destination Details */}
                      <div className={styles.detailSection}>
                        <h5 className={styles.detailTitle}>Destination ({getTypeLabel(connection.destinationType)})</h5>
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Name:</span>
                          <span className={styles.detailValue}>{destDetails?.name || 'Unknown'}</span>
                        </div>
                        {destDetails?.status && (
                          <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>Status:</span>
                            <span className={styles.detailValue}>{destDetails.status}</span>
                          </div>
                        )}
                        {destDetails?.description && (
                          <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>Description:</span>
                            <span className={styles.detailValue}>{destDetails.description}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {connection.transformationNotes && (
                      <div className={styles.notes}>
                        <strong>Transformation Notes:</strong> {connection.transformationNotes}
                      </div>
                    )}
                  </div>
                )}

                <button
                  className={styles.deleteButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(connection);
                  }}
                  title="Delete connection"
                  aria-label="Delete connection"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        entityType="Connection"
        entityName={deleteTarget ? getConnectionName(deleteTarget) : ''}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        loading={isDeleting}
      />
    </div>
  );
}

LineageList.propTypes = {
  lineage: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      sourceId: PropTypes.string.isRequired,
      destinationType: PropTypes.oneOf(['etl', 'kpi', 'report']).isRequired,
      destinationId: PropTypes.string.isRequired,
      transformationNotes: PropTypes.string,
    })
  ).isRequired,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.string,
  sources: PropTypes.array,
  etlProcesses: PropTypes.array,
  kpis: PropTypes.array,
  reports: PropTypes.array,
  onFetch: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onAddClick: PropTypes.func.isRequired,
};
