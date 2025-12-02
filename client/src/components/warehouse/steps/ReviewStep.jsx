import { useMemo } from 'react';
import PropTypes from 'prop-types';
import SchemaPreview from '../SchemaPreview';
import { WarehouseNameInput, BlendedTableCheckbox } from '../shared';
import Card from '../../common/Card';
import Icon from '../../common/Icon';
import { SampleDataPreview } from '../../common/DataPreview';
import styles from './ReviewStep.module.css';

/**
 * Step 3: Review & Create
 * Summary of platforms, field counts, schema preview, and warehouse naming
 */
export default function ReviewStep({ data, onChange }) {
  const { selectedPlatforms = [], fieldSelections = {}, warehouseName = '', includeBlendedTable = true } = data;

  const handleWarehouseNameChange = (value) => {
    onChange({ warehouseName: value });
  };

  const handleBlendedTableChange = (value) => {
    onChange({ includeBlendedTable: value });
  };

  // Calculate summary stats
  const totalPlatforms = selectedPlatforms.length;
  let totalDimensions = 0;
  let totalMetrics = 0;

  Object.values(fieldSelections).forEach(selection => {
    totalDimensions += (selection.dimensions || []).length;
    totalMetrics += (selection.metrics || []).length;
  });

  // Collect all selected fields for sample preview
  const allSelectedFields = useMemo(() => {
    const fields = [];
    Object.entries(fieldSelections).forEach(([platformId, selection]) => {
      (selection.dimensions || []).forEach(dim => {
        fields.push({ name: dim, type: 'dimension', platform: platformId });
      });
      (selection.metrics || []).forEach(metric => {
        fields.push({ name: metric, type: 'metric', platform: platformId });
      });
    });
    return fields.slice(0, 8); // Limit to 8 fields for preview
  }, [fieldSelections]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Review & Create Warehouse</h2>
        <p className={styles.description}>
          Review your selections and provide a name for your data warehouse.
        </p>
      </div>

      {/* Warehouse Configuration */}
      <Card className={styles.configCard}>
        <h3 className={styles.sectionTitle}>Warehouse Configuration</h3>

        <WarehouseNameInput
          value={warehouseName}
          onChange={handleWarehouseNameChange}
          placeholder="e.g., Acme Corp Data Warehouse"
        />
        <p className={styles.fieldHelp}>
          Leave blank to use the default naming: &quot;[Client Name] Data Warehouse&quot;
        </p>

        <BlendedTableCheckbox
          checked={includeBlendedTable}
          onChange={handleBlendedTableChange}
          helpText="The Blended_Data table combines all unique fields from your selected platforms into a single unified view."
        />
      </Card>

      {/* Summary Stats */}
      <div className={styles.stats}>
        <Card className={styles.stat}>
          <Icon name="table" size={24} />
          <div className={styles.statContent}>
            <div className={styles.statValue}>{totalPlatforms}</div>
            <div className={styles.statLabel}>
              {totalPlatforms === 1 ? 'Platform' : 'Platforms'}
            </div>
          </div>
        </Card>

        <Card className={styles.stat}>
          <Icon name="tag" size={24} />
          <div className={styles.statContent}>
            <div className={styles.statValue}>{totalDimensions}</div>
            <div className={styles.statLabel}>
              {totalDimensions === 1 ? 'Dimension' : 'Dimensions'}
            </div>
          </div>
        </Card>

        <Card className={styles.stat}>
          <Icon name="chartBar" size={24} />
          <div className={styles.statContent}>
            <div className={styles.statValue}>{totalMetrics}</div>
            <div className={styles.statLabel}>
              {totalMetrics === 1 ? 'Metric' : 'Metrics'}
            </div>
          </div>
        </Card>
      </div>

      {/* Sample Data Preview */}
      {allSelectedFields.length > 0 && (
        <Card className={styles.previewCard}>
          <h3 className={styles.sectionTitle}>Sample Data Preview</h3>
          <p className={styles.fieldHelp}>
            Example of how your data will look with the selected fields
          </p>
          <SampleDataPreview
            fields={allSelectedFields}
            rowCount={3}
            title=""
          />
        </Card>
      )}

      {/* Schema Preview */}
      <SchemaPreview
        platformSchemas={fieldSelections}
        includeBlendedTable={includeBlendedTable}
      />

      {/* What happens next */}
      <Card className={styles.infoCard}>
        <div className={styles.infoHeader}>
          <Icon name="info" size={20} />
          <h3 className={styles.infoTitle}>What happens next?</h3>
        </div>
        <ul className={styles.infoList}>
          <li>A new data warehouse will be configured with your selections</li>
          <li>Each platform will have its own data table with the selected fields</li>
          {includeBlendedTable && <li>A Blended Data table will combine all unique fields</li>}
          <li>You&apos;ll be able to import CSV data and map columns to these fields</li>
          <li>The warehouse will be accessible from the client&apos;s Data Warehouse section</li>
        </ul>
      </Card>
    </div>
  );
}

ReviewStep.propTypes = {
  data: PropTypes.shape({
    selectedPlatforms: PropTypes.arrayOf(PropTypes.string),
    fieldSelections: PropTypes.objectOf(
      PropTypes.shape({
        dimensions: PropTypes.arrayOf(PropTypes.string),
        metrics: PropTypes.arrayOf(PropTypes.string)
      })
    ),
    warehouseName: PropTypes.string,
    includeBlendedTable: PropTypes.bool
  }).isRequired,
  onChange: PropTypes.func.isRequired
};
