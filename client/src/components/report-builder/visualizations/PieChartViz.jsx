import { memo } from 'react';
import PropTypes from 'prop-types';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import ChartWrapper from './ChartWrapper';
import { WIN98_CHART_THEME, getChartColor, formatValue } from './chartTheme';

/**
 * Pie Chart Visualization
 *
 * Displays data as pie/donut chart with Win98 dungeon styling.
 */
function PieChartViz({
  title,
  subtitle,
  data = [],
  nameKey = 'name',
  valueKey = 'value',
  loading = false,
  height = 300,
  valueFormat = 'number',
  donut = false,
}) {
  /* eslint-disable react/prop-types -- Recharts tooltip/label receives props from library */
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;

    const entry = payload[0];
    return (
      <div style={WIN98_CHART_THEME.tooltip.contentStyle}>
        <p style={WIN98_CHART_THEME.tooltip.labelStyle}>{entry.name}</p>
        <p style={WIN98_CHART_THEME.tooltip.itemStyle}>
          {formatValue(entry.value, valueFormat)}
        </p>
      </div>
    );
  };

  const renderLabel = ({ name, percent }) => {
    return `${name}: ${(percent * 100).toFixed(0)}%`;
  };
  /* eslint-enable react/prop-types */

  const innerRadius = donut ? '50%' : 0;

  return (
    <ChartWrapper
      title={title}
      subtitle={subtitle}
      loading={loading}
      height={height}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey={valueKey}
            nameKey={nameKey}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius="70%"
            label={renderLabel}
            labelLine={{
              stroke: WIN98_CHART_THEME.axis.stroke,
              strokeWidth: 1,
            }}
            stroke={WIN98_CHART_THEME.pie.stroke}
            strokeWidth={WIN98_CHART_THEME.pie.strokeWidth}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getChartColor(index)}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={WIN98_CHART_THEME.legend.wrapperStyle}
            iconType={WIN98_CHART_THEME.legend.iconType}
            iconSize={WIN98_CHART_THEME.legend.iconSize}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

PieChartViz.propTypes = {
  /** Chart title */
  title: PropTypes.string.isRequired,
  /** Optional subtitle */
  subtitle: PropTypes.string,
  /** Chart data array */
  data: PropTypes.arrayOf(
    PropTypes.objectOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number]))
  ),
  /** Key for segment names */
  nameKey: PropTypes.string,
  /** Key for segment values */
  valueKey: PropTypes.string,
  /** Loading state */
  loading: PropTypes.bool,
  /** Chart height */
  height: PropTypes.number,
  /** Value formatting */
  valueFormat: PropTypes.oneOf(['number', 'currency', 'percentage', 'decimal', 'compact']),
  /** Whether to render as donut chart */
  donut: PropTypes.bool,
};

export default memo(PieChartViz);
