import { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import Card from '../common/Card';
import Icon from '../common/Icon';
import PSXSprite from '../common/PSXSprite';
import { KPICard, BarChartViz, LineChartViz, PieChartViz } from './visualizations';
import { reportsApi } from '../../services/api';
import styles from './VizPreview.module.css';

/**
 * VizPreview
 *
 * Live data preview for visualization configuration.
 * Fetches preview data on config change (debounced).
 */
export default function VizPreview({
  vizConfig,
  reportId,
  warehouseId,
  debounceMs = 500,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const timeoutRef = useRef(null);

  // Check if config is valid for preview
  const isValidConfig = useCallback(() => {
    if (!vizConfig?.type || !warehouseId) return false;

    if (vizConfig.type === 'kpi') {
      return Boolean(vizConfig.metric);
    } else {
      return vizConfig.metrics && vizConfig.metrics.length > 0;
    }
  }, [vizConfig, warehouseId]);

  // Fetch preview data
  const fetchPreview = useCallback(async () => {
    if (!isValidConfig() || !reportId) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const previewData = await reportsApi.getVizPreview(reportId, {
        type: vizConfig.type,
        metric: vizConfig.metric,
        metrics: vizConfig.metrics,
        dimensions: vizConfig.dimensions,
        dateRange: vizConfig.dateRange || 'last_30_days',
        customStartDate: vizConfig.customStartDate,
        customEndDate: vizConfig.customEndDate,
        filters: vizConfig.filters,
        warehouseId,
      });
      setData(previewData);
    } catch (err) {
      setError(err.message || 'Failed to load preview');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [reportId, vizConfig, warehouseId, isValidConfig]);

  // Debounced fetch on config change
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(fetchPreview, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [fetchPreview, debounceMs]);

  // Render loading state
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <PSXSprite sprite="hourglass" size="md" animation="spin" />
          <span>Loading preview...</span>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <Icon name="alert" size={24} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  // Render empty state (no valid config)
  if (!isValidConfig()) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <Icon name="chartBar" size={24} />
          <span>Select {vizConfig?.type === 'kpi' ? 'a metric' : 'metrics'} to see preview</span>
        </div>
      </div>
    );
  }

  // Render no data state
  if (!data) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <Icon name="eye" size={24} />
          <span>Waiting for preview data...</span>
        </div>
      </div>
    );
  }

  // Render visualization based on type
  return (
    <div className={styles.container}>
      <Card className={styles.previewCard}>
        {vizConfig.type === 'kpi' && (
          <KPICard
            title={vizConfig.title || 'KPI Preview'}
            value={data.value || 0}
            previousValue={data.previousValue}
            format={vizConfig.format || 'number'}
            showTrend={vizConfig.showTrend !== false}
          />
        )}

        {vizConfig.type === 'bar' && (
          <BarChartViz
            title={vizConfig.title || 'Bar Chart Preview'}
            data={data.chartData || []}
            xAxisKey={data.xAxisKey || 'name'}
            yAxisKeys={data.yAxisKeys || vizConfig.metrics || []}
            height={200}
            valueFormat={vizConfig.format || 'number'}
          />
        )}

        {vizConfig.type === 'line' && (
          <LineChartViz
            title={vizConfig.title || 'Line Chart Preview'}
            data={data.chartData || []}
            xAxisKey={data.xAxisKey || 'date'}
            yAxisKeys={data.yAxisKeys || vizConfig.metrics || []}
            height={200}
            valueFormat={vizConfig.format || 'number'}
          />
        )}

        {vizConfig.type === 'pie' && (
          <PieChartViz
            title={vizConfig.title || 'Pie Chart Preview'}
            data={data.chartData || []}
            nameKey={data.nameKey || 'name'}
            valueKey={data.valueKey || 'value'}
            height={200}
            valueFormat={vizConfig.format || 'number'}
          />
        )}
      </Card>
    </div>
  );
}

VizPreview.propTypes = {
  /** Current visualization configuration */
  vizConfig: PropTypes.shape({
    type: PropTypes.oneOf(['kpi', 'bar', 'line', 'pie']),
    title: PropTypes.string,
    metric: PropTypes.string,
    metrics: PropTypes.arrayOf(PropTypes.string),
    dimensions: PropTypes.arrayOf(PropTypes.string),
    format: PropTypes.string,
    showTrend: PropTypes.bool,
    dateRange: PropTypes.string,
    customStartDate: PropTypes.string,
    customEndDate: PropTypes.string,
    filters: PropTypes.array,
  }),
  /** Report ID for fetching data */
  reportId: PropTypes.string,
  /** Warehouse ID for data context */
  warehouseId: PropTypes.string,
  /** Debounce time for API calls in ms */
  debounceMs: PropTypes.number,
};
