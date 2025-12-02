import { memo } from 'react';
import PropTypes from 'prop-types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import ChartWrapper from './ChartWrapper';
import { WIN98_CHART_THEME, getChartColor, formatValue } from './chartTheme';

/**
 * Bar Chart Visualization
 *
 * Displays data as vertical bars with Win98 dungeon styling.
 */
function BarChartViz({
  title,
  subtitle,
  data = [],
  xAxisKey = 'name',
  yAxisKeys = [],
  loading = false,
  height = 300,
  stacked = false,
  valueFormat = 'number',
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
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
            <Bar
              key={key}
              dataKey={key}
              fill={getChartColor(index)}
              stroke={WIN98_CHART_THEME.axis.stroke}
              strokeWidth={WIN98_CHART_THEME.bar.strokeWidth}
              radius={WIN98_CHART_THEME.bar.radius}
              stackId={stacked ? 'stack' : undefined}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

BarChartViz.propTypes = {
  /** Chart title */
  title: PropTypes.string.isRequired,
  /** Optional subtitle */
  subtitle: PropTypes.string,
  /** Chart data array */
  data: PropTypes.arrayOf(PropTypes.object),
  /** Key for X axis values */
  xAxisKey: PropTypes.string,
  /** Keys for Y axis values (one per bar series) */
  yAxisKeys: PropTypes.arrayOf(PropTypes.string).isRequired,
  /** Loading state */
  loading: PropTypes.bool,
  /** Chart height */
  height: PropTypes.number,
  /** Whether bars should be stacked */
  stacked: PropTypes.bool,
  /** Value formatting */
  valueFormat: PropTypes.oneOf(['number', 'currency', 'percentage', 'decimal', 'compact']),
};

export default memo(BarChartViz);
