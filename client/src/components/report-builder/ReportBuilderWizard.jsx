import PropTypes from 'prop-types';
import { useCallback } from 'react';
import Wizard from '../wizard/Wizard';
import DataSourceStep from './steps/DataSourceStep';
import VisualizationStep from './steps/VisualizationStep';
import ScheduleStep from './steps/ScheduleStep';
import ReviewStep from './steps/ReviewStep';
import { reportsApi } from '../../services/api';

/**
 * Report Builder Wizard
 *
 * 4-step wizard for creating visual reports from warehouse data:
 * 1. Data Source - Select warehouse and platforms
 * 2. Visualizations - Add KPI cards and charts
 * 3. Schedule - Configure delivery settings
 * 4. Review - Preview and create report
 */
export default function ReportBuilderWizard({
  clientId,
  warehouses = [],
  onComplete,
  onCancel,
}) {
  // Get the first warehouse (clients typically have one)
  const defaultWarehouse = warehouses[0] || null;

  const steps = [
    {
      id: 'dataSource',
      title: 'Data Source',
      component: DataSourceStep,
      isValid: (data) => {
        // Must have a warehouse selected
        return Boolean(data.warehouseId);
      },
    },
    {
      id: 'visualizations',
      title: 'Visualizations',
      component: VisualizationStep,
      isValid: (data) => {
        // Must have at least one visualization
        return data.visualizations && data.visualizations.length > 0;
      },
    },
    {
      id: 'schedule',
      title: 'Schedule',
      component: ScheduleStep,
      isValid: (data) => {
        // On-demand reports don't need recipients
        if (data.schedule?.frequency === 'on_demand') {
          return true;
        }
        // Scheduled reports need at least one recipient
        return data.schedule?.recipients && data.schedule.recipients.length > 0;
      },
    },
    {
      id: 'review',
      title: 'Review',
      component: ReviewStep,
      isValid: (data) => {
        // Report name is required
        return Boolean(data.reportName?.trim());
      },
    },
  ];

  const initialData = {
    // Step 1: Data Source
    warehouseId: defaultWarehouse?.id || null,
    selectedPlatforms: defaultWarehouse?.platforms || [],
    dateRange: 'last_7_days',

    // Step 2: Visualizations
    visualizations: [],

    // Step 3: Schedule
    schedule: {
      frequency: 'on_demand',
      deliveryFormat: 'view_only',
      recipients: [],
      dayOfWeek: 'monday',
      dayOfMonth: 1,
      time: '09:00',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },

    // Step 4: Review
    reportName: '',

    // Pass warehouses to steps for reference
    availableWarehouses: warehouses,
  };

  const handleComplete = useCallback(
    async (data) => {
      try {
        // Build visualization config
        const visualizationConfig = {
          visualizations: data.visualizations,
          dateRange: data.dateRange,
        };

        // Build schedule config (null for on-demand)
        const scheduleConfig =
          data.schedule.frequency !== 'on_demand'
            ? {
              frequency: data.schedule.frequency,
              time: data.schedule.time,
              timezone: data.schedule.timezone,
              dayOfWeek: data.schedule.dayOfWeek,
              dayOfMonth: data.schedule.dayOfMonth,
            }
            : null;

        // Determine if scheduled
        const isScheduled = data.schedule.frequency !== 'on_demand';

        // Create report via API
        const reportData = {
          name: data.reportName,
          type: 'builder',
          tool: 'data_hub',
          frequency: data.schedule.frequency,
          warehouseId: data.warehouseId,
          visualizationConfig,
          scheduleConfig,
          deliveryFormat: data.schedule.deliveryFormat,
          isScheduled,
          recipients: data.schedule.recipients,
        };

        const result = await reportsApi.create(clientId, reportData);

        if (onComplete) {
          onComplete(result.report || result);
        }
      } catch (error) {
        throw new Error(`Failed to create report: ${error.message}`);
      }
    },
    [clientId, onComplete]
  );

  return (
    <Wizard
      steps={steps}
      initialData={initialData}
      onComplete={handleComplete}
      onCancel={onCancel}
      title="Build Report"
      subtitle="Create a visual report from your warehouse data"
    />
  );
}

ReportBuilderWizard.propTypes = {
  clientId: PropTypes.string.isRequired,
  warehouses: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string,
      platforms: PropTypes.arrayOf(PropTypes.string),
      fieldSelections: PropTypes.object,
    })
  ),
  onComplete: PropTypes.func,
  onCancel: PropTypes.func,
};
