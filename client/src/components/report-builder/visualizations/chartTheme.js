/**
 * Win98 Dungeon Theme for Recharts
 *
 * Provides consistent styling for all chart components
 * following the Data Hub design system.
 *
 * NOTE: Color values are synchronized with client/src/styles/index.css
 * These are duplicated here because Recharts requires raw hex/rgb values
 * for SVG rendering. Update both files when changing the color palette.
 */

// Synchronized with CSS custom properties in index.css
export const WIN98_CHART_COLORS = [
  '#FFD700',  // --color-primary (Gold)
  '#30A46C',  // --color-success
  '#00BBF9',  // --color-info
  '#FFAA5E',  // --color-warning
  '#E23D28',  // --color-error
  '#A855F7',  // Purple accent
  '#EC4899',  // Pink accent
  '#14B8A6',  // Teal accent
];

export const WIN98_CHART_THEME = {
  // Color palette for data series
  colors: WIN98_CHART_COLORS,

  // Background color for chart container
  backgroundColor: 'transparent',

  // Axis styling (colors synced with index.css)
  axis: {
    stroke: '#5A5A7C',         // --win98-border-light
    strokeWidth: 2,
    tick: {
      fill: '#C4B4A8',         // --color-text-secondary
      fontSize: 12,
      fontFamily: '"Silkscreen", monospace', // --font-ui
    },
    label: {
      fill: '#FFECD6',         // --color-text-primary
      fontSize: 12,
      fontFamily: '"Silkscreen", monospace', // --font-ui
    },
  },

  // Grid styling (colors synced with index.css)
  grid: {
    stroke: '#4A4A6C',         // --win98-border-lighter
    strokeDasharray: '3 3',
    strokeOpacity: 0.5,
  },

  // Tooltip styling (colors synced with index.css)
  tooltip: {
    contentStyle: {
      backgroundColor: '#3A3A5C',  // --color-bg-primary
      border: '2px solid #5A5A7C', // --win98-border-light
      borderRadius: 0,
      boxShadow: '4px 4px 0 rgba(0, 0, 0, 0.4)', // --shadow-md
      fontFamily: '"Silkscreen", monospace',     // --font-ui
      fontSize: 12,
      color: '#FFECD6',        // --color-text-primary
    },
    labelStyle: {
      color: '#FFD700',        // --color-primary
      fontWeight: 'bold',
      marginBottom: 4,
    },
    itemStyle: {
      padding: '2px 0',
    },
    cursor: {
      fill: 'rgba(255, 215, 0, 0.1)', // --color-primary with alpha
      stroke: '#FFD700',               // --color-primary
      strokeWidth: 1,
    },
  },

  // Legend styling (colors synced with index.css)
  legend: {
    wrapperStyle: {
      fontFamily: '"Silkscreen", monospace',
      fontSize: 12,
    },
    iconType: 'square',
    iconSize: 12,
  },

  // Bar chart specific
  bar: {
    radius: 0,
    strokeWidth: 2,
  },

  // Line chart specific
  line: {
    strokeWidth: 3,
    dot: {
      r: 4,
      strokeWidth: 2,
    },
    activeDot: {
      r: 6,
      strokeWidth: 2,
    },
  },

  // Pie chart specific (colors synced with index.css)
  pie: {
    strokeWidth: 2,
    stroke: '#3A3A5C',         // --color-bg-primary
  },
};

/**
 * Get chart color by index (cycles through palette)
 */
export function getChartColor(index) {
  return WIN98_CHART_COLORS[index % WIN98_CHART_COLORS.length];
}

/**
 * Format number values for display
 */
export function formatValue(value, format = 'number') {
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
 * Calculate trend percentage between two values
 */
export function calculateTrend(current, previous) {
  if (!previous || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

/**
 * Get trend color based on value and whether higher is better
 * Colors synced with index.css design tokens
 */
export function getTrendColor(trendValue, higherIsBetter = true) {
  if (trendValue === null || trendValue === undefined) return '#C4B4A8'; // --color-text-secondary

  const isPositive = trendValue > 0;
  const isGood = higherIsBetter ? isPositive : !isPositive;

  return isGood ? '#30A46C' : '#E23D28'; // --color-success : --color-error
}
