import { memo } from 'react';
import PropTypes from 'prop-types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import ChartWrapper from './ChartWrapper';
import { WIN98_CHART_THEME, WIN98_CHART_COLORS, getChartColor, formatValue } from './chartTheme';

/**
 * Line Chart Visualization
 *
 * Displays data as lines over time with Win98 dungeon styling.
 */
function LineChartViz({
  title,
  subtitle,
  data = [],
  xAxisKey = 'date',
  yAxisKeys = [],
  loading = false,
  height = 300,
  valueFormat = 'number',
  curved = true,
}) {
  /* eslint-disable react/prop-types -- Recharts tooltip receives props from library */
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div style={WIN98_CHART_THEME.tooltip.contentStyle}>
        <p style={WIN98_CHART_THEME.tooltip.labelStyle}>{label}</p>
        {payload.map((entry, index) => (
          <p
            key={index}
            style={{
              ...WIN98_CHART_THEME.tooltip.itemStyle,
              color: entry.color,
            }}
          >
            {entry.name}: {formatValue(entry.value, valueFormat)}
          </p>
        ))}
      </div>
    );
  };
  /* eslint-enable react/prop-types */

  return (
    <ChartWrapper
      title={title}
      subtitle={subtitle}
      loading={loading}
      height={height}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid
            strokeDasharray={WIN98_CHART_THEME.grid.strokeDasharray}
            stroke={WIN98_CHART_THEME.grid.stroke}
            strokeOpacity={WIN98_CHART_THEME.grid.strokeOpacity}
          />
          <XAxis
            dataKey={xAxisKey}
            stroke={WIN98_CHART_THEME.axis.stroke}
            tick={WIN98_CHART_THEME.axis.tick}
            tickLine={{ stroke: WIN98_CHART_THEME.axis.stroke }}
            axisLine={{ stroke: WIN98_CHART_THEME.axis.stroke, strokeWidth: 2 }}
          />
          <YAxis
            stroke={WIN98_CHART_THEME.axis.stroke}
            tick={WIN98_CHART_THEME.axis.tick}
            tickLine={{ stroke: WIN98_CHART_THEME.axis.stroke }}
            axisLine={{ stroke: WIN98_CHART_THEME.axis.stroke, strokeWidth: 2 }}
            tickFormatter={(value) => formatValue(value, 'compact')}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={WIN98_CHART_THEME.legend.wrapperStyle}
            iconType={WIN98_CHART_THEME.legend.iconType}
            iconSize={WIN98_CHART_THEME.legend.iconSize}
          />
          {yAxisKeys.map((key, index) => (
            <Line
              key={key}
              type={curved ? 'monotone' : 'linear'}
              dataKey={key}
              stroke={getChartColor(index)}
              strokeWidth={WIN98_CHART_THEME.line.strokeWidth}
              dot={{
                fill: getChartColor(index),
                stroke: WIN98_CHART_THEME.axis.stroke,
                ...WIN98_CHART_THEME.line.dot,
              }}
              activeDot={{
                fill: getChartColor(index),
                stroke: WIN98_CHART_COLORS[0], // Gold highlight
                ...WIN98_CHART_THEME.line.activeDot,
              }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

LineChartViz.propTypes = {
  /** Chart title */
  title: PropTypes.string.isRequired,
  /** Optional subtitle */
  subtitle: PropTypes.string,
  /** Chart data array */
  data: PropTypes.arrayOf(
    PropTypes.objectOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number]))
  ),
  /** Key for X axis values (typically date) */
  xAxisKey: PropTypes.string,
  /** Keys for Y axis values (one per line series) */
  yAxisKeys: PropTypes.arrayOf(PropTypes.string).isRequired,
  /** Loading state */
  loading: PropTypes.bool,
  /** Chart height */
  height: PropTypes.number,
  /** Value formatting */
  valueFormat: PropTypes.oneOf(['number', 'currency', 'percentage', 'decimal', 'compact']),
  /** Whether lines should be curved */
  curved: PropTypes.bool,
};

export default memo(LineChartViz);
