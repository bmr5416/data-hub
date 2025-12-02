import { useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useAudio } from '../../../hooks/useAudio';
import Card from '../../common/Card';
import Button from '../../common/Button';
import Icon from '../../common/Icon';
import PSXSprite from '../../common/PSXSprite';
import Modal from '../../common/Modal';
import VizFieldSelector from '../VizFieldSelector';
import DateRangeSelector from '../DateRangeSelector';
import FilterBuilder from '../FilterBuilder';
import VizPreview from '../VizPreview';
import { KPICard } from '../visualizations';
import styles from './VisualizationStep.module.css';

/**
 * Visualization Step
 *
 * Step 2 of the Report Builder wizard.
 * Allows adding KPI cards and charts to the report.
 * Uses VizFieldSelector, DateRangeSelector, FilterBuilder, and VizPreview
 * to match ReportDetailModal's visualization configuration pattern.
 */
export default function VisualizationStep({ data, onChange }) {
  const {
    visualizations = [],
    warehouseId,
    availableWarehouses = [],
  } = data;

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingViz, setEditingViz] = useState(null);
  const [vizType, setVizType] = useState(null);
  const [vizConfig, setVizConfig] = useState({});
  const [titleError, setTitleError] = useState('');
  const { playClick } = useAudio();

  // Get selected warehouse
  const selectedWarehouse = useMemo(() => {
    return availableWarehouses.find((w) => w.id === warehouseId);
  }, [availableWarehouses, warehouseId]);

  // Get available fields from warehouse (separate dimensions/metrics)
  const availableFields = useMemo(() => {
    if (!selectedWarehouse?.fieldSelections) {
      return { dimensions: [], metrics: [] };
    }

    const dimensionSet = new Set();
    const metricSet = new Set();

    Object.values(selectedWarehouse.fieldSelections).forEach((platformFields) => {
      (platformFields.dimensions || []).forEach((d) => dimensionSet.add(d));
      (platformFields.metrics || []).forEach((m) => metricSet.add(m));
    });

    return {
      dimensions: Array.from(dimensionSet).map((id) => ({ id, name: id })),
      metrics: Array.from(metricSet).map((id) => ({ id, name: id })),
    };
  }, [selectedWarehouse]);

  const handleAddVisualization = useCallback((type) => {
    playClick();
    setVizType(type);
    setVizConfig({
      type,
      title: '',
      metric: null,
      dimensions: [],
      metrics: [],
      format: 'number',
      showTrend: true,
      dateRange: 'last_30_days',
      customStartDate: '',
      customEndDate: '',
      filters: [],
    });
    setShowAddModal(true);
  }, [playClick]);

  const handleEditVisualization = useCallback((viz, index) => {
    playClick();
    setEditingViz(index);
    setVizType(viz.type);
    setVizConfig({ ...viz });
    setShowAddModal(true);
  }, [playClick]);

  const handleRemoveVisualization = useCallback(
    (index) => {
      playClick();
      const newVisualizations = visualizations.filter((_, i) => i !== index);
      onChange({ visualizations: newVisualizations });
    },
    [playClick, visualizations, onChange]
  );

  const MAX_TITLE_LENGTH = 100;

  const validateTitle = useCallback((title) => {
    if (!title?.trim()) {
      return 'Title is required';
    }
    if (title.length > MAX_TITLE_LENGTH) {
      return `Title must be ${MAX_TITLE_LENGTH} characters or less`;
    }
    return '';
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowAddModal(false);
    setEditingViz(null);
    setVizType(null);
    setVizConfig({});
    setTitleError('');
  }, []);

  const handleSaveVisualization = useCallback(() => {
    const error = validateTitle(vizConfig.title);
    if (error) {
      setTitleError(error);
      return;
    }

    // Validate metric/dimensions based on type
    if (vizType === 'kpi' && !vizConfig.metric) {
      return; // Metric required for KPI
    }
    if (vizType !== 'kpi' && (!vizConfig.metrics || vizConfig.metrics.length === 0)) {
      return; // At least one metric required for charts
    }

    const newViz = {
      id: editingViz !== null ? visualizations[editingViz].id : `viz-${Date.now()}`,
      ...vizConfig,
      title: vizConfig.title.trim(),
    };

    let newVisualizations;
    if (editingViz !== null) {
      newVisualizations = [...visualizations];
      newVisualizations[editingViz] = newViz;
    } else {
      newVisualizations = [...visualizations, newViz];
    }

    onChange({ visualizations: newVisualizations });
    handleCloseModal();
  }, [vizConfig, vizType, editingViz, visualizations, onChange, validateTitle, handleCloseModal]);

  const vizTypeOptions = [
    { type: 'kpi', label: 'KPI Card', icon: 'coin', description: 'Single metric with trend' },
    { type: 'bar', label: 'Bar Chart', icon: 'chartBar', description: 'Compare categories' },
    { type: 'line', label: 'Line Chart', icon: 'activity', description: 'Trends over time' },
    { type: 'pie', label: 'Pie Chart', icon: 'pieChart', description: 'Part of whole' },
  ];

  const formatOptions = [
    { value: 'number', label: 'Number' },
    { value: 'currency', label: 'Currency ($)' },
    { value: 'percentage', label: 'Percentage (%)' },
    { value: 'compact', label: 'Compact (1K, 1M)' },
  ];

  const canSave = vizConfig.title?.trim() && (
    (vizType === 'kpi' && vizConfig.metric) ||
    (vizType !== 'kpi' && vizConfig.metrics?.length > 0)
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Add Visualizations</h3>
        <p className={styles.description}>
          Build your report by adding KPI cards and charts.
        </p>
      </div>

      {/* Add Visualization Buttons */}
      <div className={styles.addButtons} role="group" aria-label="Add visualization options">
        {vizTypeOptions.map((option) => (
          <button
            key={option.type}
            type="button"
            className={styles.addButton}
            onClick={() => handleAddVisualization(option.type)}
            aria-describedby={`viz-desc-${option.type}`}
          >
            {option.icon === 'coin' ? (
              <PSXSprite sprite="coin" size="sm" aria-hidden="true" />
            ) : (
              <Icon name={option.icon} size={20} aria-hidden="true" />
            )}
            <span className={styles.addButtonLabel}>{option.label}</span>
            <span id={`viz-desc-${option.type}`} className={styles.addButtonDesc}>{option.description}</span>
          </button>
        ))}
      </div>

      {/* Visualization List */}
      {visualizations.length > 0 ? (
        <Card className={styles.vizList}>
          <h4 id="viz-list-heading" className={styles.sectionTitle}>
            Report Layout ({visualizations.length} items)
          </h4>
          <ul className={styles.vizGrid} aria-labelledby="viz-list-heading">
            {visualizations.map((viz, index) => (
              <li key={viz.id} className={styles.vizItem}>
                <div className={styles.vizPreview}>
                  {viz.type === 'kpi' ? (
                    <KPICard
                      title={viz.title}
                      value={1234}
                      format={viz.format}
                      showTrend={viz.showTrend}
                    />
                  ) : (
                    <div className={styles.chartPlaceholder}>
                      <Icon
                        name={
                          viz.type === 'bar'
                            ? 'chartBar'
                            : viz.type === 'line'
                              ? 'activity'
                              : 'pieChart'
                        }
                        size={32}
                        aria-hidden="true"
                      />
                      <span>{viz.title}</span>
                    </div>
                  )}
                </div>
                <div className={styles.vizActions} role="group" aria-label={`Actions for ${viz.title}`}>
                  <button
                    type="button"
                    className={styles.vizAction}
                    onClick={() => handleEditVisualization(viz, index)}
                    aria-label={`Edit ${viz.title}`}
                  >
                    <Icon name="edit" size={14} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className={styles.vizAction}
                    onClick={() => handleRemoveVisualization(index)}
                    aria-label={`Remove ${viz.title}`}
                  >
                    <Icon name="trash" size={14} aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <div className={styles.emptyState} role="status">
          <PSXSprite sprite="star" size="lg" aria-hidden="true" />
          <h4 className={styles.emptyTitle}>No Visualizations Yet</h4>
          <p className={styles.emptyText}>
            Click a button above to add your first KPI card or chart.
          </p>
        </div>
      )}

      {/* Add/Edit Visualization Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={handleCloseModal}
          title={editingViz !== null ? 'Edit Visualization' : `Add ${vizTypeOptions.find(v => v.type === vizType)?.label}`}
          size="lg"
        >
          <div className={styles.modalContent}>
            {/* Basic Info Section */}
            <div className={styles.vizSection}>
              <h4 className={styles.vizSectionTitle}>Basic Info</h4>

              {/* Title Input */}
              <div className={styles.field}>
                <label htmlFor="viz-title" className={styles.label}>
                  Title <span className={styles.required}>*</span>
                </label>
                <input
                  id="viz-title"
                  type="text"
                  className={`${styles.input} ${titleError ? styles.inputError : ''}`}
                  placeholder="Enter visualization title..."
                  value={vizConfig.title || ''}
                  onChange={(e) => {
                    setVizConfig((prev) => ({ ...prev, title: e.target.value }));
                    if (titleError) setTitleError('');
                  }}
                  maxLength={MAX_TITLE_LENGTH + 10}
                  aria-describedby={titleError ? 'title-error title-hint' : 'title-hint'}
                  aria-invalid={titleError ? 'true' : undefined}
                  aria-required="true"
                />
                <span id="title-hint" className={styles.charCount}>
                  {(vizConfig.title || '').length}/{MAX_TITLE_LENGTH}
                </span>
                {titleError && (
                  <p id="title-error" className={styles.fieldError} role="alert">
                    {titleError}
                  </p>
                )}
              </div>

              {/* Format Selection */}
              <div className={styles.field}>
                <label htmlFor="viz-format" className={styles.label}>Format</label>
                <select
                  id="viz-format"
                  className={styles.select}
                  value={vizConfig.format || 'number'}
                  onChange={(e) =>
                    setVizConfig((prev) => ({ ...prev, format: e.target.value }))
                  }
                >
                  {formatOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Show trend checkbox (KPI only) */}
              {vizType === 'kpi' && (
                <div className={styles.checkboxField}>
                  <input
                    id="viz-show-trend"
                    type="checkbox"
                    checked={vizConfig.showTrend !== false}
                    onChange={(e) =>
                      setVizConfig((prev) => ({ ...prev, showTrend: e.target.checked }))
                    }
                  />
                  <label htmlFor="viz-show-trend" className={styles.checkboxLabel}>
                    Show trend indicator
                  </label>
                </div>
              )}
            </div>

            {/* Data Selection Section */}
            <div className={styles.vizSection}>
              <h4 className={styles.vizSectionTitle}>Data Selection</h4>
              <div className={styles.fieldColumns}>
                {/* Metrics Selection */}
                <VizFieldSelector
                  fields={availableFields.metrics}
                  selectedFields={
                    vizType === 'kpi'
                      ? vizConfig.metric ? [vizConfig.metric] : []
                      : vizConfig.metrics || []
                  }
                  onChange={(fields) => {
                    if (vizType === 'kpi') {
                      setVizConfig((prev) => ({ ...prev, metric: fields[0] || null }));
                    } else {
                      setVizConfig((prev) => ({ ...prev, metrics: fields }));
                    }
                  }}
                  mode="metrics"
                  singleSelect={vizType === 'kpi'}
                  label={vizType === 'kpi' ? 'Metric *' : 'Metrics'}
                />

                {/* Dimensions Selection (charts only) */}
                {vizType !== 'kpi' && (
                  <VizFieldSelector
                    fields={availableFields.dimensions}
                    selectedFields={vizConfig.dimensions || []}
                    onChange={(fields) =>
                      setVizConfig((prev) => ({ ...prev, dimensions: fields }))
                    }
                    mode="dimensions"
                    label="Group By"
                  />
                )}
              </div>
            </div>

            {/* Date Range Section */}
            <div className={styles.vizSection}>
              <h4 className={styles.vizSectionTitle}>Date Range</h4>
              <DateRangeSelector
                value={vizConfig.dateRange || 'last_30_days'}
                customStart={vizConfig.customStartDate || ''}
                customEnd={vizConfig.customEndDate || ''}
                onChange={({ dateRange, customStartDate, customEndDate }) =>
                  setVizConfig((prev) => ({
                    ...prev,
                    dateRange,
                    customStartDate,
                    customEndDate,
                  }))
                }
              />
            </div>

            {/* Filters Section */}
            <div className={styles.vizSection}>
              <h4 className={styles.vizSectionTitle}>Filters</h4>
              <FilterBuilder
                filters={vizConfig.filters || []}
                availableFields={availableFields.dimensions}
                onChange={(filters) =>
                  setVizConfig((prev) => ({ ...prev, filters }))
                }
              />
            </div>

            {/* Preview Section */}
            <div className={styles.vizSection}>
              <h4 className={styles.vizSectionTitle}>Preview</h4>
              <VizPreview
                vizConfig={vizConfig}
                warehouseId={warehouseId}
              />
            </div>

            {/* Modal Actions */}
            <div className={styles.modalActions}>
              <Button variant="secondary" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveVisualization}
                disabled={!canSave}
              >
                {editingViz !== null ? 'Save Changes' : 'Add to Report'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

VisualizationStep.propTypes = {
  data: PropTypes.shape({
    visualizations: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        type: PropTypes.oneOf(['kpi', 'bar', 'line', 'pie']),
        title: PropTypes.string,
        metric: PropTypes.string,
        dimensions: PropTypes.arrayOf(PropTypes.string),
        metrics: PropTypes.arrayOf(PropTypes.string),
        format: PropTypes.string,
        showTrend: PropTypes.bool,
        dateRange: PropTypes.string,
        customStartDate: PropTypes.string,
        customEndDate: PropTypes.string,
        filters: PropTypes.array,
      })
    ),
    warehouseId: PropTypes.string,
    availableWarehouses: PropTypes.array,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
};
