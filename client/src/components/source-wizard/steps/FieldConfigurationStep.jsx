import { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { platformApi } from '../../../services/api';
import { useAudio } from '../../../hooks/useAudio';
import FieldSelector from '../../warehouse/FieldSelector';
import Button from '../../common/Button';
import PSXSprite from '../../common/PSXSprite';
import { toTitleCase } from '../../../utils/string';
import styles from './FieldConfigurationStep.module.css';

/**
 * Step 2: Field Configuration
 *
 * Replaces SchemaPreviewStep with the unified FieldSelector component.
 * Users select dimensions and metrics, configure aggregation settings,
 * then approve the configuration to proceed.
 */
export default function FieldConfigurationStep({ data, onChange }) {
  const { playClick } = useAudio();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dimensions, setDimensions] = useState([]);
  const [metrics, setMetrics] = useState([]);

  // Local state for selections
  const [selectedDimensions, setSelectedDimensions] = useState([]);
  const [selectedMetrics, setSelectedMetrics] = useState([]);
  const [aggregation, setAggregation] = useState({
    groupBy: ['date'],
    dateGranularity: 'day'
  });

  // Fetch platform fields on mount
  useEffect(() => {
    const fetchFields = async () => {
      if (!data.selectedPlatform) {
        setError('No platform selected');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [dimsData, metricsData] = await Promise.all([
          platformApi.getDimensions(data.selectedPlatform),
          platformApi.getMetrics(data.selectedPlatform)
        ]);

        const dims = Array.isArray(dimsData) ? dimsData : (dimsData.dimensions || []);
        const mets = Array.isArray(metricsData) ? metricsData : (metricsData.metrics || []);

        setDimensions(dims);
        setMetrics(mets);

        // Auto-select common fields by default
        const commonDimIds = ['date', 'campaign_name', 'ad_set_name', 'ad_name'];
        const availableDims = dims.filter(d => commonDimIds.includes(d.id)).map(d => d.id);
        // Ensure 'date' is always selected if available
        if (dims.some(d => d.id === 'date') && !availableDims.includes('date')) {
          availableDims.unshift('date');
        }
        setSelectedDimensions(availableDims.length > 0 ? availableDims : dims.slice(0, 4).map(d => d.id));

        const commonMetIds = ['impressions', 'clicks', 'spend', 'conversions'];
        const availableMets = mets.filter(m => commonMetIds.includes(m.id)).map(m => m.id);
        setSelectedMetrics(availableMets.length > 0 ? availableMets : mets.slice(0, 4).map(m => m.id));

        // Set initial groupBy with date
        setAggregation({
          groupBy: availableDims.includes('date') ? ['date'] : [],
          dateGranularity: 'day'
        });

      } catch (err) {
        setError(`Failed to load fields: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchFields();
  }, [data.selectedPlatform]);

  // Get platform display name
  const platformName = useMemo(() => {
    return toTitleCase(data.selectedPlatform || '');
  }, [data.selectedPlatform]);

  // Handle dimension selection changes
  const handleDimensionsChange = useCallback((newDimensions) => {
    setSelectedDimensions(newDimensions);
    // Reset schemaApproved when selections change
    if (data.schemaApproved) {
      onChange({ schemaApproved: false });
    }
  }, [data.schemaApproved, onChange]);

  // Handle metric selection changes
  const handleMetricsChange = useCallback((newMetrics) => {
    setSelectedMetrics(newMetrics);
    // Reset schemaApproved when selections change
    if (data.schemaApproved) {
      onChange({ schemaApproved: false });
    }
  }, [data.schemaApproved, onChange]);

  // Handle aggregation changes
  const handleAggregationChange = useCallback((newAggregation) => {
    setAggregation(newAggregation);
    // Reset schemaApproved when aggregation changes
    if (data.schemaApproved) {
      onChange({ schemaApproved: false });
    }
  }, [data.schemaApproved, onChange]);

  // Approve configuration and build schema for Step 3
  const handleApprove = useCallback(() => {
    playClick();
    // Build schema object compatible with Step 3 (WarehouseSelectionStep)
    const schema = {
      platformName,
      platformId: data.selectedPlatform,
      dimensions: dimensions
        .filter(d => selectedDimensions.includes(d.id))
        .map(d => ({
          canonicalId: d.id,
          platformField: d.platformFieldName || d.id,
          selected: true,
          required: d.id === 'date'
        })),
      metrics: metrics
        .filter(m => selectedMetrics.includes(m.id))
        .map(m => ({
          canonicalId: m.id,
          platformField: m.platformFieldName || m.id,
          selected: true,
          hasTransformation: m.hasTransformation || false
        })),
      aggregation: {
        groupBy: aggregation.groupBy,
        dateGranularity: aggregation.dateGranularity
      }
    };

    onChange({
      schema,
      schemaApproved: true,
      // Also store raw selections for warehouse creation
      fieldSelections: {
        [data.selectedPlatform]: {
          dimensions: selectedDimensions,
          metrics: selectedMetrics
        }
      }
    });
  }, [playClick, data.selectedPlatform, platformName, dimensions, metrics, selectedDimensions, selectedMetrics, aggregation, onChange]);

  // Validation: require at least 1 dimension (including date) and 1 metric
  const isValid = selectedDimensions.length > 0 && selectedMetrics.length > 0 && selectedDimensions.includes('date');

  if (loading) {
    return (
      <div className={styles.loading}>
        <PSXSprite sprite="hourglass" size="sm" ariaLabel="Loading" />
        <span>Loading fields for {platformName}...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <PSXSprite sprite="tubeRed" size="sm" ariaLabel="Error" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>{platformName} Configuration</h3>
        <p className={styles.description}>
          Select the dimensions and metrics to include, then configure aggregation settings.
        </p>
      </div>

      <FieldSelector
        platformId={data.selectedPlatform}
        selectedDimensions={selectedDimensions}
        selectedMetrics={selectedMetrics}
        onDimensionsChange={handleDimensionsChange}
        onMetricsChange={handleMetricsChange}
        showAggregation={true}
        aggregation={aggregation}
        onAggregationChange={handleAggregationChange}
        requiredDimensions={['date']}
      />

      <div className={styles.actions}>
        {data.schemaApproved ? (
          <div className={styles.approved}>
            <PSXSprite sprite="coin" size="sm" ariaLabel="Approved" />
            <span>Configuration Approved</span>
          </div>
        ) : (
          <Button
            onClick={handleApprove}
            variant="primary"
            disabled={!isValid}
            title={!isValid ? 'Select at least one dimension (including date) and one metric' : ''}
          >
            <PSXSprite sprite="coin" size="xs" ariaLabel="Approve" />
            Approve Configuration
          </Button>
        )}
      </div>

      {!isValid && !data.schemaApproved && (
        <p className={styles.hint}>
          Select at least one dimension (date is required) and one metric to continue.
        </p>
      )}
    </div>
  );
}

FieldConfigurationStep.propTypes = {
  data: PropTypes.shape({
    clientId: PropTypes.string.isRequired,
    selectedPlatform: PropTypes.string,
    schema: PropTypes.object,
    schemaApproved: PropTypes.bool,
    fieldSelections: PropTypes.object
  }).isRequired,
  onChange: PropTypes.func.isRequired
};
