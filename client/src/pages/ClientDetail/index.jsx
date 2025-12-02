/**
 * Client Detail Page
 *
 * Main page component that displays client details with tabs for:
 * - Data Sources
 * - ETL Processes
 * - KPIs
 * - Reports
 * - Data Warehouse
 * - Data Lineage
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useClient } from '../../hooks/useClients';
import { capitalize } from '../../utils/string';
import { useWarehouses, useWarehouse } from '../../hooks/useWarehouse';
import { useMinLoadingTime } from '../../hooks/useMinLoadingTime';
import { usePlatforms } from '../../hooks/usePlatforms';
import { useLineage } from '../../hooks/useLineage';
import { useNotification } from '../../hooks/useNotification';
import { useAudio } from '../../hooks/useAudio';
import api from '../../services/api';
import { ROUTES } from '../../constants/routes';

// Common components
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Icon from '../../components/common/Icon';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingAnimation from '../../components/common/LoadingAnimation';
import Modal from '../../components/common/Modal';
import ErrorMessage from '../../components/common/ErrorMessage';
import ConfirmDeleteModal from '../../components/common/ConfirmDeleteModal';

// Feature components
import DataWarehouseWizard from '../../components/warehouse/DataWarehouseWizard';
import WarehouseDetailModal from '../../components/warehouse/WarehouseDetailModal';
import SourceDetailModal from '../../components/source/SourceDetailModal';
import PlatformDataSelectionModal from '../../components/platform-data/PlatformDataSelectionModal';
import CSVPreviewModal from '../../components/platform-data/CSVPreviewModal';
import { SourceWizard } from '../../components/source-wizard';
import { ETLForm, KPIForm } from '../../components/forms';
import { LineageList, AddLineageModal } from '../../components/lineage';
import ReportDetailModal from '../../components/report-builder/ReportDetailModal';
import ReportBuilderWizard from '../../components/report-builder/ReportBuilderWizard';
import { EditClientModal } from '../../components/client';
import { reportsApi, clientsApi } from '../../services/api';

// Tab components
import { SourcesTab, ETLTab, KPIsTab, ReportsTab, WarehousesTab } from './tabs';

// Context
import { ClientDetailProvider, TABS } from './ClientDetailContext';

import styles from '../ClientDetail.module.css';
import anim from '../../styles/animations.module.css';

export default function ClientDetail() {
  const { clientId } = useParams();
  const navigate = useNavigate();

  // Data hooks
  const {
    client,
    loading,
    error,
    refetch: refetchClient,
    addSource,
    addETL,
    addKPI,
    addReport,
    deleteSource,
    deleteETL,
    updateKPI,
    deleteKPI,
    deleteReport,
  } = useClient(clientId);
  const { warehouses } = useWarehouses(clientId);
  const { platforms } = usePlatforms();
  const { showError } = useNotification();
  const showLoading = useMinLoadingTime(loading);

  // Tab state
  const [activeTab, setActiveTab] = useState('sources');
  const { playTab } = useAudio();

  const handleTabChange = useCallback((tabId) => {
    playTab();
    setActiveTab(tabId);
  }, [playTab]);

  // Modal states
  const [showForm, setShowForm] = useState(null);
  const [showWarehouseWizard, setShowWarehouseWizard] = useState(false);
  const [showSourceWizard, setShowSourceWizard] = useState(false);
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(null);
  const [selectedSourceId, setSelectedSourceId] = useState(null);
  const [showPlatformDataSelection, setShowPlatformDataSelection] = useState(false);
  const [csvPreviewConfig, setCSVPreviewConfig] = useState(null);
  const [showAddLineageModal, setShowAddLineageModal] = useState(false);
  const [platformDataInfo, setPlatformDataInfo] = useState(null);
  const [editingKPI, setEditingKPI] = useState(null);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [showReportBuilderWizard, setShowReportBuilderWizard] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Lineage hook
  const {
    lineage,
    loading: lineageLoading,
    error: lineageError,
    fetchLineage,
    createConnection,
    deleteConnection,
  } = useLineage(clientId);

  // Warehouse detail hook
  const {
    warehouse: selectedWarehouse,
    loading: warehouseLoading,
    updateWarehouse,
    deleteWarehouse,
  } = useWarehouse(selectedWarehouseId);

  // Fetch platform data info
  useEffect(() => {
    const fetchPlatformDataInfo = async () => {
      try {
        const response = await api.get(`/clients/${clientId}/data`);
        if (response.hasPlatformData) {
          setPlatformDataInfo(response);
        }
      } catch {
        // No platform data yet
      }
    };

    if (clientId) {
      fetchPlatformDataInfo();
    }
  }, [clientId]);

  // Fetch report details when selected
  useEffect(() => {
    const fetchReportDetails = async () => {
      if (!selectedReportId) {
        setSelectedReport(null);
        return;
      }

      setReportLoading(true);
      try {
        const response = await reportsApi.get(selectedReportId);
        setSelectedReport(response.report);
      } catch {
        setSelectedReport(null);
      } finally {
        setReportLoading(false);
      }
    };

    fetchReportDetails();
  }, [selectedReportId]);

  // Handle client deletion (must be before early returns)
  const handleDeleteClient = useCallback(async () => {
    setDeleteLoading(true);
    try {
      await clientsApi.delete(clientId);
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (err) {
      showError(err.message || 'Failed to delete client');
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  }, [clientId, navigate, showError]);

  // Loading state
  if (showLoading) {
    return <LoadingAnimation />;
  }

  // Error state
  if (error) {
    return (
      <div className={styles.container}>
        <ErrorMessage
          error={error}
          variant="full"
          title="Failed to Load Client"
          onRetry={refetchClient}
        />
      </div>
    );
  }

  // Not found state
  if (!client) {
    return (
      <div className={styles.container}>
        <ErrorMessage
          error="The client you're looking for doesn't exist or has been deleted."
          variant="full"
          title="Client Not Found"
          status={404}
        />
      </div>
    );
  }

  // Derived data
  const selectedSource = client.sources?.find((s) => s.id === selectedSourceId);
  const counts = {
    sources: client.sources?.length || 0,
    etl: client.etlProcesses?.length || 0,
    kpis: client.kpis?.length || 0,
    reports: client.reports?.length || 0,
    warehouse: warehouses?.length || 0,
    lineage: lineage?.length || 0,
  };

  // Form submission handler
  const handleFormSubmit = async (type, data) => {
    switch (type) {
      case 'source':
        await addSource(data);
        break;
      case 'etl':
        await addETL(data);
        break;
      case 'kpi':
        await addKPI(data);
        break;
      case 'report':
        await addReport(data);
        break;
    }
    setShowForm(null);
  };

  // Source wizard completion handler
  const handleSourceWizardComplete = async (sourceData) => {
    const platform = platforms?.find((p) => p.id === sourceData.platformId);
    const platformName = platform?.name || sourceData.platformId;

    await addSource({
      name: platformName,
      platform: sourceData.platformId,
      sourceType: 'warehouse',
      connectionMethod: 'manual_upload',
      refreshFrequency: 'manual',
      status: 'connected',
      notes: sourceData.warehouseId
        ? `Warehouse ID: ${sourceData.warehouseId}`
        : 'No warehouse associated',
    });
    setShowSourceWizard(false);
  };

  return (
    <ClientDetailProvider
      clientId={clientId}
      client={client}
      warehouses={warehouses}
      lineage={lineage}
    >
      <div className={styles.container}>
        {/* Back link */}
        <Link to={ROUTES.DASHBOARD} className={`${styles.backLink} ${anim.fadeIn}`}>
          &larr; Back to Dashboard
        </Link>

        {/* Header */}
        <header className={`${styles.header} ${anim.slideUp}`}>
          <div className={styles.clientInfo}>
            <h1>{client.name}</h1>
            <div className={styles.clientMeta}>
              <span className={styles.email}>{client.email}</span>
              <span className={styles.industry}>{client.industry || 'Other'}</span>
            </div>
          </div>
          <div className={styles.headerActions}>
            {platformDataInfo && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowPlatformDataSelection(true)}
                className={styles.platformDataLink}
              >
                <Icon name="file" size={16} />
                View Platform Data
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowEditClientModal(true)}
            >
              <Icon name="edit" size={16} />
              Edit Client
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Icon name="trash" size={16} />
              Delete
            </Button>
            <StatusBadge status={client.status} size="lg" />
          </div>
        </header>

        {/* Notes card */}
        {client.notes && (
          <Card className={`${styles.notesCard} ${anim.slideUpDelay1}`}>
            <strong>Notes:</strong> {client.notes}
          </Card>
        )}

        {/* Tab bar */}
        <div
          className={`${styles.tabs} ${anim.slideUpDelay1}`}
          role="tablist"
          aria-label="Client data sections"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              id={`${tab.id}-tab`}
              aria-selected={activeTab === tab.id}
              aria-controls={`${tab.id}-panel`}
              className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.label}
              <span className={styles.tabCount}>{counts[tab.id]}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <section
          className={`${styles.section} ${anim.slideUpDelay2}`}
          role="tabpanel"
          id={`${activeTab}-panel`}
          aria-labelledby={`${activeTab}-tab`}
        >
          <div className={styles.sectionHeader}>
            <h2>{TABS.find((t) => t.id === activeTab)?.label}</h2>
            {activeTab === 'sources' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowSourceWizard(true)}
              >
                + Add Source
              </Button>
            )}
            {activeTab === 'reports' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowReportBuilderWizard(true)}
              >
                + Add Report
              </Button>
            )}
            {activeTab !== 'warehouse' && activeTab !== 'sources' && activeTab !== 'lineage' && activeTab !== 'reports' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowForm(activeTab)}
              >
                + Add {activeTab === 'etl' ? 'ETL' : capitalize(activeTab.slice(0, -1))}
              </Button>
            )}
          </div>

          {/* Tab content components */}
          {activeTab === 'sources' && (
            <SourcesTab
              sources={client.sources || []}
              onDelete={deleteSource}
              onViewDetails={(id) => setSelectedSourceId(id)}
            />
          )}
          {activeTab === 'etl' && (
            <ETLTab etlProcesses={client.etlProcesses || []} onDelete={deleteETL} />
          )}
          {activeTab === 'kpis' && (
            <KPIsTab
              kpis={client.kpis || []}
              onEdit={(kpi) => setEditingKPI(kpi)}
              onDelete={deleteKPI}
            />
          )}
          {activeTab === 'reports' && (
            <ReportsTab
              reports={client.reports || []}
              onViewDetails={(id) => setSelectedReportId(id)}
              onDelete={deleteReport}
            />
          )}
          {activeTab === 'warehouse' && (
            <WarehousesTab
              warehouses={warehouses || []}
              onCreateWarehouse={() => setShowWarehouseWizard(true)}
              onViewDetails={(id) => setSelectedWarehouseId(id)}
            />
          )}
          {activeTab === 'lineage' && (
            <LineageList
              lineage={lineage}
              loading={lineageLoading}
              error={lineageError}
              sources={client.sources || []}
              etlProcesses={client.etlProcesses || []}
              kpis={client.kpis || []}
              reports={client.reports || []}
              onFetch={fetchLineage}
              onDelete={deleteConnection}
              onAddClick={() => setShowAddLineageModal(true)}
            />
          )}
        </section>

        {/* Modals */}
        <Modal
          isOpen={showSourceWizard}
          onClose={() => setShowSourceWizard(false)}
          size="lg"
          variant="wizard"
        >
          <SourceWizard
            clientId={clientId}
            clientName={client.name}
            existingSources={client.sources || []}
            onComplete={handleSourceWizardComplete}
            onCancel={() => setShowSourceWizard(false)}
          />
        </Modal>

        {showForm === 'etl' && (
          <ETLForm
            onSubmit={(data) => handleFormSubmit('etl', data)}
            onClose={() => setShowForm(null)}
          />
        )}
        {showForm === 'kpis' && (
          <KPIForm
            onSubmit={(data) => handleFormSubmit('kpi', data)}
            onClose={() => setShowForm(null)}
          />
        )}
        {editingKPI && (
          <KPIForm
            initialData={editingKPI}
            onSubmit={async (data) => {
              await updateKPI(editingKPI.id, data);
              setEditingKPI(null);
            }}
            onClose={() => setEditingKPI(null)}
          />
        )}

        <Modal
          isOpen={showReportBuilderWizard}
          onClose={() => setShowReportBuilderWizard(false)}
          size="lg"
          variant="wizard"
        >
          <ReportBuilderWizard
            clientId={clientId}
            warehouses={warehouses || []}
            onComplete={() => {
              setShowReportBuilderWizard(false);
              setActiveTab('reports');
            }}
            onCancel={() => setShowReportBuilderWizard(false)}
          />
        </Modal>

        <Modal
          isOpen={showWarehouseWizard}
          onClose={() => setShowWarehouseWizard(false)}
          size="lg"
          variant="wizard"
        >
          <DataWarehouseWizard
            clientId={clientId}
            clientSources={client.sources || []}
            onComplete={() => {
              setShowWarehouseWizard(false);
              setActiveTab('warehouse');
            }}
            onCancel={() => setShowWarehouseWizard(false)}
          />
        </Modal>

        <WarehouseDetailModal
          isOpen={!!selectedWarehouseId}
          warehouse={selectedWarehouse}
          clientId={clientId}
          loading={warehouseLoading}
          onClose={() => setSelectedWarehouseId(null)}
          onUpdate={updateWarehouse}
          onDelete={async () => {
            await deleteWarehouse();
            setSelectedWarehouseId(null);
          }}
        />

        <SourceDetailModal
          isOpen={!!selectedSourceId && !!selectedSource}
          source={selectedSource}
          clientId={clientId}
          onClose={() => setSelectedSourceId(null)}
        />

        <PlatformDataSelectionModal
          isOpen={showPlatformDataSelection}
          clientId={clientId}
          platformDataInfo={platformDataInfo}
          onSelect={(selection) => {
            setShowPlatformDataSelection(false);
            setCSVPreviewConfig(selection);
          }}
          onClose={() => setShowPlatformDataSelection(false)}
        />

        <CSVPreviewModal
          isOpen={!!csvPreviewConfig}
          clientId={clientId}
          dataType={csvPreviewConfig?.type}
          platformId={csvPreviewConfig?.platformId}
          platformName={csvPreviewConfig?.platformName}
          onClose={() => setCSVPreviewConfig(null)}
        />

        <AddLineageModal
          isOpen={showAddLineageModal}
          sources={client.sources || []}
          etlProcesses={client.etlProcesses || []}
          kpis={client.kpis || []}
          reports={client.reports || []}
          onSubmit={createConnection}
          onClose={() => setShowAddLineageModal(false)}
        />

        {selectedReportId && (
          <ReportDetailModal
            report={selectedReport}
            loading={reportLoading}
            onClose={() => setSelectedReportId(null)}
            onUpdate={async (data) => {
              await reportsApi.update(selectedReportId, data);
              setSelectedReport((prev) => ({ ...prev, ...data }));
            }}
            onDelete={async () => {
              await deleteReport(selectedReportId);
              setSelectedReportId(null);
            }}
            onSendTest={async (email) => {
              await reportsApi.sendTest(selectedReportId, email);
            }}
            onSendNow={async () => {
              await reportsApi.sendNow(selectedReportId);
            }}
          />
        )}

        <EditClientModal
          isOpen={showEditClientModal}
          client={client}
          onSuccess={() => {
            setShowEditClientModal(false);
            refetchClient();
          }}
          onCancel={() => setShowEditClientModal(false)}
        />

        <ConfirmDeleteModal
          isOpen={showDeleteConfirm}
          entityType="Client"
          entityName={client?.name || ''}
          onConfirm={handleDeleteClient}
          onCancel={() => setShowDeleteConfirm(false)}
          loading={deleteLoading}
        />
      </div>
    </ClientDetailProvider>
  );
}
