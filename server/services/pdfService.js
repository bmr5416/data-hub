/**
 * PDFService - Generate PDFs from HTML using Puppeteer
 *
 * Handles:
 * - Report PDF generation with Win98 dungeon styling
 * - HTML template rendering with Handlebars
 * - Page setup and formatting options
 */

import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import { capitalize } from '../utils/string.js';
import chartRenderService from './chartRenderService.js';
import logger from '../utils/logger.js';

const log = logger.child({ component: 'PDFService' });

/**
 * Win98 Dungeon color palette for PDF styling
 * Synchronized with client/src/styles/index.css
 */
const WIN98_COLORS = {
  primary: '#FFD700',
  bgPrimary: '#3A3A5C',
  bgSecondary: '#2D1B4E',
  textPrimary: '#FFECD6',
  textSecondary: '#C4B4A8',
  textMuted: '#B8A89C',
  borderLight: '#5A5A7C',
  borderDark: '#2D1B4E',
  success: '#30A46C',
  error: '#E23D28',
  warning: '#FFAA5E',
  info: '#00BBF9',
};

/**
 * Base CSS for Win98 dungeon themed PDFs
 */
const BASE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Silkscreen&family=VT323&display=swap');

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'VT323', monospace;
    font-size: 14px;
    line-height: 1.5;
    color: ${WIN98_COLORS.textPrimary};
    background-color: ${WIN98_COLORS.bgPrimary};
    padding: 40px;
  }

  .report-header {
    text-align: center;
    padding: 20px;
    margin-bottom: 30px;
    background-color: ${WIN98_COLORS.bgSecondary};
    border: 2px solid ${WIN98_COLORS.borderLight};
  }

  .report-title {
    font-family: 'Press Start 2P', monospace;
    font-size: 18px;
    color: ${WIN98_COLORS.primary};
    text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.3);
    margin-bottom: 10px;
  }

  .report-subtitle {
    font-family: 'Silkscreen', monospace;
    font-size: 12px;
    color: ${WIN98_COLORS.textSecondary};
  }

  .section {
    margin-bottom: 24px;
    background-color: ${WIN98_COLORS.bgSecondary};
    border: 2px solid ${WIN98_COLORS.borderLight};
    padding: 16px;
  }

  .section-title {
    font-family: 'Press Start 2P', monospace;
    font-size: 12px;
    color: ${WIN98_COLORS.primary};
    text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.3);
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 2px solid ${WIN98_COLORS.borderDark};
  }

  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }

  .kpi-card {
    background-color: ${WIN98_COLORS.bgPrimary};
    border: 2px solid ${WIN98_COLORS.borderLight};
    padding: 16px;
    text-align: center;
  }

  .kpi-value {
    font-family: 'Press Start 2P', monospace;
    font-size: 20px;
    color: ${WIN98_COLORS.primary};
    margin-bottom: 8px;
  }

  .kpi-label {
    font-family: 'Silkscreen', monospace;
    font-size: 10px;
    color: ${WIN98_COLORS.textSecondary};
    text-transform: uppercase;
  }

  .kpi-trend {
    font-family: 'VT323', monospace;
    font-size: 14px;
    margin-top: 8px;
  }

  .kpi-trend.positive {
    color: ${WIN98_COLORS.success};
  }

  .kpi-trend.negative {
    color: ${WIN98_COLORS.error};
  }

  .chart-container {
    margin-bottom: 24px;
    padding: 16px;
    background-color: ${WIN98_COLORS.bgPrimary};
    border: 2px solid ${WIN98_COLORS.borderLight};
  }

  .chart-title {
    font-family: 'Silkscreen', monospace;
    font-size: 12px;
    color: ${WIN98_COLORS.textPrimary};
    margin-bottom: 12px;
  }

  .chart-placeholder {
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${WIN98_COLORS.textMuted};
    font-family: 'Silkscreen', monospace;
    border: 2px dashed ${WIN98_COLORS.borderLight};
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-family: 'VT323', monospace;
  }

  th {
    background-color: ${WIN98_COLORS.bgSecondary};
    color: ${WIN98_COLORS.primary};
    font-family: 'Silkscreen', monospace;
    font-size: 11px;
    text-align: left;
    padding: 12px 8px;
    border: 2px solid ${WIN98_COLORS.borderLight};
  }

  td {
    padding: 10px 8px;
    border: 1px solid ${WIN98_COLORS.borderDark};
    color: ${WIN98_COLORS.textPrimary};
  }

  tr:nth-child(even) {
    background-color: rgba(45, 27, 78, 0.3);
  }

  .footer {
    margin-top: 40px;
    padding-top: 20px;
    border-top: 2px solid ${WIN98_COLORS.borderDark};
    text-align: center;
    font-family: 'Silkscreen', monospace;
    font-size: 10px;
    color: ${WIN98_COLORS.textMuted};
  }

  .generated-at {
    margin-bottom: 8px;
  }

  .data-hub-branding {
    color: ${WIN98_COLORS.primary};
  }
`;

/**
 * Report HTML template using Handlebars
 */
const REPORT_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{{reportName}}</title>
  <style>
    ${BASE_CSS}
  </style>
</head>
<body>
  <div class="report-header">
    <h1 class="report-title">{{reportName}}</h1>
    <p class="report-subtitle">{{clientName}} • Generated {{generatedAt}}</p>
  </div>

  {{#if kpiCards.length}}
  <div class="section">
    <h2 class="section-title">Key Metrics</h2>
    <div class="kpi-grid">
      {{#each kpiCards}}
      <div class="kpi-card">
        <div class="kpi-value">{{this.formattedValue}}</div>
        <div class="kpi-label">{{this.title}}</div>
        {{#if this.trend}}
        <div class="kpi-trend {{this.trendClass}}">
          {{this.trend}}
        </div>
        {{/if}}
      </div>
      {{/each}}
    </div>
  </div>
  {{/if}}

  {{#if charts.length}}
  <div class="section">
    <h2 class="section-title">Visualizations</h2>
    {{#each charts}}
    <div class="chart-container">
      <div class="chart-title">{{this.title}}</div>
      {{#if this.imageData}}
      <img src="{{this.imageData}}" alt="{{this.title}}" style="max-width: 100%; height: auto;" />
      {{else}}
      <div class="chart-placeholder">
        {{this.type}} Chart - {{this.title}}
      </div>
      {{/if}}
    </div>
    {{/each}}
  </div>
  {{/if}}

  {{#if tableData}}
  <div class="section">
    <h2 class="section-title">Data Summary</h2>
    <table>
      <thead>
        <tr>
          {{#each tableHeaders}}
          <th>{{this}}</th>
          {{/each}}
        </tr>
      </thead>
      <tbody>
        {{#each tableData}}
        <tr>
          {{#each this}}
          <td>{{this}}</td>
          {{/each}}
        </tr>
        {{/each}}
      </tbody>
    </table>
  </div>
  {{/if}}

  <div class="footer">
    <div class="generated-at">Generated on {{generatedAt}}</div>
    <div class="data-hub-branding">Data Hub Report</div>
  </div>
</body>
</html>
`;

// Compile template once
const compiledTemplate = Handlebars.compile(REPORT_TEMPLATE);

// Register Handlebars helpers
Handlebars.registerHelper('formatCurrency', (value) => {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
});

Handlebars.registerHelper('formatPercentage', (value) => {
  if (value === null || value === undefined) return '-';
  return `${(value * 100).toFixed(1)}%`;
});

Handlebars.registerHelper('formatNumber', (value) => {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('en-US').format(value);
});

class PDFService {
  constructor() {
    // No persistent browser - create fresh instance per request to prevent leaks
    this.defaultTimeout = 30000; // 30 second timeout
  }

  /**
   * Create a new browser instance for PDF generation
   * Each request gets a fresh browser to prevent memory leaks
   */
  async createBrowser() {
    return puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });
  }

  /**
   * Escape HTML to prevent XSS vulnerabilities
   * @param {string} str - String to escape
   * @returns {string} Escaped string
   */
  escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Generate PDF from HTML string
   * Creates and closes browser per request to prevent memory leaks
   *
   * @param {string} html - HTML content to convert
   * @param {Object} options - PDF options
   * @returns {Buffer} PDF buffer
   */
  async generatePDFFromHTML(html, options = {}) {
    const browser = await this.createBrowser();
    let page = null;

    try {
      page = await browser.newPage();

      // Set timeout for content loading
      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: options.timeout || this.defaultTimeout,
      });

      const pdfBuffer = await page.pdf({
        format: options.format || 'Letter',
        printBackground: true,
        margin: options.margin || {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in',
        },
        timeout: options.timeout || this.defaultTimeout,
        ...options,
      });

      return pdfBuffer;
    } finally {
      // Always clean up resources
      if (page) {
        await page.close().catch(() => {});
      }
      await browser.close().catch(() => {});
    }
  }

  /**
   * Generate report PDF from report data
   *
   * @param {Object} reportData - Report data object
   * @param {string} reportData.reportName - Report name
   * @param {string} reportData.clientName - Client name
   * @param {Array} reportData.visualizations - Array of visualization configs
   * @param {Object} reportData.data - Report data values
   * @returns {Buffer} PDF buffer
   */
  async generateReportPDF(reportData) {
    const {
      reportName,
      clientName,
      visualizations = [],
      data = {},
    } = reportData;

    // Process KPI cards
    const kpiCards = visualizations
      .filter((v) => v.type === 'kpi')
      .map((v) => {
        const value = data[v.config?.metric] ?? v.sampleValue ?? 0;
        const formattedValue = this.formatValue(value, v.config?.format);
        const trend = v.config?.showTrend ? this.calculateTrendString(v.trendValue) : null;

        return {
          title: v.title || v.config?.metric || 'Metric',
          formattedValue,
          trend,
          trendClass: v.trendValue > 0 ? 'positive' : v.trendValue < 0 ? 'negative' : '',
        };
      });

    // Process and render charts using chartRenderService
    const chartVisualizations = visualizations.filter((v) =>
      ['bar', 'line', 'pie'].includes(v.type)
    );

    const charts = await Promise.all(
      chartVisualizations.map(async (v) => {
        const chartTitle = v.title || `${capitalize(v.type)} Chart`;
        let imageData = v.imageData || null;

        // If no pre-rendered image, render the chart server-side
        if (!imageData && v.config) {
          try {
            // Build chart data from report data
            const chartData = this.buildChartData(v, data);

            if (chartData && chartData.length > 0) {
              imageData = await chartRenderService.renderChart(v.type, chartData, {
                title: chartTitle,
                xAxisKey: v.config.xAxisKey || 'name',
                yAxisKeys: v.config.yAxisKeys || v.config.metrics || [],
                width: 560,
                height: 280,
                stacked: v.config.stacked || false,
              });
            }
          } catch (error) {
            log.error('Failed to render chart', { type: v.type, error: error.message });
          }
        }

        return {
          type: v.type,
          title: chartTitle,
          imageData,
        };
      })
    );

    // Generate HTML
    const html = compiledTemplate({
      reportName,
      clientName,
      generatedAt: new Date().toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'short',
      }),
      kpiCards,
      charts,
      tableHeaders: data.tableHeaders || [],
      tableData: data.tableData || [],
    });

    return this.generatePDFFromHTML(html);
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
   * Calculate trend string from trend value
   */
  calculateTrendString(trendValue) {
    if (trendValue === null || trendValue === undefined) return null;
    const arrow = trendValue > 0 ? '↑' : trendValue < 0 ? '↓' : '→';
    return `${arrow} ${Math.abs(trendValue).toFixed(1)}%`;
  }

  /**
   * Build chart data from visualization config and report data
   *
   * @param {Object} visualization - Visualization config
   * @param {Object} reportData - Full report data
   * @returns {Array} Chart data array suitable for Recharts
   */
  buildChartData(visualization, reportData) {
    const config = visualization.config || {};

    // If chartData is directly provided, use it
    if (visualization.chartData && Array.isArray(visualization.chartData)) {
      return visualization.chartData;
    }

    // If data array is in config, use it
    if (config.data && Array.isArray(config.data)) {
      return config.data;
    }

    // Try to build from report tableData
    if (reportData.tableData && reportData.tableHeaders) {
      const xAxisKey = config.xAxisKey || 'name';
      const metrics = config.yAxisKeys || config.metrics || [];

      // Find column indices
      const headers = reportData.tableHeaders;
      const xAxisIndex = headers.findIndex(
        (h) => h.toLowerCase() === xAxisKey.toLowerCase()
      );

      if (xAxisIndex >= 0 && metrics.length > 0) {
        return reportData.tableData.slice(0, 10).map((row) => {
          const dataPoint = { [xAxisKey]: row[xAxisIndex] };

          metrics.forEach((metric) => {
            const metricIndex = headers.findIndex(
              (h) => h.toLowerCase() === metric.toLowerCase()
            );
            if (metricIndex >= 0) {
              const value = parseFloat(row[metricIndex]);
              dataPoint[metric] = isNaN(value) ? 0 : value;
            }
          });

          return dataPoint;
        });
      }
    }

    // Fallback: if sampleData is provided
    if (visualization.sampleData && Array.isArray(visualization.sampleData)) {
      return visualization.sampleData;
    }

    return [];
  }

  /**
   * Generate a simple PDF with structured content (no raw HTML allowed)
   *
   * @param {Object} options - PDF options
   * @param {string} options.title - Document title (will be escaped)
   * @param {string} options.subtitle - Optional subtitle (will be escaped)
   * @param {Array<{heading?: string, text: string}>} options.sections - Content sections
   * @param {string} options.footer - Footer text (will be escaped)
   * @returns {Buffer} PDF buffer
   */
  async generateSimplePDF({ title, subtitle, sections = [], footer }) {
    // Escape all user-provided strings to prevent XSS
    const safeTitle = this.escapeHtml(title);
    const safeSubtitle = this.escapeHtml(subtitle);
    const safeFooter = this.escapeHtml(footer);

    // Build sections from structured data - all text is escaped
    const sectionsHtml = sections.map((section) => {
      const heading = section.heading
        ? `<h2 class="section-title">${this.escapeHtml(section.heading)}</h2>`
        : '';
      const text = this.escapeHtml(section.text)
        .split('\n')
        .map((line) => `<p>${line}</p>`)
        .join('');
      return `<div class="section">${heading}${text}</div>`;
    }).join('\n');

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${safeTitle}</title>
  <style>${BASE_CSS}</style>
</head>
<body>
  <div class="report-header">
    <h1 class="report-title">${safeTitle}</h1>
    ${safeSubtitle ? `<p class="report-subtitle">${safeSubtitle}</p>` : ''}
  </div>
  ${sectionsHtml}
  ${safeFooter ? `<div class="footer">${safeFooter}</div>` : ''}
</body>
</html>`;

    return this.generatePDFFromHTML(html);
  }
}

// Export singleton instance
export const pdfService = new PDFService();
export default pdfService;
