/**
 * Warehouses Tab Component
 *
 * Displays the list of data warehouses for a client.
 */

import PropTypes from 'prop-types';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import styles from '../../ClientDetail.module.css';

export default function WarehousesTab({ warehouses, onCreateWarehouse, onViewDetails }) {
  if (warehouses.length === 0) {
    return (
      <Card>
        <div className={styles.empty}>
          <p>No data warehouses created yet</p>
          <p className={styles.emptyHint}>
            Create a data warehouse to organize and centralize your marketing data
          </p>
          <Button variant="primary" onClick={onCreateWarehouse}>
            + Create Data Warehouse
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <div className={styles.warehouseActions}>
        <Button variant="primary" onClick={onCreateWarehouse}>
          + Create Data Warehouse
        </Button>
      </div>
      <div className={styles.entityGrid}>
        {warehouses.map((warehouse) => (
          <Card key={warehouse.id} className={styles.entityCard}>
            <div className={styles.entityHeader}>
              <div>
                <div className={styles.entityName}>{warehouse.name}</div>
                <div className={styles.entityPlatform}>
                  {warehouse.platforms?.length || 0}{' '}
                  {warehouse.platforms?.length === 1 ? 'platform' : 'platforms'}
                </div>
              </div>
            </div>
            <div className={styles.entityMeta}>
              <span className={styles.metaItem}>
                {warehouse.canonicalDimensions?.length || 0} dimensions
              </span>
              <span className={styles.metaItem}>
                {warehouse.canonicalMetrics?.length || 0} metrics
              </span>
            </div>
            <div className={styles.entityActions}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewDetails(warehouse.id)}
              >
                View Details
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

WarehousesTab.propTypes = {
  warehouses: PropTypes.array.isRequired,
  onCreateWarehouse: PropTypes.func.isRequired,
  onViewDetails: PropTypes.func.isRequired,
};
