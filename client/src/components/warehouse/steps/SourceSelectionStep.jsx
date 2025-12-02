import { useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { usePlatforms } from '../../../hooks/usePlatforms';
import { useAudio } from '../../../hooks/useAudio';
import Card from '../../common/Card';
import PSXSprite from '../../common/PSXSprite';
import styles from './SourceSelectionStep.module.css';

/**
 * Step 1: Source Selection
 *
 * Shows the client's existing data sources grouped by category.
 * Supports pre-selection via initialPlatforms prop with visual indicator.
 * Pre-selected platforms can be deselected by the user.
 */
export default function SourceSelectionStep({ data, onChange }) {
  const {
    selectedPlatforms = [],
    allowedPlatformIds = [],
    clientSources = [],
    initialPlatforms = []
  } = data;

  const { platforms: allPlatforms, loading, error } = usePlatforms();
  const [searchFilter, setSearchFilter] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const { playClick } = useAudio();

  // Build a map of platform_id -> source info (with latest data)
  // Handle both 'platform_id' (from SourceWizard) and 'platform' (from existing sources)
  const sourcesByPlatform = useMemo(() => {
    const map = {};
    clientSources.forEach(source => {
      const platformId = source.platform_id || source.platform;
      // If multiple sources for same platform, keep the most recent
      if (!map[platformId] ||
          new Date(source.created_at) > new Date(map[platformId].created_at)) {
        map[platformId] = source;
      }
    });
    return map;
  }, [clientSources]);

  // Filter platforms to only show those from client's sources
  const platforms = useMemo(() => {
    return allPlatforms.filter(p => allowedPlatformIds.includes(p.id));
  }, [allPlatforms, allowedPlatformIds]);

  // Group platforms by category
  const platformsByCategory = useMemo(() => {
    return platforms.reduce((acc, platform) => {
      const category = platform.category || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(platform);
      return acc;
    }, {});
  }, [platforms]);

  // Categories start collapsed - user expands as needed

  const toggleCategory = useCallback((category) => {
    playClick();
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, [playClick]);

  const togglePlatform = useCallback((platformId) => {
    playClick();
    const newSelection = selectedPlatforms.includes(platformId)
      ? selectedPlatforms.filter(id => id !== platformId)
      : [...selectedPlatforms, platformId];
    onChange({ selectedPlatforms: newSelection });
  }, [playClick, selectedPlatforms, onChange]);

  const matchesSearch = useCallback((platform) => {
    if (!searchFilter) return true;
    const search = searchFilter.toLowerCase();
    return platform.name.toLowerCase().includes(search) ||
           platform.id.toLowerCase().includes(search);
  }, [searchFilter]);

  const selectAllInCategory = useCallback((category) => {
    playClick();
    const categoryPlatforms = platforms
      .filter(p => p.category === category && matchesSearch(p))
      .map(p => p.id);

    const allSelected = categoryPlatforms.every(id => selectedPlatforms.includes(id));

    if (allSelected) {
      // Deselect all in category
      onChange({
        selectedPlatforms: selectedPlatforms.filter(id => !categoryPlatforms.includes(id))
      });
    } else {
      // Select all in category
      const newSelection = [...new Set([...selectedPlatforms, ...categoryPlatforms])];
      onChange({ selectedPlatforms: newSelection });
    }
  }, [playClick, platforms, matchesSearch, selectedPlatforms, onChange]);

  // Get status display for a source
  const getStatusDisplay = useCallback((source) => {
    if (!source) return { sprite: 'heartYellow', label: 'Pending' };

    switch (source.status) {
      case 'connected':
        return { sprite: 'heartGreen', label: 'Connected' };
      case 'pending':
        return { sprite: 'heartYellow', label: 'Pending' };
      case 'error':
        return { sprite: 'heartRed', label: 'Error' };
      case 'disconnected':
        return { sprite: 'heartBlue', label: 'Disconnected' };
      default:
        return { sprite: 'heartYellow', label: source.status || 'Unknown' };
    }
  }, []);

  // Format date for display
  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'No uploads yet';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }, []);

  if (loading) {
    return (
      <div className={styles.loading}>
        <PSXSprite sprite="hourglass" animation="spin" ariaLabel="Loading" />
        <span>Loading sources...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <PSXSprite sprite="tubeRed" size="sm" ariaLabel="Error" />
        <span>Error loading platforms: {error}</span>
      </div>
    );
  }

  if (platforms.length === 0) {
    return (
      <Card className={styles.emptyState}>
        <PSXSprite sprite="floppy" size="lg" ariaLabel="No data sources" />
        <h3>No Data Sources Available</h3>
        <p>
          A data warehouse needs at least one data source to organize.
          Connect your platforms first, then return here to create your warehouse.
        </p>
        <p className={styles.hint}>
          Go to the Data Sources tab and click &quot;+ Add Source&quot; to connect your first platform.
        </p>
      </Card>
    );
  }

  // Filter platforms by search
  const filteredCategories = Object.entries(platformsByCategory).reduce((acc, [category, plats]) => {
    const filtered = plats.filter(matchesSearch);
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    return acc;
  }, {});

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Select Data Sources</h2>
        <p className={styles.description}>
          Choose which of your connected data sources to include in this warehouse.
          Each source will have its own data section.
        </p>
      </div>

      <div className={styles.search}>
        <input
          type="text"
          placeholder="Search sources..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          className={styles.searchInput}
          aria-label="Search data sources"
        />
      </div>

      <div className={styles.sourceList}>
        {Object.entries(filteredCategories).map(([category, categoryPlatforms]) => {
          const isExpanded = expandedCategories.has(category);
          const selectedCount = categoryPlatforms.filter(p =>
            selectedPlatforms.includes(p.id)
          ).length;
          const allSelected = selectedCount === categoryPlatforms.length;

          return (
            <Card key={category} className={styles.categoryCard}>
              <div className={styles.categoryHeader}>
                <button
                  type="button"
                  className={styles.categoryToggle}
                  onClick={() => toggleCategory(category)}
                  aria-expanded={isExpanded}
                  aria-controls={`category-${category}`}
                >
                  <span className={styles.categoryExpand}>{isExpanded ? '▼' : '▶'}</span>
                  <span className={styles.categoryName}>{category}</span>
                  <span className={styles.categoryCount}>
                    {selectedCount > 0 ? `${selectedCount} / ` : ''}
                    {categoryPlatforms.length}
                  </span>
                </button>
                <button
                  type="button"
                  className={styles.selectAllBtn}
                  onClick={() => selectAllInCategory(category)}
                >
                  {allSelected ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {isExpanded && (
                <div
                  id={`category-${category}`}
                  className={styles.platformList}
                >
                  {categoryPlatforms.map(platform => {
                    const isSelected = selectedPlatforms.includes(platform.id);
                    const isPreSelected = initialPlatforms.includes(platform.id);
                    const source = sourcesByPlatform[platform.id];
                    const status = getStatusDisplay(source);

                    return (
                      <label
                        key={platform.id}
                        className={`${styles.sourceItem} ${isSelected ? styles.selected : ''} ${isPreSelected ? styles.preSelected : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => togglePlatform(platform.id)}
                          className={styles.checkbox}
                        />
                        <div className={styles.sourceInfo}>
                          <div className={styles.sourceHeader}>
                            <span className={styles.sourceName}>{platform.name}</span>
                            {isPreSelected && (
                              <span className={styles.preSelectedBadge}>
                                <PSXSprite sprite="star" size="xs" ariaLabel="Pre-selected" />
                                Current
                              </span>
                            )}
                          </div>
                          <div className={styles.sourceMeta}>
                            <span className={styles.sourceStatus}>
                              <PSXSprite sprite={status.sprite} size="xs" ariaLabel={status.label} />
                              {status.label}
                            </span>
                            <span className={styles.sourceDate}>
                              Last upload: {formatDate(source?.last_upload_at)}
                            </span>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {selectedPlatforms.length > 0 && (
        <div className={styles.footer}>
          <p className={styles.selectedCount}>
            {selectedPlatforms.length} {selectedPlatforms.length === 1 ? 'source' : 'sources'} selected
          </p>
        </div>
      )}
    </div>
  );
}

SourceSelectionStep.propTypes = {
  data: PropTypes.shape({
    selectedPlatforms: PropTypes.arrayOf(PropTypes.string),
    allowedPlatformIds: PropTypes.arrayOf(PropTypes.string),
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
    })),
    initialPlatforms: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  onChange: PropTypes.func.isRequired
};
