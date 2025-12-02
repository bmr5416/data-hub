import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useClients } from '../hooks/useClients';
import { useMinLoadingTime } from '../hooks/useMinLoadingTime';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import StatusBadge from '../components/common/StatusBadge';
import LoadingAnimation from '../components/common/LoadingAnimation';
import ErrorMessage from '../components/common/ErrorMessage';
import { AddClientModal } from '../components/client';
import { ROUTES, clientDetailRoute } from '../constants/routes';
import styles from './Dashboard.module.css';
import anim from '../styles/animations.module.css';

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'onboarding', label: 'Onboarding' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { clients, loading, error, refetch } = useClients();
  const showLoading = useMinLoadingTime(loading);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef(null);

  // Handle redirect from /clients/new route
  useEffect(() => {
    if (location.state?.openAddClientModal) {
      setShowAddClientModal(true);
      // Clear the state to prevent re-opening on refresh
      navigate(ROUTES.DASHBOARD, { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchTerm]);

  // Filter clients based on search and status
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      // Status filter
      if (statusFilter && client.status !== statusFilter) {
        return false;
      }
      // Search filter
      if (debouncedSearch) {
        const search = debouncedSearch.toLowerCase();
        const matchesName = client.name?.toLowerCase().includes(search);
        const matchesEmail = client.email?.toLowerCase().includes(search);
        const matchesIndustry = client.industry?.toLowerCase().includes(search);
        if (!matchesName && !matchesEmail && !matchesIndustry) {
          return false;
        }
      }
      return true;
    });
  }, [clients, statusFilter, debouncedSearch]);

  const hasActiveFilters = searchTerm || statusFilter;

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('');
    setDebouncedSearch('');
  }, []);

  const handleAddClientSuccess = useCallback((client) => {
    setShowAddClientModal(false);
    navigate(clientDetailRoute(client.id));
  }, [navigate]);

  const handleAddClientCancel = useCallback(() => {
    setShowAddClientModal(false);
  }, []);

  const stats = useMemo(() => {
    const totalSources = clients.reduce((sum, c) => sum + (c.sourceCount || 0), 0);
    const totalETL = clients.reduce((sum, c) => sum + (c.etlCount || 0), 0);
    const totalKPIs = clients.reduce((sum, c) => sum + (c.kpiCount || 0), 0);

    return {
      total: clients.length,
      active: clients.filter((c) => c.status === 'active').length,
      sources: totalSources,
      etlProcesses: totalETL,
      kpis: totalKPIs,
    };
  }, [clients]);

  if (showLoading) {
    return <LoadingAnimation />;
  }

  if (error) {
    return (
      <div className={styles.container}>
        <ErrorMessage
          error={error}
          variant="full"
          title="Failed to Load Clients"
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={`${styles.header} ${anim.slideUp}`}>
        <div>
          <h1>Dashboard</h1>
          <p className={styles.subtitle}>Client reporting documentation hub</p>
        </div>
        <Button onClick={() => setShowAddClientModal(true)}>+ Add Client</Button>
      </header>

      <div className={`${styles.stats} ${anim.slideUpDelay1}`}>
        <StatCard label="Total Clients" value={stats.total} />
        <StatCard label="Active" value={stats.active} color="success" />
        <StatCard label="Data Sources" value={stats.sources} color="primary" />
        <StatCard label="ETL Processes" value={stats.etlProcesses} color="gray" />
      </div>

      <section className={`${styles.section} ${anim.slideUpDelay2}`}>
        <div className={styles.sectionHeader}>
          <h2>Clients</h2>
          {clients.length > 0 && (
            <div className={styles.filterBar}>
              <div className={styles.searchWrapper}>
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Search clients"
                />
              </div>
              <select
                className={styles.statusSelect}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by status"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {hasActiveFilters && (
                <Button variant="secondary" size="sm" onClick={handleClearFilters}>
                  Clear
                </Button>
              )}
            </div>
          )}
        </div>
        {clients.length === 0 ? (
          <Card>
            <div className={styles.empty}>
              <p>No clients yet</p>
              <Button onClick={() => setShowAddClientModal(true)}>Add your first client</Button>
            </div>
          </Card>
        ) : filteredClients.length === 0 ? (
          <Card>
            <div className={styles.empty}>
              <p>No clients match your filters</p>
              <Button variant="secondary" onClick={handleClearFilters}>Clear Filters</Button>
            </div>
          </Card>
        ) : (
          <div className={styles.clientList}>
            {filteredClients.map((client, index) => (
              <ClientCard key={client.id} client={client} delay={index} />
            ))}
          </div>
        )}
      </section>

      <AddClientModal
        isOpen={showAddClientModal}
        onSuccess={handleAddClientSuccess}
        onCancel={handleAddClientCancel}
      />
    </div>
  );
}

function StatCard({ label, value, color = 'default' }) {
  return (
    <Card
      className={`${styles.statCard} ${styles[color]}`}
      role="region"
      aria-label={`${label}: ${value}`}
    >
      <div className={styles.statValue} aria-hidden="true">{value}</div>
      <div className={styles.statLabel} aria-hidden="true">{label}</div>
    </Card>
  );
}

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  color: PropTypes.oneOf(['default', 'success', 'primary', 'gray']),
};

function ClientCard({ client, delay = 0 }) {
  const delayClass = anim[`scaleInDelay${Math.min(delay, 2)}`] || anim.scaleIn;

  return (
    <Card className={`${styles.clientCard} ${delayClass}`} interactive>
      <Link to={clientDetailRoute(client.id)} className={styles.clientLink}>
        <div className={styles.clientHeader}>
          <div className={styles.clientInfo}>
            <h3>{client.name}</h3>
            <span className={styles.clientEmail}>{client.email}</span>
          </div>
          <StatusBadge status={client.status} size="sm" />
        </div>

        <div className={styles.clientMeta}>
          <span className={styles.industry}>{client.industry || 'Other'}</span>
          <span className={styles.entityCount}>
            {client.sourceCount || 0} sources | {client.etlCount || 0} ETL | {client.kpiCount || 0} KPIs
          </span>
        </div>
      </Link>
    </Card>
  );
}

ClientCard.propTypes = {
  client: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    industry: PropTypes.string,
    sourceCount: PropTypes.number,
    etlCount: PropTypes.number,
    kpiCount: PropTypes.number,
  }).isRequired,
  delay: PropTypes.number,
};
