/**
 * Report Test Data Factory
 *
 * Generates realistic report test data with visualizations
 */

import { faker } from '@faker-js/faker'

export type VisualizationType = 'kpi' | 'bar_chart' | 'line_chart' | 'pie_chart' | 'table'

export type ScheduleFrequency = 'daily' | 'weekly' | 'monthly' | 'never'

export interface Visualization {
  id: string
  type: VisualizationType
  title: string
  config: Record<string, any>
}

export interface ScheduleConfig {
  frequency: ScheduleFrequency
  day_of_week?: number
  day_of_month?: number
  hour: number
  minute: number
  timezone: string
}

export interface Recipient {
  email: string
  name?: string
}

export interface TestReport {
  name: string
  client_id?: string
  warehouse_id?: string
  visualizations: Visualization[]
  schedule_config?: ScheduleConfig
  recipients?: Recipient[]
  format: 'pdf' | 'html' | 'csv'
  is_active: boolean
  description?: string
}

/**
 * Generate a unique report name
 */
function generateReportName(): string {
  const type = faker.helpers.arrayElement([
    'Weekly Performance',
    'Monthly Summary',
    'Campaign Analysis',
    'ROI Dashboard',
    'Executive Summary',
  ])
  const unique = getShortUnique()
  return `${type} Report [${unique}]`
}

/**
 * Create a KPI visualization
 */
export function createKPIVisualization(metric: string = 'spend'): Visualization {
  return {
    id: crypto.randomUUID(),
    type: 'kpi',
    title: `Total ${metric.charAt(0).toUpperCase() + metric.slice(1)}`,
    config: {
      metric,
      aggregation: 'sum',
      format: metric === 'spend' ? 'currency' : 'number',
      showTrend: true,
    },
  }
}

/**
 * Create a chart visualization
 */
export function createChartVisualization(
  type: 'bar_chart' | 'line_chart' | 'pie_chart' = 'bar_chart',
): Visualization {
  return {
    id: crypto.randomUUID(),
    type,
    title: faker.helpers.arrayElement([
      'Performance Over Time',
      'Campaign Comparison',
      'Platform Breakdown',
      'Spend Distribution',
    ]),
    config: {
      xAxis: 'date',
      yAxis: faker.helpers.arrayElement(['impressions', 'clicks', 'spend', 'conversions']),
      groupBy: 'campaign_name',
      showLegend: true,
    },
  }
}

/**
 * Create a schedule configuration
 */
export function createScheduleConfig(
  frequency: ScheduleFrequency = 'weekly',
): ScheduleConfig {
  return {
    frequency,
    day_of_week: frequency === 'weekly' ? faker.number.int({ min: 0, max: 6 }) : undefined,
    day_of_month: frequency === 'monthly' ? faker.number.int({ min: 1, max: 28 }) : undefined,
    hour: faker.number.int({ min: 6, max: 18 }),
    minute: faker.helpers.arrayElement([0, 15, 30, 45]),
    timezone: 'America/New_York',
  }
}

/**
 * Create test report data
 */
export function createTestReport(overrides: Partial<TestReport> = {}): TestReport {
  return {
    name: generateReportName(),
    visualizations: [
      createKPIVisualization('spend'),
      createKPIVisualization('conversions'),
      createChartVisualization('bar_chart'),
    ],
    schedule_config: createScheduleConfig('weekly'),
    recipients: [
      {
        email: faker.internet.email(),
        name: faker.person.fullName(),
      },
    ],
    format: 'pdf',
    is_active: true,
    description: faker.lorem.sentence(),
    ...overrides,
  }
}

/**
 * Create an unscheduled report
 */
export function createUnscheduledReport(overrides: Partial<TestReport> = {}): TestReport {
  return createTestReport({
    schedule_config: { ...createScheduleConfig('never'), frequency: 'never' },
    ...overrides,
  })
}

/**
 * Create a report with multiple visualizations
 */
export function createDetailedReport(overrides: Partial<TestReport> = {}): TestReport {
  return createTestReport({
    visualizations: [
      createKPIVisualization('spend'),
      createKPIVisualization('impressions'),
      createKPIVisualization('clicks'),
      createKPIVisualization('conversions'),
      createChartVisualization('line_chart'),
      createChartVisualization('bar_chart'),
      createChartVisualization('pie_chart'),
    ],
    ...overrides,
  })
}

/**
 * Create multiple test reports
 */
export function createTestReports(
  count: number,
  overrides: Partial<TestReport> = {},
): TestReport[] {
  return Array.from({ length: count }, () => createTestReport(overrides))
}

/**
 * Create a minimal report
 */
export function createMinimalReport(name?: string): TestReport {
  return {
    name: name || generateReportName(),
    visualizations: [createKPIVisualization('spend')],
    format: 'pdf',
    is_active: true,
  }
}

export default {
  create: createTestReport,
  createUnscheduled: createUnscheduledReport,
  createDetailed: createDetailedReport,
  createMany: createTestReports,
  createMinimal: createMinimalReport,
  createKPI: createKPIVisualization,
  createChart: createChartVisualization,
  createSchedule: createScheduleConfig,
}
