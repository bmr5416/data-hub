import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { warehouseApi, workbookApi } from '../../../services/api';
import { useAudio } from '../../../hooks/useAudio';
import CreateWarehouseWizard from '../../warehouse/CreateWarehouseWizard';
import Button from '../../common/Button';
import Icon from '../../common/Icon';
import PSXSprite from '../../common/PSXSprite';
import { useNotification } from '../../../hooks/useNotification';
import styles from './WarehouseSelectionStep.module.css';

/**
 * Step 3: Data Warehouse Selection
 *
 * Offers three options for associating the new data source with a warehouse:
 * 1. Create New Warehouse - Uses embedded CreateWarehouseWizard
 * 2. Add to Existing Warehouse - Adds platform to an existing warehouse
 * 3. Skip for Now - Proceed without warehouse association
 */
export default function WarehouseSelectionStep({ data, onChange }) {
  const { showError } = useNotification();
  const { playClick } = useAudio();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [selectedWarehouseDetails, setSelectedWarehouseDetails] = useState(null);

  // Use warehouses passed from parent (SourceWizard) to avoid refetch issues
  const warehouses = data.warehouses || [];

  const currentOption = data.warehouseOption;
  const hasExistingWarehouses = warehouses.length > 0;

  // Fetch warehouse details when one is selected
  useEffect(() => {
    const fetchDetails = async () => {
      if (data.warehouseId && currentOption === 'existing') {
        try {
          const response = await warehouseApi.get(data.warehouseId);
          setSelectedWarehouseDetails(response.warehouse);
        } catch (err) {
          showError(err.message || 'Failed to load warehouse details');
        }
      }
    };
    fetchDetails();
  }, [data.warehouseId, currentOption, showError]);

  // Handle option selection
  const handleOptionSelect = useCallback((option) => {
    playClick();
    setError(null);
    onChange({
      warehouseOption: option,
      warehouseReady: option === 'skip', // Skip is immediately ready
      warehouseId: option === 'skip' ? null : data.warehouseId,
    });
  }, [playClick, onChange, data.warehouseId]);

  // Handle warehouse selection from dropdown
  const handleWarehouseSelect = useCallback((e) => {
    const warehouseId = e.target.value;
    onChange({
      warehouseId: warehouseId || null,
      warehouseReady: false,
    });
    setSelectedWarehouseDetails(null);
  }, [onChange]);

  // Handle warehouse creation from embedded wizard
  const handleWarehouseCreated = useCallback((warehouse) => {
    onChange({
      warehouseId: warehouse.id,
      warehouseReady: true,
    });
  }, [onChange]);

  // Handle cancel from embedded wizard
  const handleWarehouseCancel = useCallback(() => {
    onChange({ warehouseOption: null });
  }, [onChange]);

  // Add platform to existing warehouse
  const handleAddToWarehouse = useCallback(async () => {
    playClick();
    if (!data.warehouseId) return;

    setCreating(true);
    setError(null);

    try {
      await workbookApi.addPlatform(data.clientId, {
        platformId: data.selectedPlatform,
        schema: data.schema,
      });

      onChange({
        warehouseReady: true,
      });
    } catch (err) {
      setError(`Failed to add platform: ${err.message}`);
    } finally {
      setCreating(false);
    }
  }, [playClick, data, onChange]);

  // Platform display name
  const platformName = data.schema?.platformName || data.selectedPlatform;

  // Build client sources array for the embedded wizard
  // Include the current platform being added plus any other existing sources
  const clientSources = [
    // Current platform being added
    {
      id: `new-${data.selectedPlatform}`,
      platform_id: data.selectedPlatform,
      platform_name: platformName,
      status: 'pending',
      created_at: new Date().toISOString()
    },
    // Plus any other existing sources from the client
    ...(data.sources || []).filter(s => s.platform_id !== data.selectedPlatform)
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Data Warehouse</h3>
        <p className={styles.description}>
          Choose how to associate this {platformName} with a warehouse.
        </p>
      </div>

      {error && (
        <div className={styles.error}>
          <PSXSprite sprite="tubeRed" size="sm" ariaLabel="Error" />
          <span>{error}</span>
        </div>
      )}

      {/* Option 1: Create New Warehouse (with embedded CreateWarehouseWizard) */}
      <div
        className={`${styles.optionCard} ${currentOption === 'create' ? styles.selected : ''}`}
        onClick={() => currentOption !== 'create' && handleOptionSelect('create')}
        role="button"
        tabIndex={currentOption === 'create' ? -1 : 0}
        onKeyDown={(e) => e.key === 'Enter' && currentOption !== 'create' && handleOptionSelect('create')}
        aria-label="Create new warehouse option"
        aria-pressed={currentOption === 'create'}
      >
        <div className={styles.optionHeader}>
          <div className={`${styles.radio} ${currentOption === 'create' ? styles.radioSelected : ''}`} />
          <span className={styles.optionTitle}>Create New Warehouse</span>
        </div>

        {currentOption === 'create' && (
          <div className={styles.optionContent} onClick={(e) => e.stopPropagation()}>
            {data.warehouseReady ? (
              <div className={styles.success}>
                <PSXSprite sprite="coin" size="sm" ariaLabel="Success" />
                <span>Warehouse Created Successfully</span>
              </div>
            ) : (
              <CreateWarehouseWizard
                mode="embedded"
                compact={true}
                clientId={data.clientId}
                clientName={data.clientName}
                clientSources={clientSources}
                initialPlatforms={[data.selectedPlatform]}
                inheritedSelections={data.fieldSelections}
                onComplete={handleWarehouseCreated}
                onCancel={handleWarehouseCancel}
              />
            )}
          </div>
        )}
      </div>

      {/* Option 2: Add to Existing Warehouse */}
      <div
        className={`${styles.optionCard} ${currentOption === 'existing' ? styles.selected : ''} ${!hasExistingWarehouses ? styles.disabled : ''}`}
        onClick={() => hasExistingWarehouses && handleOptionSelect('existing')}
        role="button"
        tabIndex={hasExistingWarehouses ? 0 : -1}
        onKeyDown={(e) => e.key === 'Enter' && hasExistingWarehouses && handleOptionSelect('existing')}
        aria-label="Add to existing warehouse option"
        aria-pressed={currentOption === 'existing'}
        aria-disabled={!hasExistingWarehouses}
      >
        <div className={styles.optionHeader}>
          <div className={`${styles.radio} ${currentOption === 'existing' ? styles.radioSelected : ''}`} />
          <span className={styles.optionTitle}>Add to Existing Warehouse</span>
          {!hasExistingWarehouses && (
            <span className={styles.disabledHint}>(No warehouses exist)</span>
          )}
        </div>

        {currentOption === 'existing' && hasExistingWarehouses && (
          <div className={styles.optionContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="warehouse-select">
                Select Warehouse
              </label>
              <select
                id="warehouse-select"
                className={styles.select}
                value={data.warehouseId || ''}
                onChange={handleWarehouseSelect}
              >
                <option value="">Choose a warehouse...</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.platforms?.length || 0} platforms)
                  </option>
                ))}
              </select>
            </div>

            {selectedWarehouseDetails && (
              <div className={styles.warehouseInfo}>
                <div className={styles.warehouseStats}>
                  <span>
                    <PSXSprite sprite="floppy" size="xs" ariaLabel="Platforms" />
                    {selectedWarehouseDetails.platforms?.length || 0} platforms
                  </span>
                  <span>
                    <PSXSprite sprite="monitor" size="xs" ariaLabel="Fields" />
                    {(selectedWarehouseDetails.canonicalDimensions?.length || 0) +
                     (selectedWarehouseDetails.canonicalMetrics?.length || 0)} fields
                  </span>
                </div>
              </div>
            )}

            {data.warehouseId && !data.warehouseReady ? (
              <Button
                onClick={handleAddToWarehouse}
                variant="primary"
                disabled={creating}
              >
                {creating ? (
                  <>
                    <PSXSprite sprite="hourglass" size="xs" ariaLabel="Adding" />
                    Adding Platform...
                  </>
                ) : (
                  <>
                    <Icon name="plus" size={16} />
                    Add Platform to Warehouse
                  </>
                )}
              </Button>
            ) : data.warehouseReady && (
              <div className={styles.success}>
                <PSXSprite sprite="coin" size="sm" ariaLabel="Success" />
                <span>Platform Added Successfully</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Option 3: Skip for Now */}
      <div
        className={`${styles.optionCard} ${currentOption === 'skip' ? styles.selected : ''}`}
        onClick={() => handleOptionSelect('skip')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleOptionSelect('skip')}
        aria-label="Skip warehouse setup option"
        aria-pressed={currentOption === 'skip'}
      >
        <div className={styles.optionHeader}>
          <div className={`${styles.radio} ${currentOption === 'skip' ? styles.radioSelected : ''}`} />
          <span className={styles.optionTitle}>Skip for Now</span>
        </div>

        {currentOption === 'skip' && (
          <div className={styles.optionContent}>
            <p className={styles.hint}>
              You can associate this source with a warehouse later.
              Data uploads will still work without a warehouse.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

WarehouseSelectionStep.propTypes = {
  data: PropTypes.shape({
    clientId: PropTypes.string.isRequired,
    clientName: PropTypes.string.isRequired,
    selectedPlatform: PropTypes.string.isRequired,
    schema: PropTypes.object.isRequired,
    fieldSelections: PropTypes.object, // From Step 2 (FieldConfigurationStep)
    sources: PropTypes.array, // Client's existing sources
    warehouses: PropTypes.array, // Pre-fetched from SourceWizard
    warehouseOption: PropTypes.oneOf(['create', 'existing', 'skip']),
    warehouseId: PropTypes.string,
    warehouseName: PropTypes.string,
    includeBlendedTable: PropTypes.bool,
    warehouseReady: PropTypes.bool,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
};
