import PropTypes from 'prop-types';
import Card from '../common/Card';
import Icon from '../common/Icon';
import { toTitleCase } from '../../utils/string';
import styles from './SchemaPreview.module.css';

/**
 * Schema preview component showing warehouse structure
 * Displays platform tables and Blended_Data table with their columns
 */
export default function SchemaPreview({
  platformSchemas = {},
  includeBlendedTable = true
}) {
  // Calculate blended schema (union of all fields across platforms)
  const blendedFields = Object.values(platformSchemas).reduce((acc, schema) => {
    const allFields = [
      ...(schema.dimensions || []).map(d => ({ id: d, type: 'dimension' })),
      ...(schema.metrics || []).map(m => ({ id: m, type: 'metric' }))
    ];

    allFields.forEach(field => {
      if (!acc.some(f => f.id === field.id)) {
        acc.push(field);
      }
    });

    return acc;
  }, []);

  const platformCount = Object.keys(platformSchemas).length;
  const totalTables = platformCount + (includeBlendedTable ? 1 : 0);

  if (platformCount === 0) {
    return (
      <Card className={styles.emptyState}>
        <Icon name="table" size={24} />
        <p>No platforms selected yet. Select platforms to see the warehouse schema.</p>
      </Card>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <Icon name="table" size={16} />
          <h3 className={styles.title}>Warehouse Schema Preview</h3>
        </div>
        <div className={styles.stats}>
          <span className={styles.stat}>
            <Icon name="table" size={16} />
            {totalTables} {totalTables === 1 ? 'table' : 'tables'}
          </span>
          <span className={styles.stat}>
            <Icon name="tag" size={16} />
            {blendedFields.filter(f => f.type === 'dimension').length} dimensions
          </span>
          <span className={styles.stat}>
            <Icon name="chartBar" size={16} />
            {blendedFields.filter(f => f.type === 'metric').length} metrics
          </span>
        </div>
      </div>

      <div className={styles.tables}>
        {/* Platform Tables */}
        {Object.entries(platformSchemas).map(([platformId, schema]) => {
          const dimCount = (schema.dimensions || []).length;
          const metCount = (schema.metrics || []).length;
          const totalColumns = dimCount + metCount;

          return (
            <Card key={platformId} className={styles.tableCard}>
              <div className={styles.tableHeader}>
                <div className={styles.tableInfo}>
                  <Icon name="table" size={16} />
                  <span className={styles.tableName}>
                    {toTitleCase(platformId)}
                  </span>
                </div>
                <span className={styles.columnCount}>
                  {totalColumns} {totalColumns === 1 ? 'column' : 'columns'}
                </span>
              </div>
              <div className={styles.columns}>
                {schema.dimensions?.map(dimId => (
                  <div key={dimId} className={`${styles.column} ${styles.dimension}`}>
                    <Icon name="tag" size={12} />
                    <span>{dimId}</span>
                  </div>
                ))}
                {schema.metrics?.map(metId => (
                  <div key={metId} className={`${styles.column} ${styles.metric}`}>
                    <Icon name="chartBar" size={12} />
                    <span>{metId}</span>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}

        {/* Blended Data Table */}
        {includeBlendedTable && blendedFields.length > 0 && (
          <Card className={`${styles.tableCard} ${styles.blendedTable}`}>
            <div className={styles.tableHeader}>
              <div className={styles.tableInfo}>
                <Icon name="table" size={16} />
                <span className={styles.tableName}>Blended_Data</span>
                <span className={styles.badge}>Unified</span>
              </div>
              <span className={styles.columnCount}>
                {blendedFields.length} {blendedFields.length === 1 ? 'column' : 'columns'}
              </span>
            </div>
            <div className={styles.description}>
              This table combines all unique fields from your selected platforms,
              providing a unified view of your data.
            </div>
            <div className={styles.columns}>
              {blendedFields
                .filter(f => f.type === 'dimension')
                .map(field => (
                  <div key={field.id} className={`${styles.column} ${styles.dimension}`}>
                    <Icon name="tag" size={12} />
                    <span>{field.id}</span>
                  </div>
                ))}
              {blendedFields
                .filter(f => f.type === 'metric')
                .map(field => (
                  <div key={field.id} className={`${styles.column} ${styles.metric}`}>
                    <Icon name="chartBar" size={12} />
                    <span>{field.id}</span>
                  </div>
                ))}
            </div>
          </Card>
        )}
      </div>

      <div className={styles.footer}>
        <Icon name="info" size={16} />
        <p className={styles.footerText}>
          These data tables will be created in your warehouse when you complete the wizard.
          Each table will have these columns as headers.
        </p>
      </div>
    </div>
  );
}

SchemaPreview.propTypes = {
  platformSchemas: PropTypes.objectOf(
    PropTypes.shape({
      dimensions: PropTypes.arrayOf(PropTypes.string),
      metrics: PropTypes.arrayOf(PropTypes.string)
    })
  ),
  includeBlendedTable: PropTypes.bool
};
