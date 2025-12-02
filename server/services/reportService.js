/**
 * ReportService - Report generation, data aggregation, and delivery
 *
 * Handles:
 * - Aggregating data from warehouses for reports
 * - Generating report previews
 * - Orchestrating report delivery (PDF/CSV via email)
 * - Calculating next run times for scheduled reports
 */

import { supabaseService } from './supabase.js';
import { pdfService } from './pdfService.js';
import { emailService } from './emailService.js';
import { DateTime } from 'luxon';
import logger from '../utils/logger.js';

const log = logger.child({ component: 'ReportService' });

class ReportService {
  /**
   * Get report data preview
   * Fetches and aggregates data from warehouse for visualization
   *
   * @param {string} reportId - Report ID
   * @returns {Object} Report data with visualization values
   */
  async getReportPreview(reportId) {
    const report = await supabaseService.getEnhancedReport(reportId);
    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    // Get client info
    const client = await supabaseService.getClient(report.clientId);
    if (!client) {
      throw new Error(`Client ${report.clientId} not found`);
    }

    // Get warehouse data if configured
    let warehouseData = null;
    let platformData = {};

    if (report.warehouseId) {
      const warehouse = await supabaseService.getWarehouseById(report.warehouseId);
      if (warehouse) {
        warehouseData = warehouse;

        // Get platform data for each platform in the warehouse (parallelized)
        const platforms = warehouse.platforms || [];
        const platformDataResults = await Promise.all(
          platforms.map(async (platformId) => {
            try {
              const result = await supabaseService.getPlatformData(report.clientId, platformId);
              return { platformId, data: result.data, error: null };
            } catch (error) {
              log.error(`Failed to get platform data for ${platformId}`, { platformId, error: error.message });
              return { platformId, data: [], error };
            }
          })
        );

        // Build platformData object from results
        platformDataResults.forEach(({ platformId, data }) => {
          if (data && data.length > 0) {
            platformData[platformId] = data;
          }
        });
      }
    }

    // Process visualizations with data (async to support historical queries)
    const visualizations = report.visualizationConfig?.visualizations || [];
    const processedVisualizations = await Promise.all(
      visualizations.map((viz) =>
        this.processVisualization(viz, platformData, warehouseData, report.clientId)
      )
    );

    return {
      report: {
        id: report.id,
        name: report.name,
        frequency: report.frequency,
        deliveryFormat: report.deliveryFormat,
        isScheduled: report.isScheduled,
        lastSentAt: report.lastSentAt,
        nextRunAt: report.nextRunAt,
      },
      client: {
        id: client.id,
        name: client.name,
      },
      warehouse: warehouseData ? {
        id: warehouseData.id,
        name: warehouseData.name,
        platforms: warehouseData.platforms,
      } : null,
      visualizations: processedVisualizations,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Process a single visualization with data
   *
   * @param {Object} viz - Visualization configuration
   * @param {Object} platformData - Current platform data
   * @param {Object} _warehouseData - Warehouse configuration (unused currently)
   * @param {string} clientId - Client ID for historical queries
   * @returns {Promise<Object>} Processed visualization with calculated values
   */
  async processVisualization(viz, platformData, _warehouseData, clientId = null) {
    const processed = {
      id: viz.id,
      type: viz.type,
      title: viz.title,
      config: viz.config || {},
    };

    // Calculate values based on visualization type
    if (viz.type === 'kpi') {
      const metric = viz.config?.metric;
      const value = this.calculateMetricValue(metric, platformData);
      processed.value = value;
      processed.formattedValue = this.formatValue(value, viz.config?.format);

      if (viz.config?.showTrend) {
        const previousValue = await this.calculatePreviousValue(metric, platformData, {
          clientId,
          comparisonPeriod: viz.config?.comparisonPeriod || 'wow',
          dateField: viz.config?.dateField || 'date',
        });
        processed.trend = this.calculateTrend(value, previousValue);
        processed.trendDirection = processed.trend > 0 ? 'up' : processed.trend < 0 ? 'down' : 'flat';
      }
    } else if (['bar', 'line', 'pie'].includes(viz.type)) {
      // For charts, provide aggregated data points
      processed.data = this.aggregateChartData(viz, platformData);
    }

    return processed;
  }

  /**
   * Calculate metric value from platform data
   */
  calculateMetricValue(metric, platformData) {
    if (!metric) return 0;

    let total = 0;
    let count = 0;

    // Sum across all platforms
    Object.values(platformData).forEach((rows) => {
      rows.forEach((row) => {
        const value = row.rowData?.[metric];
        if (typeof value === 'number') {
          total += value;
          count++;
        } else if (typeof value === 'string') {
          const parsed = parseFloat(value.replace(/[^0-9.-]/g, ''));
          if (!isNaN(parsed)) {
            total += parsed;
            count++;
          }
        }
      });
    });

    // For metrics like ROAS, return average instead of sum
    const avgMetrics = ['roas', 'ctr', 'cpc', 'cpm', 'conversion_rate'];
    if (avgMetrics.includes(metric) && count > 0) {
      return total / count;
    }

    return total;
  }

  /**
   * Calculate previous period value (for trend calculation)
   *
   * Attempts to query actual historical data from platform_data.
   * Falls back to simulated values if historical data doesn't exist.
   *
   * @param {string} metric - Metric name
   * @param {Object} platformData - Current platform data
   * @param {Object} options - Query options
   * @param {string} options.clientId - Client ID for historical query
   * @param {string} options.comparisonPeriod - 'wow' (week-over-week), 'mom' (month-over-month), 'yoy' (year-over-year)
   * @param {string} options.dateField - Field name containing the date in row_data
   * @returns {Promise<number>} Previous period value
   */
  async calculatePreviousValue(metric, platformData, options = {}) {
    const {
      clientId = null,
      comparisonPeriod = 'wow',
      dateField = 'date',
    } = options;

    const currentValue = this.calculateMetricValue(metric, platformData);

    // If no client ID provided, fall back to simulation
    if (!clientId) {
      return this.simulatePreviousValue(currentValue);
    }

    try {
      // Calculate date range for previous period
      const { startDate, endDate } = this.calculatePreviousPeriodDates(comparisonPeriod);

      // Query historical data for each platform (parallelized)
      const platformIds = Object.keys(platformData);
      const historicalResults = await Promise.all(
        platformIds.map(async (platformId) => {
          try {
            const result = await supabaseService.getPlatformDataByDateRange(
              clientId,
              platformId,
              startDate,
              endDate,
              dateField
            );
            return { platformId, data: result.data };
          } catch {
            return { platformId, data: [] };
          }
        })
      );

      const historicalData = {};
      historicalResults.forEach(({ platformId, data }) => {
        if (data && data.length > 0) {
          historicalData[platformId] = data;
        }
      });

      // If we have historical data, calculate the value
      if (Object.keys(historicalData).length > 0) {
        const previousValue = this.calculateMetricValue(metric, historicalData);
        if (previousValue !== null && previousValue !== 0) {
          return previousValue;
        }
      }

      // Fall back to simulation if no historical data found
      log.debug(`No historical data found for metric ${metric}, using simulation`, {
        clientId,
        comparisonPeriod,
      });
      return this.simulatePreviousValue(currentValue);
    } catch (error) {
      // Log error and fall back to simulation
      log.warn(`Failed to query historical data for ${metric}, using simulation`, {
        error: error.message,
        clientId,
      });
      return this.simulatePreviousValue(currentValue);
    }
  }

  /**
   * Calculate date range for previous period comparison
   *
   * @param {string} period - 'wow', 'mom', 'yoy'
   * @returns {Object} { startDate, endDate } in ISO format
   */
  calculatePreviousPeriodDates(period) {
    const now = DateTime.now();
    let startDate, endDate;

    switch (period) {
      case 'wow': // Week over week
        endDate = now.minus({ weeks: 1 }).endOf('day');
        startDate = endDate.minus({ days: 6 }).startOf('day');
        break;
      case 'mom': // Month over month
        endDate = now.minus({ months: 1 }).endOf('month');
        startDate = endDate.startOf('month');
        break;
      case 'yoy': // Year over year
        endDate = now.minus({ years: 1 }).endOf('day');
        startDate = endDate.minus({ days: 6 }).startOf('day');
        break;
      default:
        // Default to week over week
        endDate = now.minus({ weeks: 1 }).endOf('day');
        startDate = endDate.minus({ days: 6 }).startOf('day');
    }

    return {
      startDate: startDate.toISODate(),
      endDate: endDate.toISODate(),
    };
  }

  /**
   * Simulate previous period value when historical data is unavailable
   * Returns a value that shows realistic trend variation
   *
   * @param {number} currentValue - Current metric value
   * @returns {number} Simulated previous value
   */
  simulatePreviousValue(currentValue) {
    // Simulate previous value as 90-110% of current (±10% variation)
    return currentValue * (0.9 + Math.random() * 0.2);
  }

  /**
   * Calculate trend percentage
   */
  calculateTrend(current, previous) {
    if (!previous || previous === 0) return null;
    return ((current - previous) / previous) * 100;
  }

  /**
   * Aggregate data for chart visualizations
   */
  aggregateChartData(viz, platformData) {
    const { xAxis, yAxis } = viz.config || {};
    if (!xAxis || !yAxis) return [];

    const dataPoints = [];
    const aggregated = {};

    // Aggregate by x-axis dimension
    Object.entries(platformData).forEach(([platformId, rows]) => {
      rows.forEach((row) => {
        const xValue = row.rowData?.[xAxis] || platformId;
        if (!aggregated[xValue]) {
          aggregated[xValue] = { [xAxis]: xValue };
        }

        // Sum y-axis metrics
        (Array.isArray(yAxis) ? yAxis : [yAxis]).forEach((yField) => {
          const yValue = parseFloat(row.rowData?.[yField]) || 0;
          aggregated[xValue][yField] = (aggregated[xValue][yField] || 0) + yValue;
        });
      });
    });

    // Convert to array
    Object.values(aggregated).forEach((item) => {
      dataPoints.push(item);
    });

    return dataPoints;
  }

  /**
   * Format value based on format type
   */
  formatValue(value, format = 'number') {
    if (value === null || value === undefined) return '-';

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value);

      case 'percentage':
        return `${(value * 100).toFixed(1)}%`;

      case 'decimal':
        return new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(value);

      case 'compact':
        return new Intl.NumberFormat('en-US', {
          notation: 'compact',
          maximumFractionDigits: 1,
        }).format(value);

      case 'number':
      default:
        return new Intl.NumberFormat('en-US').format(value);
    }
  }

  /**
   * Get visualization preview data
   * Returns data formatted for specific visualization type
   *
   * @param {string} reportId - Report ID
   * @param {Object} vizConfig - Visualization configuration
   * @param {string} vizConfig.type - kpi, bar, line, pie
   * @param {string} vizConfig.metric - Metric for KPI
   * @param {string[]} vizConfig.metrics - Metrics for charts
   * @param {string[]} vizConfig.dimensions - Dimensions for grouping
   * @param {string} vizConfig.dateRange - Date range preset
   * @param {string} vizConfig.customStartDate - Custom start date
   * @param {string} vizConfig.customEndDate - Custom end date
   * @param {Object[]} vizConfig.filters - Dimension filters
   * @param {string} vizConfig.warehouseId - Warehouse ID
   * @returns {Object} Preview data
   */
  async getVisualizationPreview(reportId, vizConfig) {
    const report = await supabaseService.getEnhancedReport(reportId);
    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    const warehouseId = vizConfig.warehouseId || report.warehouseId;
    if (!warehouseId) {
      throw new Error('No warehouse configured for this report');
    }

    // Get warehouse data
    const warehouse = await supabaseService.getWarehouseById(warehouseId);
    if (!warehouse) {
      throw new Error(`Warehouse ${warehouseId} not found`);
    }

    // Calculate date range
    const { startDate, endDate } = this.calculateDateRange(
      vizConfig.dateRange || 'last_30_days',
      vizConfig.customStartDate,
      vizConfig.customEndDate
    );

    // Load platform data within date range (parallelized)
    const platforms = warehouse.platforms || [];
    const platformDataResults = await Promise.all(
      platforms.map(async (platformId) => {
        try {
          const result = await supabaseService.getPlatformDataByDateRange(
            report.clientId,
            platformId,
            startDate,
            endDate,
            'date'
          );
          return { platformId, data: result.data, error: null };
        } catch (error) {
          log.warn(`Failed to get platform data for ${platformId}`, { platformId, error: error.message });
          return { platformId, data: [], error };
        }
      })
    );

    const platformData = {};
    platformDataResults.forEach(({ platformId, data }) => {
      if (data && data.length > 0) {
        platformData[platformId] = data;
      }
    });

    // Apply dimension filters
    const filteredData = this.applyFilters(platformData, vizConfig.filters || []);

    // Generate preview based on type
    if (vizConfig.type === 'kpi') {
      return this.generateKPIPreview(filteredData, vizConfig, report.clientId);
    } else {
      return this.generateChartPreview(filteredData, vizConfig);
    }
  }

  /**
   * Calculate date range from preset or custom dates
   */
  calculateDateRange(dateRange, customStart, customEnd) {
    const now = DateTime.now();
    let startDate, endDate;

    if (dateRange === 'custom' && customStart && customEnd) {
      return {
        startDate: customStart,
        endDate: customEnd,
      };
    }

    switch (dateRange) {
      case 'last_7_days':
        endDate = now.endOf('day');
        startDate = now.minus({ days: 7 }).startOf('day');
        break;
      case 'last_14_days':
        endDate = now.endOf('day');
        startDate = now.minus({ days: 14 }).startOf('day');
        break;
      case 'last_30_days':
        endDate = now.endOf('day');
        startDate = now.minus({ days: 30 }).startOf('day');
        break;
      case 'last_90_days':
        endDate = now.endOf('day');
        startDate = now.minus({ days: 90 }).startOf('day');
        break;
      case 'this_month':
        startDate = now.startOf('month');
        endDate = now.endOf('day');
        break;
      case 'last_month':
        startDate = now.minus({ months: 1 }).startOf('month');
        endDate = now.minus({ months: 1 }).endOf('month');
        break;
      case 'this_quarter':
        startDate = now.startOf('quarter');
        endDate = now.endOf('day');
        break;
      case 'last_quarter':
        startDate = now.minus({ quarters: 1 }).startOf('quarter');
        endDate = now.minus({ quarters: 1 }).endOf('quarter');
        break;
      case 'this_year':
        startDate = now.startOf('year');
        endDate = now.endOf('day');
        break;
      default:
        endDate = now.endOf('day');
        startDate = now.minus({ days: 30 }).startOf('day');
    }

    return {
      startDate: startDate.toISODate(),
      endDate: endDate.toISODate(),
    };
  }

  /**
   * Apply dimension filters to platform data
   */
  applyFilters(platformData, filters) {
    if (!filters || filters.length === 0) {
      return platformData;
    }

    const filtered = {};
    Object.entries(platformData).forEach(([platformId, rows]) => {
      filtered[platformId] = rows.filter((row) => {
        return filters.every((filter) => {
          const value = row.rowData?.[filter.field];
          if (value === undefined || value === null) return false;

          const strValue = String(value).toLowerCase();
          const filterValue = String(filter.value).toLowerCase();

          switch (filter.operator) {
            case 'equals':
              return strValue === filterValue;
            case 'not_equals':
              return strValue !== filterValue;
            case 'contains':
              return strValue.includes(filterValue);
            case 'starts_with':
              return strValue.startsWith(filterValue);
            default:
              return true;
          }
        });
      });
    });

    return filtered;
  }

  /**
   * Generate KPI preview data
   */
  async generateKPIPreview(platformData, vizConfig, clientId) {
    const metric = vizConfig.metric;
    if (!metric) {
      return { value: 0, previousValue: null };
    }

    const value = this.calculateMetricValue(metric, platformData);
    const previousValue = await this.calculatePreviousValue(metric, platformData, {
      clientId,
      comparisonPeriod: 'wow',
      dateField: 'date',
    });

    return {
      value,
      previousValue,
      trend: this.calculateTrend(value, previousValue),
    };
  }

  /**
   * Generate chart preview data
   */
  generateChartPreview(platformData, vizConfig) {
    const { type, metrics = [], dimensions = [] } = vizConfig;
    const xAxisKey = dimensions[0] || 'name';
    const yAxisKeys = metrics;

    // Aggregate data by dimension
    const aggregated = {};
    Object.entries(platformData).forEach(([platformId, rows]) => {
      rows.forEach((row) => {
        const dimensionValue = row.rowData?.[xAxisKey] || platformId;

        if (!aggregated[dimensionValue]) {
          aggregated[dimensionValue] = { [xAxisKey]: dimensionValue };
          yAxisKeys.forEach((key) => {
            aggregated[dimensionValue][key] = 0;
          });
        }

        yAxisKeys.forEach((metricKey) => {
          const metricValue = parseFloat(row.rowData?.[metricKey]) || 0;
          aggregated[dimensionValue][metricKey] += metricValue;
        });
      });
    });

    // Convert to array and sort
    const chartData = Object.values(aggregated).sort((a, b) => {
      // Sort by first metric descending for bar/pie, by dimension for line
      if (type === 'line') {
        return String(a[xAxisKey]).localeCompare(String(b[xAxisKey]));
      }
      return (b[yAxisKeys[0]] || 0) - (a[yAxisKeys[0]] || 0);
    }).slice(0, 20); // Limit to 20 data points for preview

    // For pie charts, use single metric
    if (type === 'pie') {
      return {
        chartData: chartData.map((item) => ({
          name: item[xAxisKey],
          value: item[yAxisKeys[0]] || 0,
        })),
        nameKey: 'name',
        valueKey: 'value',
      };
    }

    return {
      chartData,
      xAxisKey,
      yAxisKeys,
    };
  }

  /**
   * Send report to recipients
   *
   * @param {string} reportId - Report ID
   * @param {Object} options - Send options
   * @param {boolean} options.isTest - Whether this is a test send
   * @param {string} options.testEmail - Test email address (for test sends)
   * @returns {Object} Send result
   */
  async sendReport(reportId, options = {}) {
    const { isTest = false, testEmail } = options;

    const report = await supabaseService.getEnhancedReport(reportId);
    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    const client = await supabaseService.getClient(report.clientId);
    if (!client) {
      throw new Error(`Client ${report.clientId} not found`);
    }

    // Determine recipients
    const recipients = isTest ? [testEmail] : report.recipients;
    if (!recipients || recipients.length === 0) {
      throw new Error('No recipients configured');
    }

    // Get report preview data
    const previewData = await this.getReportPreview(reportId);

    // Create delivery history record
    const deliveryHistory = await supabaseService.createReportDeliveryHistory({
      reportId,
      deliveryFormat: report.deliveryFormat,
      recipients,
      status: 'pending',
    });

    try {
      let attachmentBuffer = null;
      let format = report.deliveryFormat;

      // Generate attachment based on format
      if (format === 'pdf') {
        attachmentBuffer = await pdfService.generateReportPDF({
          reportName: report.name,
          clientName: client.name,
          visualizations: previewData.visualizations,
          data: this.extractDataForPDF(previewData),
        });
      } else if (format === 'csv') {
        attachmentBuffer = Buffer.from(this.generateCSV(previewData));
      }

      // Send email
      const emailResult = await emailService.sendReportEmail({
        report: {
          name: report.name,
          clientName: client.name,
        },
        recipients,
        attachmentBuffer,
        format,
      });

      // Update delivery history
      await supabaseService.updateReportDeliveryHistory(deliveryHistory.id, {
        status: 'sent',
        fileSize: attachmentBuffer?.length || 0,
      });

      // Update report last sent time (only for non-test sends)
      if (!isTest) {
        await supabaseService.updateEnhancedReport(reportId, {
          lastSentAt: new Date().toISOString(),
          sendCount: (report.sendCount || 0) + 1,
        });
      }

      return {
        success: true,
        messageId: emailResult.messageId,
        recipients: emailResult.accepted,
        format,
        deliveryHistoryId: deliveryHistory.id,
      };
    } catch (error) {
      // Update delivery history with error
      await supabaseService.updateReportDeliveryHistory(deliveryHistory.id, {
        status: 'failed',
        errorMessage: error.message,
      });

      throw error;
    }
  }

  /**
   * Extract data for PDF generation
   */
  extractDataForPDF(previewData) {
    const data = {};

    // Extract metric values from KPI visualizations
    previewData.visualizations.forEach((viz) => {
      if (viz.type === 'kpi' && viz.config?.metric) {
        data[viz.config.metric] = viz.value;
      }
    });

    return data;
  }

  /**
   * Generate CSV from report data
   */
  generateCSV(previewData) {
    const lines = [];

    // Header
    lines.push(`Report: ${previewData.report.name}`);
    lines.push(`Client: ${previewData.client.name}`);
    lines.push(`Generated: ${previewData.generatedAt}`);
    lines.push('');

    // KPI Summary
    const kpis = previewData.visualizations.filter((v) => v.type === 'kpi');
    if (kpis.length > 0) {
      lines.push('Key Metrics');
      lines.push('Metric,Value,Trend');
      kpis.forEach((kpi) => {
        const trend = kpi.trend ? `${kpi.trend > 0 ? '+' : ''}${kpi.trend.toFixed(1)}%` : '';
        lines.push(`"${kpi.title}","${kpi.formattedValue}","${trend}"`);
      });
      lines.push('');
    }

    // Chart data
    const charts = previewData.visualizations.filter((v) => ['bar', 'line', 'pie'].includes(v.type));
    charts.forEach((chart) => {
      if (chart.data && chart.data.length > 0) {
        lines.push(`${chart.title}`);
        const headers = Object.keys(chart.data[0]);
        lines.push(headers.join(','));
        chart.data.forEach((row) => {
          lines.push(headers.map((h) => `"${row[h]}"`).join(','));
        });
        lines.push('');
      }
    });

    return lines.join('\n');
  }

  /**
   * Calculate next run time based on schedule config
   *
   * @param {Object} scheduleConfig - Schedule configuration
   * @param {string} scheduleConfig.frequency - daily, weekly, monthly
   * @param {string} scheduleConfig.time - Time in HH:mm format
   * @param {string} scheduleConfig.dayOfWeek - Day of week (for weekly)
   * @param {number} scheduleConfig.dayOfMonth - Day of month (for monthly)
   * @param {string} scheduleConfig.timezone - Timezone
   * @returns {string} Next run ISO timestamp
   */
  calculateNextRunTime(scheduleConfig) {
    if (!scheduleConfig) return null;

    const { frequency, time, dayOfWeek, dayOfMonth, timezone = 'America/New_York' } = scheduleConfig;
    const [hours, minutes] = (time || '09:00').split(':').map(Number);

    let nextRun = DateTime.now().setZone(timezone);

    // Set time
    nextRun = nextRun.set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });

    // If the time has already passed today, start from tomorrow
    if (nextRun <= DateTime.now().setZone(timezone)) {
      nextRun = nextRun.plus({ days: 1 });
    }

    switch (frequency) {
      case 'daily':
        // Already set to next occurrence
        break;

      case 'weekly': {
        const targetDay = this.getDayOfWeekNumber(dayOfWeek);
        const currentDay = nextRun.weekday;

        let daysUntil = targetDay - currentDay;
        if (daysUntil <= 0) {
          daysUntil += 7;
        }
        // If it's the target day but time has passed, go to next week
        if (daysUntil === 0 && nextRun <= DateTime.now().setZone(timezone)) {
          daysUntil = 7;
        }
        nextRun = nextRun.plus({ days: daysUntil });
        break;
      }

      case 'monthly': {
        const targetDayOfMonth = dayOfMonth || 1;
        nextRun = nextRun.set({ day: targetDayOfMonth });

        // If the day has already passed this month, go to next month
        if (nextRun <= DateTime.now().setZone(timezone)) {
          nextRun = nextRun.plus({ months: 1 });
        }
        break;
      }

      default:
        return null;
    }

    return nextRun.toISO();
  }

  /**
   * Convert day of week string to Luxon weekday number (1=Monday, 7=Sunday)
   */
  getDayOfWeekNumber(dayOfWeek) {
    const days = {
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
      sunday: 7,
    };
    return days[dayOfWeek?.toLowerCase()] || 1;
  }

  /**
   * Convert schedule config to cron expression
   *
   * @param {Object} scheduleConfig - Schedule configuration
   * @returns {string} Cron expression
   */
  scheduleToCron(scheduleConfig) {
    if (!scheduleConfig) return null;

    const { frequency, time, dayOfWeek, dayOfMonth } = scheduleConfig;
    const [hours, minutes] = (time || '09:00').split(':').map(Number);

    switch (frequency) {
      case 'daily':
        return `${minutes} ${hours} * * *`;

      case 'weekly': {
        const cronDay = this.getDayOfWeekCron(dayOfWeek);
        return `${minutes} ${hours} * * ${cronDay}`;
      }

      case 'monthly': {
        const day = dayOfMonth || 1;
        return `${minutes} ${hours} ${day} * *`;
      }

      default:
        return null;
    }
  }

  /**
   * Convert day of week to cron format (0=Sunday, 1=Monday, etc.)
   */
  getDayOfWeekCron(dayOfWeek) {
    const days = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };
    return days[dayOfWeek?.toLowerCase()] ?? 1;
  }

  /**
   * Schedule a report for automated delivery
   *
   * @param {string} reportId - Report ID
   * @param {Object} scheduleConfig - Schedule configuration
   * @returns {Object} Updated report
   */
  async scheduleReport(reportId, scheduleConfig) {
    const nextRunAt = this.calculateNextRunTime(scheduleConfig);
    const cronExpression = this.scheduleToCron(scheduleConfig);

    // Update report with schedule
    const updatedReport = await supabaseService.updateEnhancedReport(reportId, {
      scheduleConfig,
      isScheduled: true,
      nextRunAt,
      frequency: scheduleConfig.frequency,
    });

    // Create or update scheduled job
    const existingJob = await supabaseService.getScheduledJobByEntity('report_delivery', reportId);

    if (existingJob) {
      await supabaseService.updateScheduledJob(existingJob.id, {
        cronExpression,
        nextRunAt,
        enabled: true,
      });
    } else {
      await supabaseService.createScheduledJob({
        jobType: 'report_delivery',
        entityId: reportId,
        cronExpression,
        nextRunAt,
        enabled: true,
      });
    }

    return updatedReport;
  }

  /**
   * Unschedule a report
   *
   * @param {string} reportId - Report ID
   * @returns {Object} Updated report
   */
  async unscheduleReport(reportId) {
    // Update report
    const updatedReport = await supabaseService.updateEnhancedReport(reportId, {
      isScheduled: false,
      nextRunAt: null,
    });

    // Delete scheduled job
    await supabaseService.deleteScheduledJobByEntity('report_delivery', reportId);

    return updatedReport;
  }

  /**
   * Process scheduled report delivery
   * Called by SchedulerService when a report is due
   *
   * @param {string} reportId - Report ID
   * @returns {Object} Send result
   */
  async processScheduledDelivery(reportId) {
    const report = await supabaseService.getEnhancedReport(reportId);
    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    if (!report.isScheduled) {
      log.warn(`Report ${reportId} is not scheduled, skipping`, { reportId });
      return { skipped: true, reason: 'not_scheduled' };
    }

    // Send the report
    const result = await this.sendReport(reportId);

    // Calculate and update next run time
    const nextRunAt = this.calculateNextRunTime(report.scheduleConfig);

    await supabaseService.updateEnhancedReport(reportId, {
      nextRunAt,
    });

    // Update scheduled job
    const job = await supabaseService.getScheduledJobByEntity('report_delivery', reportId);
    if (job) {
      await supabaseService.updateScheduledJob(job.id, {
        lastRunAt: new Date().toISOString(),
        nextRunAt,
        lastStatus: 'success',
      });
    }

    return result;
  }
}

// Export singleton instance
export const reportService = new ReportService();
export default reportService;
