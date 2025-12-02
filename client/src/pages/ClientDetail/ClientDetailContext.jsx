/**
 * ClientDetail Context
 *
 * Centralized state management for the client detail page.
 * Manages modal states, active tab, and provides actions.
 */

import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';

const ClientDetailContext = createContext(null);

/**
 * Modal types
 */
export const MODAL_TYPES = {
  SOURCE_WIZARD: 'sourceWizard',
  SOURCE_DETAIL: 'sourceDetail',
  ETL_FORM: 'etlForm',
  KPI_FORM: 'kpiForm',
  REPORT_FORM: 'reportForm',
  WAREHOUSE_WIZARD: 'warehouseWizard',
  WAREHOUSE_DETAIL: 'warehouseDetail',
  PLATFORM_DATA_SELECTION: 'platformDataSelection',
  CSV_PREVIEW: 'csvPreview',
  ADD_LINEAGE: 'addLineage',
};

/**
 * Tab definitions
 */
export const TABS = [
  { id: 'sources', label: 'Data Sources' },
  { id: 'etl', label: 'ETL Processes' },
  { id: 'kpis', label: 'KPIs' },
  { id: 'reports', label: 'Reports' },
  { id: 'warehouse', label: 'Data Warehouse' },
  { id: 'lineage', label: 'Data Lineage' },
];

export function ClientDetailProvider({
  children,
  clientId,
  client,
  warehouses,
  lineage,
}) {
  // Active tab state
  const [activeTab, setActiveTab] = useState('sources');

  // Modal states - each modal tracks open state and any associated data
  const [modals, setModals] = useState({
    [MODAL_TYPES.SOURCE_WIZARD]: { open: false },
    [MODAL_TYPES.SOURCE_DETAIL]: { open: false, sourceId: null },
    [MODAL_TYPES.ETL_FORM]: { open: false },
    [MODAL_TYPES.KPI_FORM]: { open: false },
    [MODAL_TYPES.REPORT_FORM]: { open: false },
    [MODAL_TYPES.WAREHOUSE_WIZARD]: { open: false },
    [MODAL_TYPES.WAREHOUSE_DETAIL]: { open: false, warehouseId: null },
    [MODAL_TYPES.PLATFORM_DATA_SELECTION]: { open: false },
    [MODAL_TYPES.CSV_PREVIEW]: { open: false, config: null },
    [MODAL_TYPES.ADD_LINEAGE]: { open: false },
  });

  // Open a modal
  const openModal = useCallback((type, data = {}) => {
    setModals((prev) => ({
      ...prev,
      [type]: { open: true, ...data },
    }));
  }, []);

  // Close a modal and reset its data
  const closeModal = useCallback((type) => {
    setModals((prev) => ({
      ...prev,
      [type]: { open: false },
    }));
  }, []);

  // Check if a modal is open
  const isModalOpen = useCallback((type) => modals[type]?.open, [modals]);

  // Get modal data
  const getModalData = useCallback((type) => modals[type], [modals]);

  // Calculate counts for tabs
  const counts = useMemo(() => ({
    sources: client?.sources?.length || 0,
    etl: client?.etlProcesses?.length || 0,
    kpis: client?.kpis?.length || 0,
    reports: client?.reports?.length || 0,
    warehouse: warehouses?.length || 0,
    lineage: lineage?.length || 0,
  }), [client, warehouses, lineage]);

  const value = useMemo(() => ({
    clientId,
    client,
    warehouses,
    lineage,
    activeTab,
    setActiveTab,
    counts,
    modals,
    openModal,
    closeModal,
    isModalOpen,
    getModalData,
  }), [
    clientId,
    client,
    warehouses,
    lineage,
    activeTab,
    counts,
    modals,
    openModal,
    closeModal,
    isModalOpen,
    getModalData,
  ]);

  return (
    <ClientDetailContext.Provider value={value}>
      {children}
    </ClientDetailContext.Provider>
  );
}

ClientDetailProvider.propTypes = {
  children: PropTypes.node.isRequired,
  clientId: PropTypes.string.isRequired,
  client: PropTypes.object,
  warehouses: PropTypes.array,
  lineage: PropTypes.array,
};

/**
 * Hook to access client detail context
 */
export function useClientDetailContext() {
  const context = useContext(ClientDetailContext);
  if (!context) {
    throw new Error('useClientDetailContext must be used within ClientDetailProvider');
  }
  return context;
}
