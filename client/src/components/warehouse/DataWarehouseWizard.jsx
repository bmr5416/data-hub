import PropTypes from 'prop-types';
import CreateWarehouseWizard from './CreateWarehouseWizard';

/**
 * Data Warehouse Creation Wizard (Standalone)
 *
 * Thin wrapper around CreateWarehouseWizard for backwards compatibility.
 * Used from the ClientDetail page to create new warehouses.
 *
 * Features:
 * - Multi-platform selection from client's existing data sources
 * - Per-platform field configuration with Recommended/Custom modes
 * - Schema preview with optional blended data tab
 */
export default function DataWarehouseWizard({
  clientId,
  clientName,
  clientSources = [],
  onComplete,
  onCancel
}) {
  return (
    <CreateWarehouseWizard
      mode="standalone"
      clientId={clientId}
      clientName={clientName}
      clientSources={clientSources}
      onComplete={onComplete}
      onCancel={onCancel}
    />
  );
}

DataWarehouseWizard.propTypes = {
  clientId: PropTypes.string.isRequired,
  clientName: PropTypes.string,
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
  onCancel: PropTypes.func
};
