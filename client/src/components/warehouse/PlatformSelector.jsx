import { useState } from 'react';
import PropTypes from 'prop-types';
import { usePlatforms } from '../../hooks/usePlatforms';
import Card from '../common/Card';
import ErrorMessage from '../common/ErrorMessage';
import styles from './PlatformSelector.module.css';

/**
 * Platform multi-select component with category grouping
 * Displays platforms organized by category (Advertising, Analytics, etc.)
 * with "Select All" functionality per category
 *
 * @param {string[]} allowedPlatformIds - If provided, only show these platforms
 */
export default function PlatformSelector({
  selectedPlatforms = [],
  onChange,
  searchFilter = '',
  allowedPlatformIds = null
}) {
  const { platforms: allPlatforms, platformsByCategory: allPlatformsByCategory, loading, error } = usePlatforms();

  // Filter platforms to only show allowed ones (if specified)
  const platforms = allowedPlatformIds && allowedPlatformIds.length > 0
    ? allPlatforms.filter(p => allowedPlatformIds.includes(p.id))
    : allPlatforms;

  // Rebuild platformsByCategory with filtered platforms
  const platformsByCategory = allowedPlatformIds && allowedPlatformIds.length > 0
    ? Object.entries(allPlatformsByCategory).reduce((acc, [category, plats]) => {
        const filtered = plats.filter(p => allowedPlatformIds.includes(p.id));
        if (filtered.length > 0) {
          acc[category] = filtered;
        }
        return acc;
      }, {})
    : allPlatformsByCategory;
  const [expandedCategories, setExpandedCategories] = useState(new Set());

  // Categories start collapsed - user expands as needed

  const toggleCategory = (category) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const togglePlatform = (platformId) => {
    const newSelection = selectedPlatforms.includes(platformId)
      ? selectedPlatforms.filter(id => id !== platformId)
      : [...selectedPlatforms, platformId];
    onChange(newSelection);
  };

  const selectAllInCategory = (category) => {
    const categoryPlatforms = platforms
      .filter(p => p.category === category && matchesSearch(p))
      .map(p => p.id);

    const allSelected = categoryPlatforms.every(id => selectedPlatforms.includes(id));

    if (allSelected) {
      // Deselect all in category
      onChange(selectedPlatforms.filter(id => !categoryPlatforms.includes(id)));
    } else {
      // Select all in category
      const newSelection = [...new Set([...selectedPlatforms, ...categoryPlatforms])];
      onChange(newSelection);
    }
  };

  const matchesSearch = (platform) => {
    if (!searchFilter) return true;
    const search = searchFilter.toLowerCase();
    return platform.name.toLowerCase().includes(search) ||
           platform.id.toLowerCase().includes(search);
  };

  if (loading) {
    return <div className={styles.loading}>Loading platforms...</div>;
  }

  if (error) {
    return (
      <ErrorMessage
        error={error}
        variant="card"
        title="Failed to Load Platforms"
      />
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

                  return (
                    <label
                      key={platform.id}
                      className={`${styles.platformItem} ${isSelected ? styles.selected : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => togglePlatform(platform.id)}
                        className={styles.checkbox}
                      />
                      <div className={styles.platformInfo}>
                        <div className={styles.platformName}>{platform.name}</div>
                        {platform.description && (
                          <div className={styles.platformDesc}>{platform.description}</div>
                        )}
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
  );
}

PlatformSelector.propTypes = {
  selectedPlatforms: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func.isRequired,
  searchFilter: PropTypes.string,
  allowedPlatformIds: PropTypes.arrayOf(PropTypes.string)
};
