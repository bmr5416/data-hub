import { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useWarehouses } from '../../hooks/useWarehouse';
import Wizard from '../wizard/Wizard';
import SourceSelectionStep from './steps/SourceSelectionStep';
import FieldSelectionStep from './steps/FieldSelectionStep';
import ReviewStep from './steps/ReviewStep';
import styles from './CreateWarehouseWizard.module.css';

/**
 * Unified Data Warehouse Creation Wizard
 *
 * Supports two modes:
 * - standalone: Full wizard with title/subtitle (used from ClientDetail page)
 * - embedded: Compact mode for embedding in other wizards (used in SourceWizard)
 *
 * Features:
 * - Multi-platform selection from client's existing data sources
 * - Optional pre-selection of platforms via initialPlatforms
 * - Optional field inheritance via inheritedSelections
 */
export default function CreateWarehouseWizard({
  clientId,
  clientName = '',
  clientSources = [],
  onComplete,
  onCancel,
  mode = 'standalone',
  compact = false,
  initialPlatforms = [],
  inheritedSelections = null
}) {
  const { createWarehouse } = useWarehouses(clientId);

  // Extract unique platform IDs from client's data sources
  // Handle both 'platform_id' (from SourceWizard) and 'platform' (from existing sources)
  const allowedPlatformIds = useMemo(() =>
    [...new Set(clientSources.map(source => source.platform_id || source.platform))],
    [clientSources]
  );

  // Default warehouse name based on client name
  const defaultWarehouseName = useMemo(() =>
    clientName ? `${clientName} Data Warehouse` : 'Data Warehouse',
    [clientName]
  );

  const steps = [
    {
      id: 'sources',
      title: 'Select Sources',
      component: SourceSelectionStep,
      isValid: (data) => {
        return data.selectedPlatforms && data.selectedPlatforms.length > 0;
      }
    },
    {
      id: 'fields',
      title: 'Select Fields',
      component: FieldSelectionStep,
      isValid: (data) => {
        // All selected platforms must have at least 1 dimension and 1 metric
        if (!data.selectedPlatforms || !data.fieldSelections) {
          return false;
        }

        return data.selectedPlatforms.every(platformId => {
          const selection = data.fieldSelections[platformId];
          return selection &&
                 selection.dimensions && selection.dimensions.length > 0 &&
                 selection.metrics && selection.metrics.length > 0;
        });
      }
    },
    {
      id: 'review',
      title: 'Review & Create',
      component: ReviewStep,
      isValid: () => true // Always valid - optional fields
    }
  ];

  // Memoize initial data to prevent unnecessary re-renders and stale closures
  const initialData = useMemo(() => {
    // Build initial data with pre-selections if provided
    const initialFieldSelections = {};

    // Pre-populate field selections from inheritedSelections
    if (inheritedSelections) {
      Object.entries(inheritedSelections).forEach(([platformId, selections]) => {
        if (selections && (selections.dimensions?.length > 0 || selections.metrics?.length > 0)) {
          initialFieldSelections[platformId] = {
            dimensions: [...(selections.dimensions || [])],
            metrics: [...(selections.metrics || [])]
          };
        }
      });
    }

    return {
      selectedPlatforms: initialPlatforms.length > 0 ? [...initialPlatforms] : [],
      fieldSelections: initialFieldSelections,
      warehouseName: '',
      includeBlendedTable: true,
      // Pass to steps for filtering and display
      allowedPlatformIds,
      clientSources,
      clientName,
      defaultWarehouseName,
      initialPlatforms, // So SourceSelectionStep can show pre-selected indicator
      inheritedSelections // So FieldSelectionStep can show inherited indicator
    };
  }, [allowedPlatformIds, clientSources, clientName, defaultWarehouseName, initialPlatforms, inheritedSelections]);

  const handleComplete = useCallback(async (data) => {
    try {
      // Create warehouse via API
      const warehouse = await createWarehouse({
        name: data.warehouseName,
        platforms: data.selectedPlatforms,
        fieldSelections: data.fieldSelections,
        includeBlendedTable: data.includeBlendedTable
      });

      // Call onComplete callback with the created warehouse
      if (onComplete) {
        onComplete(warehouse);
      }
    } catch (error) {
      throw new Error(`Failed to create warehouse: ${error.message}`);
    }
  }, [createWarehouse, onComplete]);

  // Determine title and subtitle based on mode
  const showHeader = mode === 'standalone' && !compact;
  const title = showHeader ? 'Create Data Warehouse' : null;
  const subtitle = showHeader
    ? 'Set up a new data warehouse for organizing your marketing data'
    : null;

  const containerClass = compact
    ? `${styles.container} ${styles.compact}`
    : styles.container;

  return (
    <div className={containerClass}>
      <Wizard
        steps={steps}
        initialData={initialData}
        onComplete={handleComplete}
        onCancel={onCancel}
        title={title}
        subtitle={subtitle}
        className={compact ? styles.compactWizard : undefined}
      />
    </div>
  );
}

CreateWarehouseWizard.propTypes = {
  // Required props
  clientId: PropTypes.string.isRequired,
  clientSources: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    // Support both 'platform_id' (from SourceWizard) and 'platform' (from existing sources)
    platform_id: PropTypes.string,
    platform: PropTypes.string,
    platform_name: PropTypes.string,
    name: PropTypes.string,
    status: PropTypes.string,
    last_upload_at: PropTypes.string,
    created_at: PropTypes.string
  })).isRequired,
  onComplete: PropTypes.func.isRequired,
  onCancel: PropTypes.func,

  // Optional props
  clientName: PropTypes.string,
  mode: PropTypes.oneOf(['standalone', 'embedded']),
  compact: PropTypes.bool,
  initialPlatforms: PropTypes.arrayOf(PropTypes.string),
  inheritedSelections: PropTypes.objectOf(
    PropTypes.shape({
      dimensions: PropTypes.arrayOf(PropTypes.string),
      metrics: PropTypes.arrayOf(PropTypes.string)
    })
  )
};
