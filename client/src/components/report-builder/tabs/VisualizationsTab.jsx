import PropTypes from 'prop-types';
import Card from '../../common/Card';
import Button from '../../common/Button';
import Icon from '../../common/Icon';
import PSXSprite from '../../common/PSXSprite';
import { KPICard } from '../visualizations';
import { capitalize } from '../../../utils/string';
import styles from '../ReportDetailModal.module.css';

/**
 * Visualizations Tab for Report Detail Modal
 *
 * Displays visualization grid and add buttons.
 */
export default function VisualizationsTab({
  visualizations,
  onAddViz,
  onEditViz,
  onRemoveViz,
}) {
  const vizTypes = [
    { type: 'kpi', label: 'KPI Card', icon: 'coin' },
    { type: 'bar', label: 'Bar Chart', icon: 'chartBar' },
    { type: 'line', label: 'Line Chart', icon: 'activity' },
    { type: 'pie', label: 'Pie Chart', icon: 'pieChart' },
  ];

  return (
    <div className={styles.visualizations}>
      {/* Add Visualization Buttons */}
      <div className={styles.vizAddButtons}>
        {vizTypes.map((opt) => (
          <Button
            key={opt.type}
            variant="secondary"
            size="sm"
            onClick={() => onAddViz(opt.type)}
          >
            {opt.icon === 'coin' ? (
              <PSXSprite sprite="coin" size="xs" />
            ) : (
              <Icon name={opt.icon} size={14} />
            )}
            Add {opt.label}
          </Button>
        ))}
      </div>

      {visualizations.length > 0 ? (
        <div className={styles.vizGrid}>
          {visualizations.map((viz, index) => (
            <div key={viz.id} className={styles.vizItem}>
              {/* Preview */}
              <div className={styles.vizPreview}>
                {viz.type === 'kpi' ? (
                  <KPICard
                    title={viz.title}
                    value={1234}
                    format={viz.format}
                    showTrend={viz.showTrend}
                  />
                ) : (
                  <Card className={styles.chartPlaceholder}>
                    <Icon
                      name={
                        viz.type === 'bar'
                          ? 'chartBar'
                          : viz.type === 'line'
                            ? 'activity'
                            : 'pieChart'
                      }
                      size={32}
                    />
                    <span className={styles.chartTitle}>{viz.title}</span>
                    <span className={styles.chartType}>
                      {capitalize(viz.type)} Chart
                    </span>
                  </Card>
                )}
              </div>
              {/* Actions */}
              <div className={styles.vizItemActions}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditViz(viz, index)}
                  aria-label={`Edit ${viz.title}`}
                >
                  <Icon name="edit" size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveViz(index)}
                  aria-label={`Delete ${viz.title}`}
                >
                  <Icon name="trash" size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <PSXSprite sprite="star" size="lg" />
          <p>No visualizations configured</p>
          <p className={styles.emptyHint}>
            Click a button above to add KPI cards or charts
          </p>
        </div>
      )}
    </div>
  );
}

VisualizationsTab.propTypes = {
  visualizations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      type: PropTypes.string,
      title: PropTypes.string,
      format: PropTypes.string,
      showTrend: PropTypes.bool,
    })
  ).isRequired,
  onAddViz: PropTypes.func.isRequired,
  onEditViz: PropTypes.func.isRequired,
  onRemoveViz: PropTypes.func.isRequired,
};
