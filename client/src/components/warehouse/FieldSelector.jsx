import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { platformApi } from '../../services/api';
import Card from '../common/Card';
import Icon from '../common/Icon';
import Button from '../common/Button';
import PSXSprite from '../common/PSXSprite';
import ErrorMessage from '../common/ErrorMessage';
import { AggregationControls } from './shared';
import styles from './FieldSelector.module.css';

/**
 * Field selector component for choosing dimensions and metrics
 * Two-column layout with category grouping and "Select All Common Fields" preset
 * Optionally includes aggregation controls (groupBy, dateGranularity)
 */
export default function FieldSelector({
  platformId,
  selectedDimensions = [],
  selectedMetrics = [],
  onDimensionsChange,
  onMetricsChange,
  // Aggregation props (optional - for Source Wizard)
  showAggregation = false,
  aggregation = { groupBy: ['date'], dateGranularity: 'day' },
  onAggregationChange,
  requiredDimensions = ['date'],
  // Availability indicators (optional - for warehouse sub-wizard)
  availableFields = null,  // Array of field IDs that exist in current data source(s)
  recommendedFields = null, // Array of field IDs from Step 2 selections (for highlighting)
}) {
  const [dimensions, setDimensions] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Categories start collapsed (empty Sets) - user expands as needed
  const [expandedDimCategories, setExpandedDimCategories] = useState(new Set());
  const [expandedMetCategories, setExpandedMetCategories] = useState(new Set());

  const loadFields = useCallback(async () => {
    if (!platformId) return;
    try {
      setLoading(true);
      setError(null);
      const [dimsData, metricsData] = await Promise.all([
        platformApi.getDimensions(platformId),
        platformApi.getMetrics(platformId)
      ]);

      // API returns array directly, not wrapped in object
      setDimensions(Array.isArray(dimsData) ? dimsData : (dimsData.dimensions || []));
      setMetrics(Array.isArray(metricsData) ? metricsData : (metricsData.metrics || []));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [platformId]);

  useEffect(() => {
    loadFields();
  }, [loadFields]);

  const toggleDimCategory = (category) => {
    setExpandedDimCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const toggleMetCategory = (category) => {
    setExpandedMetCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const toggleDimension = (dimensionId) => {
    // Don't allow deselecting required dimensions
    if (requiredDimensions.includes(dimensionId) && selectedDimensions.includes(dimensionId)) {
      return;
    }

    const newSelection = selectedDimensions.includes(dimensionId)
      ? selectedDimensions.filter(id => id !== dimensionId)
      : [...selectedDimensions, dimensionId];
    onDimensionsChange(newSelection);

    // If deselecting a dimension, also remove it from groupBy
    if (showAggregation && onAggregationChange && selectedDimensions.includes(dimensionId)) {
      const newGroupBy = aggregation.groupBy.filter(id => id !== dimensionId);
      onAggregationChange({ ...aggregation, groupBy: newGroupBy });
    }
  };

  const toggleMetric = (metricId) => {
    const newSelection = selectedMetrics.includes(metricId)
      ? selectedMetrics.filter(id => id !== metricId)
      : [...selectedMetrics, metricId];
    onMetricsChange(newSelection);
  };

  const selectCommonFields = () => {
    // Common dimensions: date, campaign_name, ad_set_name, ad_name
    const commonDimIds = ['date', 'campaign_name', 'ad_set_name', 'ad_name'];
    const availableCommonDims = dimensions
      .filter(d => commonDimIds.includes(d.id))
      .map(d => d.id);

    // Common metrics: impressions, clicks, spend, conversions
    const commonMetIds = ['impressions', 'clicks', 'spend', 'conversions'];
    const availableCommonMets = metrics
      .filter(m => commonMetIds.includes(m.id))
      .map(m => m.id);

    onDimensionsChange(availableCommonDims);
    onMetricsChange(availableCommonMets);

    // Also set common groupBy if aggregation is enabled
    if (showAggregation && onAggregationChange) {
      onAggregationChange({
        ...aggregation,
        groupBy: availableCommonDims.filter(id => ['date', 'campaign_name'].includes(id))
      });
    }
  };

  // Handlers for aggregation changes
  const handleGroupByChange = (newGroupBy) => {
    if (onAggregationChange) {
      onAggregationChange({ ...aggregation, groupBy: newGroupBy });
    }
  };

  const handleDateGranularityChange = (newGranularity) => {
    if (onAggregationChange) {
      onAggregationChange({ ...aggregation, dateGranularity: newGranularity });
    }
  };

  // Get selected dimension objects for AggregationControls
  const selectedDimensionObjects = dimensions.filter(d =>
    selectedDimensions.includes(d.id)
  );

  if (loading) {
    return <div className={styles.loading}>Loading fields for platform...</div>;
  }

  if (error) {
    return (
      <ErrorMessage
        error={error}
        variant="card"
        title="Failed to Load Fields"
        onRetry={loadFields}
      />
    );
  }

  // Group fields by category
  const dimensionsByCategory = dimensions.reduce((acc, dim) => {
    if (!acc[dim.category]) {
      acc[dim.category] = [];
    }
    acc[dim.category].push(dim);
    return acc;
  }, {});

  const metricsByCategory = metrics.reduce((acc, met) => {
    if (!acc[met.category]) {
      acc[met.category] = [];
    }
    acc[met.category].push(met);
    return acc;
  }, {});

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Select Fields for Data Warehouse</h3>
        <Button
          variant="secondary"
          size="sm"
          onClick={selectCommonFields}
        >
          Select Common Fields
        </Button>
      </div>

      <div className={styles.columns}>
        {/* Dimensions Column */}
        <div className={styles.column}>
          <div className={styles.columnHeader}>
            <Icon name="tag" size={16} />
            <h4>Dimensions</h4>
            <span className={styles.count}>
              {selectedDimensions.length} / {dimensions.length}
            </span>
          </div>

          <div className={styles.fieldList}>
            {Object.entries(dimensionsByCategory).map(([category, categoryDimensions]) => {
              const isExpanded = expandedDimCategories.has(category);
              const selectedCount = categoryDimensions.filter(d =>
                selectedDimensions.includes(d.id)
              ).length;

              return (
                <Card key={category} className={styles.categoryCard}>
                  <button
                    type="button"
                    className={styles.categoryToggle}
                    onClick={() => toggleDimCategory(category)}
                    aria-expanded={isExpanded}
                  >
                    <Icon
                      name={isExpanded ? 'chevronDown' : 'chevronRight'}
                      size={16}
                    />
                    <span className={styles.categoryName}>{category}</span>
                    <span className={styles.categoryBadge}>
                      {selectedCount > 0 && `${selectedCount} / `}{categoryDimensions.length}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className={styles.fields}>
                      {categoryDimensions.map(dimension => {
                        const isSelected = selectedDimensions.includes(dimension.id);
                        const isUnavailable = availableFields && !availableFields.includes(dimension.id);
                        const isRecommended = recommendedFields?.includes(dimension.id);

                        return (
                          <label
                            key={dimension.id}
                            className={`${styles.field} ${isSelected ? styles.selected : ''} ${isUnavailable ? styles.unavailable : ''} ${isRecommended ? styles.recommended : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleDimension(dimension.id)}
                              className={styles.checkbox}
                            />
                            <div className={styles.fieldInfo}>
                              <div className={styles.fieldName}>
                                {dimension.name}
                                {isUnavailable && (
                                  <PSXSprite sprite="heartYellow" size="xs" ariaLabel="Not in source data" />
                                )}
                              </div>
                              {dimension.platformFieldName && (
                                <div className={styles.platformName}>
                                  {dimension.platformFieldName}
                                </div>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        {/* Metrics Column */}
        <div className={styles.column}>
          <div className={styles.columnHeader}>
            <Icon name="chartBar" size={16} />
            <h4>Metrics</h4>
            <span className={styles.count}>
              {selectedMetrics.length} / {metrics.length}
            </span>
          </div>

          <div className={styles.fieldList}>
            {Object.entries(metricsByCategory).map(([category, categoryMetrics]) => {
              const isExpanded = expandedMetCategories.has(category);
              const selectedCount = categoryMetrics.filter(m =>
                selectedMetrics.includes(m.id)
              ).length;

              return (
                <Card key={category} className={styles.categoryCard}>
                  <button
                    type="button"
                    className={styles.categoryToggle}
                    onClick={() => toggleMetCategory(category)}
                    aria-expanded={isExpanded}
                  >
                    <Icon
                      name={isExpanded ? 'chevronDown' : 'chevronRight'}
                      size={16}
                    />
                    <span className={styles.categoryName}>{category}</span>
                    <span className={styles.categoryBadge}>
                      {selectedCount > 0 && `${selectedCount} / `}{categoryMetrics.length}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className={styles.fields}>
                      {categoryMetrics.map(metric => {
                        const isSelected = selectedMetrics.includes(metric.id);
                        const isUnavailable = availableFields && !availableFields.includes(metric.id);
                        const isRecommended = recommendedFields?.includes(metric.id);

                        return (
                          <label
                            key={metric.id}
                            className={`${styles.field} ${isSelected ? styles.selected : ''} ${isUnavailable ? styles.unavailable : ''} ${isRecommended ? styles.recommended : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleMetric(metric.id)}
                              className={styles.checkbox}
                            />
                            <div className={styles.fieldInfo}>
                              <div className={styles.fieldName}>
                                {metric.name}
                                {isUnavailable && (
                                  <PSXSprite sprite="heartYellow" size="xs" ariaLabel="Not in source data" />
                                )}
                              </div>
                              {metric.platformFieldName && (
                                <div className={styles.platformName}>
                                  {metric.platformFieldName}
                                </div>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Aggregation Controls (optional) */}
      {showAggregation && (
        <AggregationControls
          selectedDimensions={selectedDimensionObjects}
          groupBy={aggregation.groupBy}
          dateGranularity={aggregation.dateGranularity}
          onGroupByChange={handleGroupByChange}
          onDateGranularityChange={handleDateGranularityChange}
          requiredGroupBy={requiredDimensions}
        />
      )}
    </div>
  );
}

FieldSelector.propTypes = {
  /** Platform ID to load dimensions/metrics for */
  platformId: PropTypes.string.isRequired,
  /** Currently selected dimension IDs */
  selectedDimensions: PropTypes.arrayOf(PropTypes.string),
  /** Currently selected metric IDs */
  selectedMetrics: PropTypes.arrayOf(PropTypes.string),
  /** Callback when dimension selection changes */
  onDimensionsChange: PropTypes.func.isRequired,
  /** Callback when metric selection changes */
  onMetricsChange: PropTypes.func.isRequired,
  /** Whether to show aggregation controls (default: false) */
  showAggregation: PropTypes.bool,
  /** Aggregation settings { groupBy: string[], dateGranularity: 'day'|'week'|'month' } */
  aggregation: PropTypes.shape({
    groupBy: PropTypes.arrayOf(PropTypes.string),
    dateGranularity: PropTypes.oneOf(['day', 'week', 'month']),
  }),
  /** Callback when aggregation settings change */
  onAggregationChange: PropTypes.func,
  /** Dimension IDs that cannot be deselected (e.g., ['date']) */
  requiredDimensions: PropTypes.arrayOf(PropTypes.string),
  /** Array of field IDs that exist in current data source(s) - for availability indicators */
  availableFields: PropTypes.arrayOf(PropTypes.string),
  /** Array of field IDs from Step 2 selections - for recommended highlighting */
  recommendedFields: PropTypes.arrayOf(PropTypes.string),
};
