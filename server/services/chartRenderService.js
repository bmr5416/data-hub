import puppeteer from 'puppeteer';
import logger from '../utils/logger.js';

const log = logger.child({ component: 'ChartRenderService' });

/**
 * Chart Render Service
 *
 * Server-side chart rendering using Puppeteer.
 * Renders Recharts components with Win98 theme and captures as PNG.
 */

// Win98 Chart Colors - synced with client/src/components/report-builder/visualizations/chartTheme.js
const WIN98_CHART_COLORS = [
  '#FFD700', // Gold (primary)
  '#30A46C', // Success
  '#00BBF9', // Info
  '#FFAA5E', // Warning
  '#E23D28', // Error
  '#A855F7', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
];

// Win98 Theme Colors
const WIN98_COLORS = {
  bgPrimary: '#3A3A5C',
  borderLight: '#5A5A7C',
  borderLighter: '#4A4A6C',
  textPrimary: '#FFECD6',
  textSecondary: '#C4B4A8',
};

/**
 * Generate HTML template for chart rendering
 */
function generateChartHTML(chartType, data, config) {
  const {
    title = '',
    xAxisKey = 'name',
    yAxisKeys = [],
    // valueFormat available for future label formatting (currency, percentage, etc.)
    width = 600,
    height = 300,
    stacked = false,
  } = config;

  const chartDataJSON = JSON.stringify(data);
  const yAxisKeysJSON = JSON.stringify(yAxisKeys);
  const colorsJSON = JSON.stringify(WIN98_CHART_COLORS);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      background-color: ${WIN98_COLORS.bgPrimary};
      font-family: 'Silkscreen', 'Courier New', monospace;
    }
    #chart-container {
      width: ${width}px;
      height: ${height}px;
      padding: 16px;
      background-color: ${WIN98_COLORS.bgPrimary};
    }
    .chart-title {
      font-size: 14px;
      color: ${WIN98_COLORS.textPrimary};
      margin-bottom: 12px;
      text-align: center;
    }
  </style>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/recharts@2/umd/Recharts.min.js"></script>
</head>
<body>
  <div id="chart-container">
    ${title ? `<div class="chart-title">${title}</div>` : ''}
    <div id="chart-root" style="width: 100%; height: ${title ? height - 40 : height - 32}px;"></div>
  </div>
  <script>
    (function() {
      const chartData = ${chartDataJSON};
      const yAxisKeys = ${yAxisKeysJSON};
      const colors = ${colorsJSON};
      const chartType = '${chartType}';
      const xAxisKey = '${xAxisKey}';
      const stacked = ${stacked};

      const {
        ResponsiveContainer,
        BarChart, Bar,
        LineChart, Line,
        PieChart, Pie, Cell,
        XAxis, YAxis, CartesianGrid, Tooltip, Legend
      } = Recharts;

      // Theme constants
      const axisStyle = {
        stroke: '${WIN98_COLORS.borderLight}',
        strokeWidth: 2,
      };
      const tickStyle = {
        fill: '${WIN98_COLORS.textSecondary}',
        fontSize: 11,
      };
      const gridStyle = {
        stroke: '${WIN98_COLORS.borderLighter}',
        strokeDasharray: '3 3',
        strokeOpacity: 0.5,
      };
      const tooltipStyle = {
        backgroundColor: '${WIN98_COLORS.bgPrimary}',
        border: '2px solid ${WIN98_COLORS.borderLight}',
        borderRadius: 0,
        fontSize: 11,
        color: '${WIN98_COLORS.textPrimary}',
      };

      // Format value for display
      function formatValue(value) {
        if (value === null || value === undefined) return '-';
        if (typeof value !== 'number') return value;
        return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
      }

      let chartElement;

      if (chartType === 'bar') {
        chartElement = React.createElement(ResponsiveContainer, { width: '100%', height: '100%' },
          React.createElement(BarChart, { data: chartData, margin: { top: 20, right: 30, left: 20, bottom: 5 } },
            React.createElement(CartesianGrid, gridStyle),
            React.createElement(XAxis, { dataKey: xAxisKey, ...axisStyle, tick: tickStyle }),
            React.createElement(YAxis, { ...axisStyle, tick: tickStyle, tickFormatter: formatValue }),
            React.createElement(Tooltip, { contentStyle: tooltipStyle }),
            React.createElement(Legend, { wrapperStyle: { fontSize: 11 }, iconType: 'square', iconSize: 10 }),
            ...yAxisKeys.map((key, idx) =>
              React.createElement(Bar, {
                key: key,
                dataKey: key,
                fill: colors[idx % colors.length],
                stroke: '${WIN98_COLORS.borderLight}',
                strokeWidth: 2,
                radius: 0,
                stackId: stacked ? 'stack' : undefined,
              })
            )
          )
        );
      } else if (chartType === 'line') {
        chartElement = React.createElement(ResponsiveContainer, { width: '100%', height: '100%' },
          React.createElement(LineChart, { data: chartData, margin: { top: 20, right: 30, left: 20, bottom: 5 } },
            React.createElement(CartesianGrid, gridStyle),
            React.createElement(XAxis, { dataKey: xAxisKey, ...axisStyle, tick: tickStyle }),
            React.createElement(YAxis, { ...axisStyle, tick: tickStyle, tickFormatter: formatValue }),
            React.createElement(Tooltip, { contentStyle: tooltipStyle }),
            React.createElement(Legend, { wrapperStyle: { fontSize: 11 }, iconType: 'line', iconSize: 10 }),
            ...yAxisKeys.map((key, idx) =>
              React.createElement(Line, {
                key: key,
                type: 'monotone',
                dataKey: key,
                stroke: colors[idx % colors.length],
                strokeWidth: 3,
                dot: { r: 4, fill: colors[idx % colors.length], stroke: '${WIN98_COLORS.borderLight}', strokeWidth: 2 },
                activeDot: { r: 6 },
              })
            )
          )
        );
      } else if (chartType === 'pie') {
        // For pie charts, yAxisKeys[0] is the value key
        const valueKey = yAxisKeys[0] || 'value';
        chartElement = React.createElement(ResponsiveContainer, { width: '100%', height: '100%' },
          React.createElement(PieChart,
            { margin: { top: 20, right: 30, left: 20, bottom: 5 } },
            React.createElement(Pie, {
              data: chartData,
              cx: '50%',
              cy: '50%',
              labelLine: false,
              label: ({ name, percent }) => name + ' (' + (percent * 100).toFixed(0) + '%)',
              outerRadius: 100,
              dataKey: valueKey,
              nameKey: xAxisKey,
              stroke: '${WIN98_COLORS.bgPrimary}',
              strokeWidth: 2,
            },
              ...chartData.map((entry, idx) =>
                React.createElement(Cell, { key: idx, fill: colors[idx % colors.length] })
              )
            ),
            React.createElement(Tooltip, { contentStyle: tooltipStyle }),
            React.createElement(Legend, { wrapperStyle: { fontSize: 11 }, iconType: 'square', iconSize: 10 })
          )
        );
      }

      if (chartElement) {
        const root = ReactDOM.createRoot(document.getElementById('chart-root'));
        root.render(chartElement);
      }
    })();
  </script>
</body>
</html>
  `;
}

class ChartRenderService {
  constructor() {
    this.browser = null;
  }

  /**
   * Initialize Puppeteer browser
   */
  async init() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      log.info('Puppeteer browser initialized for chart rendering');
    }
    return this.browser;
  }

  /**
   * Close Puppeteer browser
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      log.info('Puppeteer browser closed');
    }
  }

  /**
   * Render a chart and return as base64 PNG
   *
   * @param {string} chartType - 'bar', 'line', or 'pie'
   * @param {Array} data - Chart data array
   * @param {Object} config - Chart configuration
   * @param {string} config.title - Chart title
   * @param {string} config.xAxisKey - Key for X axis values
   * @param {string[]} config.yAxisKeys - Keys for Y axis values
   * @param {number} config.width - Chart width (default: 600)
   * @param {number} config.height - Chart height (default: 300)
   * @param {boolean} config.stacked - Whether to stack bars (bar chart only)
   * @returns {string} Base64 data URL of rendered chart
   */
  async renderChart(chartType, data, config = {}) {
    const startTime = Date.now();

    try {
      const browser = await this.init();
      const page = await browser.newPage();

      const width = config.width || 600;
      const height = config.height || 300;

      // Set viewport to match chart dimensions
      await page.setViewport({ width: width + 32, height: height + 32 });

      // Generate and load the chart HTML
      const html = generateChartHTML(chartType, data, { ...config, width, height });
      await page.setContent(html, { waitUntil: 'networkidle0' });

      // Wait for chart to render (Recharts animations)
      await page.waitForSelector('#chart-root svg', { timeout: 5000 }).catch(() => {
        log.warn('Chart SVG not found, continuing anyway');
      });

      // Additional wait for animations
      await page.evaluate(() => new Promise((r) => setTimeout(r, 500)));

      // Take screenshot of chart container
      const chartContainer = await page.$('#chart-container');
      const screenshot = await chartContainer.screenshot({
        type: 'png',
        encoding: 'base64',
      });

      await page.close();

      const duration = Date.now() - startTime;
      log.info('Chart rendered successfully', { chartType, duration });

      return `data:image/png;base64,${screenshot}`;
    } catch (error) {
      log.error('Failed to render chart', { chartType, error: error.message });
      throw new Error(`Failed to render ${chartType} chart: ${error.message}`);
    }
  }

  /**
   * Render multiple charts in parallel
   *
   * @param {Array} charts - Array of chart configs: { type, data, config }
   * @returns {Array} Array of base64 data URLs
   */
  async renderCharts(charts) {
    const results = await Promise.all(
      charts.map(async (chart) => {
        try {
          return await this.renderChart(chart.type, chart.data, chart.config);
        } catch (error) {
          log.error('Failed to render chart in batch', { type: chart.type, error: error.message });
          return null;
        }
      })
    );

    return results;
  }
}

export default new ChartRenderService();
