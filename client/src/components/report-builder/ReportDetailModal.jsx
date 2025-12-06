import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import Button from '../common/Button';
import Icon from '../common/Icon';
import PSXSprite from '../common/PSXSprite';
import Modal from '../common/Modal';
import VizFieldSelector from './VizFieldSelector';
import DateRangeSelector from './DateRangeSelector';
import FilterBuilder from './FilterBuilder';
import VizPreview from './VizPreview';
import { OverviewTab, VisualizationsTab, ScheduleTab, DeliveryTab, AlertsTab } from './tabs';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useNotification } from '../../hooks/useNotification';
import { capitalize } from '../../utils/string';
import { reportsApi, warehouseApi } from '../../services/api';
import styles from './ReportDetailModal.module.css';

/**
 * Report Detail Modal
 *
 * Modal for viewing and managing report details.
 * Shows visualizations preview, schedule info, and allows edit/delete operations.
 */
export default function ReportDetailModal({
  report,
  loading,
  onClose,
  onUpdate,
  onDelete,
  onSendTest,
  onSendNow,
}) {
  const { showError } = useNotification();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [sendResult, setSendResult] = useState(null);

  // Alerts state
  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [alertFormData, setAlertFormData] = useState({
    type: 'metric_threshold',
    metric: '',
    condition: 'gt',
    threshold: '',
    changePercent: '',
    period: 'wow',
    maxHoursStale: '24',
    platformId: '',
    isActive: true,
  });

  // Visualization editing state
  const [showVizModal, setShowVizModal] = useState(false);
  const [editingVizIndex, setEditingVizIndex] = useState(null);
  const [vizType, setVizType] = useState(null);
  const [vizConfig, setVizConfig] = useState({});
  const [vizTitleError, setVizTitleError] = useState('');

  // Warehouse state for field selection
  const [warehouseData, setWarehouseData] = useState(null);
  const [warehouseLoading, setWarehouseLoading] = useState(false);

  // Initialize edited name when report loads
  useEffect(() => {
    if (report?.name) {
      setEditedName(report.name);
    }
  }, [report?.name]);

  // Fetch warehouse data when report loads
  useEffect(() => {
    async function loadWarehouse() {
      if (!report?.warehouseId) {
        setWarehouseData(null);
        return;
      }
      setWarehouseLoading(true);
      try {
        const response = await warehouseApi.get(report.warehouseId);
        setWarehouseData(response.warehouse || response);
      } catch (error) {
        showError(error.message || 'Failed to load warehouse data');
        setWarehouseData(null);
      } finally {
        setWarehouseLoading(false);
      }
    }
    loadWarehouse();
  }, [report?.warehouseId, showError]);


  // Extract available fields from warehouse
  const availableFields = useMemo(() => {
    if (!warehouseData?.fieldSelections) {
      return { dimensions: [], metrics: [] };
    }

    const dimensionSet = new Set();
    const metricSet = new Set();

    Object.values(warehouseData.fieldSelections).forEach((platformFields) => {
      (platformFields.dimensions || []).forEach((d) => dimensionSet.add(d));
      (platformFields.metrics || []).forEach((m) => metricSet.add(m));
    });

    return {
      dimensions: Array.from(dimensionSet).map((id) => ({ id, name: id })),
      metrics: Array.from(metricSet).map((id) => ({ id, name: id })),
    };
  }, [warehouseData]);

  // Handle escape key for sub-states (base Modal handles final close)
  useEscapeKey({
    enabled: !!report,
    handlers: [
      // Viz modal first - closes nested modal before parent states
      [showVizModal, () => {
        setShowVizModal(false);
        setEditingVizIndex(null);
        setVizType(null);
        setVizConfig({});
        setVizTitleError('');
      }],
      [confirmDelete, () => setConfirmDelete(false)],
      [isEditing, () => setIsEditing(false)],
    ],
    // No fallback - base Modal handles close
  });

  const handleSave = useCallback(async () => {
    if (editedName.trim() && editedName !== report?.name) {
      await onUpdate({ name: editedName.trim() });
    }
    setIsEditing(false);
  }, [editedName, report?.name, onUpdate]);

  const handleDelete = useCallback(async () => {
    if (confirmDelete) {
      await onDelete();
      onClose();
    } else {
      setConfirmDelete(true);
    }
  }, [confirmDelete, onDelete, onClose]);

  const handleSendTest = useCallback(async () => {
    if (!testEmail.trim() || !onSendTest) return;

    setSendingTest(true);
    setSendResult(null);

    try {
      await onSendTest(testEmail.trim());
      setSendResult({ success: true, message: 'Test email sent successfully!' });
      setTestEmail('');
    } catch (error) {
      setSendResult({ success: false, message: error.message });
    } finally {
      setSendingTest(false);
    }
  }, [testEmail, onSendTest]);

  const handleSendNow = useCallback(async () => {
    if (!onSendNow) return;

    try {
      await onSendNow();
      setSendResult({ success: true, message: 'Report sent successfully!' });
    } catch (error) {
      setSendResult({ success: false, message: error.message });
    }
  }, [onSendNow]);

  // Fetch alerts when alerts tab is opened
  const fetchAlerts = useCallback(async () => {
    if (!report?.id) return;
    setAlertsLoading(true);
    try {
      const response = await reportsApi.getAlerts(report.id);
      setAlerts(response.alerts || []);
    } catch (error) {
      showError(error.message || 'Failed to load alerts');
      setAlerts([]);
    } finally {
      setAlertsLoading(false);
    }
  }, [report?.id, showError]);

  useEffect(() => {
    if (activeTab === 'alerts' && report?.id) {
      fetchAlerts();
    }
  }, [activeTab, report?.id, fetchAlerts]);

  const handleCreateAlert = useCallback(async () => {
    if (!report?.id) return;

    const alertData = {
      alertType: alertFormData.type,
      isActive: alertFormData.isActive,
    };

    // Build config based on alert type and generate name
    if (alertFormData.type === 'metric_threshold') {
      alertData.config = {
        metric: alertFormData.metric,
        condition: alertFormData.condition,
        threshold: parseFloat(alertFormData.threshold),
      };
      alertData.name = `${alertFormData.metric} ${alertFormData.condition} ${alertFormData.threshold}`;
    } else if (alertFormData.type === 'trend_detection') {
      alertData.config = {
        metric: alertFormData.metric,
        changePercent: parseFloat(alertFormData.changePercent),
        period: alertFormData.period,
      };
      alertData.name = `${alertFormData.metric} trend ${alertFormData.changePercent}% ${alertFormData.period}`;
    } else if (alertFormData.type === 'data_freshness') {
      alertData.config = {
        maxHoursStale: parseInt(alertFormData.maxHoursStale, 10),
        platformId: alertFormData.platformId || undefined,
      };
      alertData.name = `Data freshness ${alertFormData.maxHoursStale}h${alertFormData.platformId ? ` (${alertFormData.platformId})` : ''}`;
    }

    try {
      await reportsApi.createAlert(report.id, alertData);
      await fetchAlerts();
      setShowAlertForm(false);
      setAlertFormData({
        type: 'metric_threshold',
        metric: '',
        condition: 'gt',
        threshold: '',
        changePercent: '',
        period: 'wow',
        maxHoursStale: '24',
        platformId: '',
        isActive: true,
      });
    } catch (error) {
      showError(error.message || 'Failed to create alert');
    }
  }, [report?.id, alertFormData, fetchAlerts, showError]);

  const handleToggleAlert = useCallback(async (alertId, currentActive) => {
    if (!report?.id) return;
    try {
      await reportsApi.updateAlert(report.id, alertId, { isActive: !currentActive });
      await fetchAlerts();
    } catch (error) {
      showError(error.message || 'Failed to update alert');
    }
  }, [report?.id, fetchAlerts, showError]);

  const handleDeleteAlert = useCallback(async (alertId) => {
    if (!report?.id) return;
    try {
      await reportsApi.deleteAlert(report.id, alertId);
      await fetchAlerts();
    } catch (error) {
      showError(error.message || 'Failed to delete alert');
    }
  }, [report?.id, fetchAlerts, showError]);

  // Visualization CRUD handlers
  const handleAddViz = useCallback((type) => {
    setVizType(type);
    setVizConfig({
      type,
      title: '',
      metric: null,
      dimensions: [],
      metrics: [],
      format: 'number',
      showTrend: true,
      // Date range and filter config
      dateRange: 'last_30_days',
      customStartDate: null,
      customEndDate: null,
      filters: [],
    });
    setEditingVizIndex(null);
    setVizTitleError('');
    setShowVizModal(true);
  }, []);

  const handleEditViz = useCallback((viz, index) => {
    setEditingVizIndex(index);
    setVizType(viz.type);
    setVizConfig({ ...viz });
    setVizTitleError('');
    setShowVizModal(true);
  }, []);

  const handleRemoveViz = useCallback(async (index) => {
    const currentVisualizations = report.visualizationConfig?.visualizations || [];
    const newVisualizations = currentVisualizations.filter((_, i) => i !== index);
    await onUpdate({
      visualizationConfig: {
        ...report.visualizationConfig,
        visualizations: newVisualizations,
      },
    });
  }, [report?.visualizationConfig, onUpdate]);

  const handleSaveViz = useCallback(async () => {
    if (!vizConfig.title?.trim()) {
      setVizTitleError('Title is required');
      return;
    }

    const currentVisualizations = report.visualizationConfig?.visualizations || [];
    const newViz = {
      id: editingVizIndex !== null
        ? currentVisualizations[editingVizIndex]?.id
        : `viz-${Date.now()}`,
      ...vizConfig,
      title: vizConfig.title.trim(),
    };

    let newVisualizations;
    if (editingVizIndex !== null) {
      newVisualizations = [...currentVisualizations];
      newVisualizations[editingVizIndex] = newViz;
    } else {
      newVisualizations = [...currentVisualizations, newViz];
    }

    await onUpdate({
      visualizationConfig: {
        ...report.visualizationConfig,
        visualizations: newVisualizations,
      },
    });

    setShowVizModal(false);
    setEditingVizIndex(null);
    setVizType(null);
    setVizConfig({});
    setVizTitleError('');
  }, [vizConfig, editingVizIndex, report?.visualizationConfig, onUpdate]);

  const handleCloseVizModal = useCallback(() => {
    setShowVizModal(false);
    setEditingVizIndex(null);
    setVizType(null);
    setVizConfig({});
    setVizTitleError('');
  }, []);

  // Format frequency for display
  const formatFrequency = (freq) => {
    const labels = {
      on_demand: 'On Demand',
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
    };
    return labels[freq] || freq || 'On Demand';
  };

  // Format delivery format for display
  const formatDelivery = (format) => {
    const labels = {
      view_only: 'View Only',
      csv: 'CSV',
      pdf: 'PDF',
    };
    return labels[format] || format || 'View Only';
  };

  if (!report) {
    return null;
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'eye' },
    { id: 'visualizations', label: 'Visualizations', icon: 'chartBar' },
    { id: 'schedule', label: 'Schedule', icon: 'clock' },
    { id: 'delivery', label: 'Delivery', icon: 'mail' },
    { id: 'alerts', label: 'Alerts', icon: 'alert' },
  ];

  const visualizations = report.visualizationConfig?.visualizations || [];
  const schedule = report.scheduleConfig || {};
  const isScheduled = report.frequency !== 'on_demand' && report.isScheduled;

  return (
    <Modal
      isOpen={!!report}
      onClose={onClose}
      size="xl"
      closeOnEscape
    >
      <div className={styles.container}>
        {/* Header Actions */}
        <div className={styles.headerActions}>
          {!isEditing ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Icon name="edit" size={14} />
                Edit
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
              >
                <Icon name="trash" size={14} />
                {confirmDelete ? 'Confirm Delete' : 'Delete'}
              </Button>
            </>
          ) : (
            <>
              <input
                type="text"
                className={styles.nameInput}
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                placeholder="Report name..."
              />
              <Button variant="primary" size="sm" onClick={handleSave}>
                Save
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
            </>
          )}
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon name={tab.icon} size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className={styles.tabContent}>
          {activeTab === 'overview' && (
            <OverviewTab
              report={report}
              visualizationsCount={visualizations.length}
              formatFrequency={formatFrequency}
              formatDelivery={formatDelivery}
            />
          )}

          {activeTab === 'visualizations' && (
            <VisualizationsTab
              visualizations={visualizations}
              onAddViz={handleAddViz}
              onEditViz={handleEditViz}
              onRemoveViz={handleRemoveViz}
            />
          )}

          {activeTab === 'schedule' && (
            <ScheduleTab
              report={report}
              formatFrequency={formatFrequency}
            />
          )}

          {activeTab === 'delivery' && (
            <DeliveryTab
              report={report}
              testEmail={testEmail}
              onTestEmailChange={setTestEmail}
              onSendTest={handleSendTest}
              onSendNow={onSendNow ? handleSendNow : undefined}
              sendingTest={sendingTest}
              sendResult={sendResult}
            />
          )}

          {activeTab === 'alerts' && (
            <AlertsTab
              alerts={alerts}
              alertsLoading={alertsLoading}
              showAlertForm={showAlertForm}
              alertFormData={alertFormData}
              onToggleAlertForm={() => setShowAlertForm(!showAlertForm)}
              onAlertFormChange={setAlertFormData}
              onCreateAlert={handleCreateAlert}
              onToggleAlert={handleToggleAlert}
              onDeleteAlert={handleDeleteAlert}
            />
          )}
        </div>

        {/* Add/Edit Visualization Modal - Rendered via portal to escape parent transform */}
        {showVizModal && createPortal(
          <div className={styles.vizModalOverlay} onClick={handleCloseVizModal}>
            <div
              className={`${styles.vizModal} ${vizType !== 'kpi' ? styles.vizModalLarge : ''}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.vizModalHeader}>
                <h3 className={styles.vizModalTitle}>
                  {editingVizIndex !== null ? 'Edit Visualization' : `Add ${capitalize(vizType || '')} ${vizType === 'kpi' ? 'Card' : 'Chart'}`}
                </h3>
                <Button variant="ghost" size="sm" onClick={handleCloseVizModal}>
                  <Icon name="x" size={16} />
                </Button>
              </div>

              <div className={styles.vizModalContent}>
                {/* Basic Info Section */}
                <div className={styles.vizSection}>
                  <h4 className={styles.vizSectionTitle}>Basic Info</h4>
                  <div className={styles.formField}>
                    <label htmlFor="viz-title">Title *</label>
                    <input
                      id="viz-title"
                      type="text"
                      value={vizConfig.title || ''}
                      onChange={(e) => {
                        setVizConfig((prev) => ({ ...prev, title: e.target.value }));
                        if (vizTitleError) setVizTitleError('');
                      }}
                      placeholder="Enter visualization title..."
                      maxLength={100}
                    />
                    {vizTitleError && (
                      <span className={styles.fieldError}>{vizTitleError}</span>
                    )}
                    <span className={styles.charCount}>
                      {(vizConfig.title || '').length}/100
                    </span>
                  </div>

                  {/* Format Selection */}
                  <div className={styles.formField}>
                    <label htmlFor="viz-format">Format</label>
                    <select
                      id="viz-format"
                      value={vizConfig.format || 'number'}
                      onChange={(e) =>
                        setVizConfig((prev) => ({ ...prev, format: e.target.value }))
                      }
                    >
                      <option value="number">Number</option>
                      <option value="currency">Currency ($)</option>
                      <option value="percentage">Percentage (%)</option>
                      <option value="compact">Compact (1K, 1M)</option>
                    </select>
                  </div>

                  {/* Show trend checkbox (KPI only) */}
                  {vizType === 'kpi' && (
                    <div className={styles.formFieldCheckbox}>
                      <label>
                        <input
                          type="checkbox"
                          checked={vizConfig.showTrend !== false}
                          onChange={(e) =>
                            setVizConfig((prev) => ({ ...prev, showTrend: e.target.checked }))
                          }
                        />
                        Show trend indicator
                      </label>
                    </div>
                  )}
                </div>

                {/* Data Selection Section */}
                <div className={styles.vizSection}>
                  <h4 className={styles.vizSectionTitle}>Data Selection</h4>
                  {warehouseLoading ? (
                    <div className={styles.sectionLoading}>
                      <PSXSprite sprite="hourglass" size="sm" animation="spin" />
                      <span>Loading fields...</span>
                    </div>
                  ) : !report?.warehouseId ? (
                    <div className={styles.formHint}>
                      <Icon name="info" size={14} />
                      <span>No warehouse configured for this report.</span>
                    </div>
                  ) : (
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
                  )}
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
                    reportId={report?.id}
                    warehouseId={report?.warehouseId}
                  />
                </div>
              </div>

              <div className={styles.vizModalActions}>
                <Button variant="secondary" onClick={handleCloseVizModal}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveViz}
                  disabled={!vizConfig.title?.trim()}
                >
                  {editingVizIndex !== null ? 'Save Changes' : 'Add Visualization'}
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {loading && (
          <div className={styles.loadingOverlay}>
            <PSXSprite sprite="hourglass" size="lg" animation="spin" />
          </div>
        )}
      </div>
    </Modal>
  );
}

ReportDetailModal.propTypes = {
  report: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    type: PropTypes.string,
    frequency: PropTypes.string,
    deliveryFormat: PropTypes.string,
    isScheduled: PropTypes.bool,
    recipients: PropTypes.arrayOf(PropTypes.string),
    warehouseId: PropTypes.string,
    visualizationConfig: PropTypes.shape({
      visualizations: PropTypes.array,
    }),
    scheduleConfig: PropTypes.shape({
      dayOfWeek: PropTypes.string,
      dayOfMonth: PropTypes.number,
      time: PropTypes.string,
      timezone: PropTypes.string,
    }),
    lastSentAt: PropTypes.string,
    nextRunAt: PropTypes.string,
  }),
  loading: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onUpdate: PropTypes.func,
  onDelete: PropTypes.func,
  onSendTest: PropTypes.func,
  onSendNow: PropTypes.func,
};
