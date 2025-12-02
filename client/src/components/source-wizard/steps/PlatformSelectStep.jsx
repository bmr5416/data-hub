import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { usePlatforms } from '../../../hooks/usePlatforms';
import { useAudio } from '../../../hooks/useAudio';
import Icon from '../../common/Icon';
import PSXSprite from '../../common/PSXSprite';
import DuplicatePlatformModal from '../DuplicatePlatformModal';
import styles from './PlatformSelectStep.module.css';

/**
 * Step 1: Select Platform
 *
 * User selects from Top 5 platforms + Custom option
 */
export default function PlatformSelectStep({ data, onChange }) {
  const { platforms, loading, error } = usePlatforms();
  const [duplicateModal, setDuplicateModal] = useState(null);
  const { playClick } = useAudio();

  // Platforms already added to this client's workspace
  const addedPlatforms = data.addedPlatforms || [];

  const handleSelect = useCallback((platformId, platformName, hasExisting) => {
    playClick();
    if (hasExisting) {
      // Show warning modal for existing platform
      setDuplicateModal({ platformId, platformName });
      return;
    }
    onChange({ selectedPlatform: platformId });
  }, [playClick, onChange]);

  const handleConfirmDuplicate = useCallback(() => {
    if (duplicateModal) {
      onChange({ selectedPlatform: duplicateModal.platformId });
      setDuplicateModal(null);
    }
  }, [duplicateModal, onChange]);

  const handleCancelDuplicate = useCallback(() => {
    setDuplicateModal(null);
  }, []);

  if (loading) {
    return (
      <div className={styles.loading}>
        <PSXSprite sprite="hourglass" size="sm" ariaLabel="Loading" />
        <span>Loading platforms...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <Icon name="info" />
        <span>{error}</span>
      </div>
    );
  }

  // Group platforms by category
  const groupedPlatforms = platforms.reduce((acc, platform) => {
    const category = platform.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(platform);
    return acc;
  }, {});

  const categoryLabels = {
    advertising: 'Advertising',
    analytics: 'Analytics',
    ecommerce: 'E-commerce',
    custom: 'Custom'
  };

  const categoryOrder = ['advertising', 'analytics', 'ecommerce', 'custom'];

  return (
    <div className={styles.container}>
      <p className={styles.description}>
        Select the platform you want to import data from. This will create a dedicated
        data table for storing your platform data with the correct column structure.
      </p>

      {categoryOrder.map(category => {
        const categoryPlatforms = groupedPlatforms[category];
        if (!categoryPlatforms || categoryPlatforms.length === 0) return null;

        return (
          <div key={category} className={styles.category}>
            <h3 className={styles.categoryTitle}>{categoryLabels[category]}</h3>
            <div className={styles.platformGrid}>
              {categoryPlatforms.map(platform => {
                const hasExisting = addedPlatforms.includes(platform.id);
                const isSelected = data.selectedPlatform === platform.id;
                return (
                  <button
                    key={platform.id}
                    type="button"
                    className={`${styles.platformCard} ${isSelected ? styles.selected : ''} ${hasExisting ? styles.hasExisting : ''}`}
                    onClick={() => handleSelect(platform.id, platform.name, hasExisting)}
                    aria-pressed={isSelected}
                  >
                    <div className={`${styles.platformIcon} ${isSelected ? styles.platformIconSelected : ''}`}>
                      {isSelected ? (
                        <Icon name="check" size={32} />
                      ) : (
                        <Icon name={platform.icon || 'custom'} size={32} />
                      )}
                    </div>
                    <div className={styles.platformInfo}>
                      <span className={styles.platformName}>{platform.name}</span>
                      <span className={styles.platformDesc}>{platform.description}</span>
                    </div>
                    {isSelected && (
                      <div className={styles.checkmark}>
                        <PSXSprite sprite="coin" size="sm" ariaLabel="Selected" />
                      </div>
                    )}
                    {hasExisting && (
                      <div className={styles.existingBadge}>
                        <PSXSprite sprite="heartGreen" size="xs" ariaLabel="Has existing source" />
                        <span>1 source</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <DuplicatePlatformModal
        isOpen={!!duplicateModal}
        platformName={duplicateModal?.platformName || ''}
        onConfirm={handleConfirmDuplicate}
        onCancel={handleCancelDuplicate}
      />
    </div>
  );
}

PlatformSelectStep.propTypes = {
  data: PropTypes.shape({
    selectedPlatform: PropTypes.string,
    addedPlatforms: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  onChange: PropTypes.func.isRequired
};
