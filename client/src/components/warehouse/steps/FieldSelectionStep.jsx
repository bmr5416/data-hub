import { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useAudio } from '../../../hooks/useAudio';
import FieldSelector from '../FieldSelector';
import Card from '../../common/Card';
import Button from '../../common/Button';
import Icon from '../../common/Icon';
import PSXSprite from '../../common/PSXSprite';
import { toTitleCase } from '../../../utils/string';
import styles from './FieldSelectionStep.module.css';

// Common fields to auto-select in recommended mode
const COMMON_DIMENSIONS = ['date', 'campaign_name', 'ad_set_name', 'ad_name'];
const COMMON_METRICS = ['impressions', 'clicks', 'spend', 'conversions'];

/**
 * Step 2: Field Selection
 * Platform selector with "Recommended" / "Custom" mode toggle
 *
 * Supports inheritedSelections prop for pre-populating fields from parent context
 * (e.g., when embedded in SourceWizard, fields from Step 2 are inherited)
 */
export default function FieldSelectionStep({ data, onChange }) {
  const { selectedPlatforms = [], fieldSelections = {}, inheritedSelections = null } = data;
  const [activePlatformIndex, setActivePlatformIndex] = useState(0);
  const [fieldMode, setFieldMode] = useState('recommended'); // 'recommended' | 'custom'
  const [platformApproved, setPlatformApproved] = useState({}); // Track which platforms have been approved in recommended mode
  const { playClick, playTab } = useAudio();

  const activePlatform = selectedPlatforms[activePlatformIndex] || null;

  // Check if we have inherited selections for the active platform
  const hasInheritedSelections = useMemo(() => {
    if (!inheritedSelections || !activePlatform) return false;
    const inherited = inheritedSelections[activePlatform];
    return inherited &&
           ((inherited.dimensions && inherited.dimensions.length > 0) ||
            (inherited.metrics && inherited.metrics.length > 0));
  }, [inheritedSelections, activePlatform]);

  // Get inherited fields for display
  const inheritedFields = useMemo(() => {
    if (!inheritedSelections || !activePlatform) return null;
    return inheritedSelections[activePlatform];
  }, [inheritedSelections, activePlatform]);

  const platformSelection = useMemo(() => {
    if (!activePlatform) return { dimensions: [], metrics: [] };
    return fieldSelections[activePlatform] || { dimensions: [], metrics: [] };
  }, [activePlatform, fieldSelections]);

  const isApproved = platformApproved[activePlatform];

  const handleDimensionsChange = useCallback((dimensions) => {
    if (!activePlatform) return;
    onChange({
      fieldSelections: {
        ...fieldSelections,
        [activePlatform]: {
          ...platformSelection,
          dimensions
        }
      }
    });
    // Reset approval when selections change in custom mode
    setPlatformApproved(prev => ({ ...prev, [activePlatform]: false }));
  }, [activePlatform, fieldSelections, platformSelection, onChange]);

  const handleMetricsChange = useCallback((metrics) => {
    if (!activePlatform) return;
    onChange({
      fieldSelections: {
        ...fieldSelections,
        [activePlatform]: {
          ...platformSelection,
          metrics
        }
      }
    });
    // Reset approval when selections change in custom mode
    setPlatformApproved(prev => ({ ...prev, [activePlatform]: false }));
  }, [activePlatform, fieldSelections, platformSelection, onChange]);

  // Use recommended fields for the active platform
  const handleUseRecommended = useCallback(() => {
    playClick();
    if (!activePlatform) return;
    onChange({
      fieldSelections: {
        ...fieldSelections,
        [activePlatform]: {
          dimensions: [...COMMON_DIMENSIONS],
          metrics: [...COMMON_METRICS]
        }
      }
    });
    setPlatformApproved(prev => ({ ...prev, [activePlatform]: true }));
  }, [playClick, activePlatform, fieldSelections, onChange]);

  // Use inherited fields from parent context (e.g., SourceWizard Step 2)
  const handleUseInherited = useCallback(() => {
    playClick();
    if (!activePlatform || !inheritedFields) return;
    onChange({
      fieldSelections: {
        ...fieldSelections,
        [activePlatform]: {
          dimensions: [...(inheritedFields.dimensions || [])],
          metrics: [...(inheritedFields.metrics || [])]
        }
      }
    });
    setPlatformApproved(prev => ({ ...prev, [activePlatform]: true }));
  }, [playClick, activePlatform, fieldSelections, inheritedFields, onChange]);

  // Get display name for platform
  const getPlatformDisplayName = (platformId) => {
    return toTitleCase(platformId);
  };

  // Early return after all hooks
  if (!selectedPlatforms || selectedPlatforms.length === 0) {
    return (
      <Card className={styles.emptyState}>
        <p>No platforms selected. Please go back and select platforms first.</p>
      </Card>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Select Fields for Each Platform</h2>
        <p className={styles.description}>
          Choose dimensions and metrics for each platform. These will be the columns in your warehouse.
        </p>
      </div>

      {/* Platform selectors (tabs) */}
      <div className={styles.platformSelectors} role="tablist" aria-label="Platform fields" aria-orientation="horizontal">
        {selectedPlatforms.map((platformId, index) => {
          const isActive = index === activePlatformIndex;
          const selection = fieldSelections[platformId];
          const isComplete = selection &&
            selection.dimensions?.length > 0 &&
            selection.metrics?.length > 0;

          return (
            <button
              key={platformId}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${platformId}`}
              className={`${styles.platformSelector} ${isActive ? styles.active : ''} ${isComplete ? styles.complete : ''}`}
              onClick={() => { playTab(); setActivePlatformIndex(index); }}
            >
              <span className={styles.selectorName}>
                {getPlatformDisplayName(platformId)}
              </span>
              {isComplete && <span className={styles.checkmark}>✓</span>}
            </button>
          );
        })}
      </div>

      {/* Mode Toggle */}
      <div className={styles.modeToggle}>
        <button
          type="button"
          className={`${styles.modeButton} ${fieldMode === 'recommended' ? styles.modeActive : ''}`}
          onClick={() => { playClick(); setFieldMode('recommended'); }}
        >
          Recommended
        </button>
        <button
          type="button"
          className={`${styles.modeButton} ${fieldMode === 'custom' ? styles.modeActive : ''}`}
          onClick={() => { playClick(); setFieldMode('custom'); }}
        >
          Custom
        </button>
      </div>

      {/* RECOMMENDED MODE */}
      {fieldMode === 'recommended' && (
        <div className={styles.recommendedMode}>
          {/* Show inherited option first if available */}
          {hasInheritedSelections && (
            <Card className={styles.inheritedCard}>
              <div className={styles.inheritedHeader}>
                <PSXSprite sprite="star" size="sm" ariaLabel="Inherited" />
                <h4 className={styles.inheritedTitle}>Inherited Configuration</h4>
              </div>
              <p className={styles.inheritedHint}>
                Use fields from your previous configuration for {getPlatformDisplayName(activePlatform)}.
              </p>

              <div className={styles.recommendedPreviewInline}>
                <div className={styles.recommendedSection}>
                  <h5 className={styles.recommendedLabel}>
                    <Icon name="tag" size={14} />
                    Dimensions ({inheritedFields?.dimensions?.length || 0})
                  </h5>
                  <div className={styles.recommendedFields}>
                    {inheritedFields?.dimensions?.map(id => (
                      <span key={id} className={`${styles.fieldChip} ${styles.inheritedChip}`}>{id}</span>
                    ))}
                  </div>
                </div>

                <div className={styles.recommendedSection}>
                  <h5 className={styles.recommendedLabel}>
                    <Icon name="chartBar" size={14} />
                    Metrics ({inheritedFields?.metrics?.length || 0})
                  </h5>
                  <div className={styles.recommendedFields}>
                    {inheritedFields?.metrics?.map(id => (
                      <span key={id} className={`${styles.fieldChip} ${styles.inheritedChip}`}>{id}</span>
                    ))}
                  </div>
                </div>
              </div>

              {!isApproved && (
                <Button
                  onClick={handleUseInherited}
                  variant="primary"
                  className={styles.approveButton}
                >
                  <PSXSprite sprite="star" size="xs" ariaLabel="Use" />
                  Use Inherited
                </Button>
              )}
            </Card>
          )}

          {/* Standard recommended fields */}
          <p className={styles.recommendedHint}>
            {hasInheritedSelections ? 'Or use' : 'Use'} the most common fields for {getPlatformDisplayName(activePlatform)}. These fields cover typical reporting needs.
          </p>

          <Card className={styles.recommendedPreview}>
            <div className={styles.recommendedSection}>
              <h5 className={styles.recommendedLabel}>
                <Icon name="tag" size={14} />
                Dimensions ({COMMON_DIMENSIONS.length})
              </h5>
              <div className={styles.recommendedFields}>
                {COMMON_DIMENSIONS.map(id => (
                  <span key={id} className={styles.fieldChip}>{id}</span>
                ))}
              </div>
            </div>

            <div className={styles.recommendedSection}>
              <h5 className={styles.recommendedLabel}>
                <Icon name="chartBar" size={14} />
                Metrics ({COMMON_METRICS.length})
              </h5>
              <div className={styles.recommendedFields}>
                {COMMON_METRICS.map(id => (
                  <span key={id} className={styles.fieldChip}>{id}</span>
                ))}
              </div>
            </div>
          </Card>

          {isApproved ? (
            <div className={styles.approved}>
              <PSXSprite sprite="coin" size="sm" ariaLabel="Approved" />
              <span>Configuration Approved for {getPlatformDisplayName(activePlatform)}</span>
            </div>
          ) : (
            <Button
              onClick={handleUseRecommended}
              variant="secondary"
              className={styles.approveButton}
            >
              <PSXSprite sprite="coin" size="xs" ariaLabel="Use" />
              Use Recommended
            </Button>
          )}
        </div>
      )}

      {/* CUSTOM MODE - Full FieldSelector */}
      {fieldMode === 'custom' && (
        <FieldSelector
          platformId={activePlatform}
          selectedDimensions={platformSelection.dimensions}
          selectedMetrics={platformSelection.metrics}
          onDimensionsChange={handleDimensionsChange}
          onMetricsChange={handleMetricsChange}
        />
      )}
    </div>
  );
}

FieldSelectionStep.propTypes = {
  data: PropTypes.shape({
    selectedPlatforms: PropTypes.arrayOf(PropTypes.string),
    fieldSelections: PropTypes.objectOf(
      PropTypes.shape({
        dimensions: PropTypes.arrayOf(PropTypes.string),
        metrics: PropTypes.arrayOf(PropTypes.string)
      })
    ),
    inheritedSelections: PropTypes.objectOf(
      PropTypes.shape({
        dimensions: PropTypes.arrayOf(PropTypes.string),
        metrics: PropTypes.arrayOf(PropTypes.string)
      })
    )
  }).isRequired,
  onChange: PropTypes.func.isRequired
};
