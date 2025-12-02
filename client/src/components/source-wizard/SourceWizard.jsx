import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useWarehouses } from '../../hooks/useWarehouse';
import Wizard from '../wizard/Wizard';
import PlatformSelectStep from './steps/PlatformSelectStep';
import FieldConfigurationStep from './steps/FieldConfigurationStep';
import WarehouseSelectionStep from './steps/WarehouseSelectionStep';
import DataUploadStep from './steps/DataUploadStep';

/**
 * Source Wizard
 *
 * Guides users through adding a new data source:
 * 1. Select platform (Meta Ads, Google Ads, GA4, TikTok, Shopify, Custom)
 * 2. Preview and approve schema
 * 3. Associate with data warehouse (create new, add to existing, or skip)
 * 4. Upload data
 */
export default function SourceWizard({ clientId, clientName, existingSources, onComplete, onCancel }) {
  // Fetch warehouses once at the wizard level to prevent Step 3 refetch issues
  const { warehouses, loading: warehousesLoading } = useWarehouses(clientId);

  // Derive added platforms from existing sources (for warning badges)
  const addedPlatforms = useMemo(() => {
    if (!existingSources || existingSources.length === 0) return [];
    const platforms = existingSources.map(s => s.platform);
    return [...new Set(platforms)]; // Dedupe
  }, [existingSources]);

  const steps = [
    {
      id: 'platform',
      title: 'Select Platform',
      component: PlatformSelectStep,
      isValid: (data) => {
        return Boolean(data.selectedPlatform && data.selectedPlatform.length > 0);
      }
    },
    {
      id: 'schema',
      title: 'Configure Fields',
      component: FieldConfigurationStep,
      isValid: (data) => {
        // Schema must be approved with at least 1 dimension and 1 metric
        return data.schemaApproved === true &&
               data.schema?.dimensions?.length > 0 &&
               data.schema?.metrics?.length > 0;
      }
    },
    {
      id: 'warehouse',
      title: 'Data Warehouse',
      component: WarehouseSelectionStep,
      isValid: (data) => {
        // Skip is always valid
        if (data.warehouseOption === 'skip') return true;
        // Create/existing require warehouseReady
        return data.warehouseReady === true;
      }
    },
    {
      id: 'upload',
      title: 'Upload Data',
      component: DataUploadStep,
      isValid: (data) => {
        // User must confirm data upload
        return data.dataUploaded === true;
      }
    }
  ];

  // Memoize initialData to prevent unnecessary wizard resets
  const initialData = useMemo(() => ({
    clientId,
    clientName,
    addedPlatforms,
    // Pass warehouses to avoid refetching in Step 3
    warehouses: warehouses || [],
    selectedPlatform: '',
    schema: null,
    schemaApproved: false,
    // Field selections for warehouse creation (from Step 2)
    fieldSelections: null,
    // Warehouse-related fields
    warehouseOption: null,      // 'create' | 'existing' | 'skip'
    warehouseId: null,
    warehouseName: '',
    includeBlendedTable: true,
    warehouseReady: false,
    dataUploaded: false
  }), [clientId, clientName, addedPlatforms, warehouses]);

  // Wait for warehouses to be loaded before rendering wizard
  if (warehousesLoading) {
    return null;
  }

  const handleComplete = async (data) => {
    // Call the parent onComplete with the source data
    if (onComplete) {
      onComplete({
        platformId: data.selectedPlatform,
        schema: data.schema,
        warehouseId: data.warehouseId,
        warehouseOption: data.warehouseOption,
      });
    }
  };

  return (
    <Wizard
      steps={steps}
      initialData={initialData}
      onComplete={handleComplete}
      onCancel={onCancel}
      title="Add Data Source"
      subtitle="Connect a new platform data source to your client"
    />
  );
}

SourceWizard.propTypes = {
  clientId: PropTypes.string.isRequired,
  clientName: PropTypes.string.isRequired,
  existingSources: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    platform: PropTypes.string
  })),
  onComplete: PropTypes.func,
  onCancel: PropTypes.func
};
