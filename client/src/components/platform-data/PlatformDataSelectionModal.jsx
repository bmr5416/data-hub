import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Card from '../common/Card';
import Icon from '../common/Icon';
import PSXSprite from '../common/PSXSprite';
import { useNotification } from '../../hooks/useNotification';
import { clientDataApi } from '../../services/api';
import styles from './PlatformDataSelectionModal.module.css';

/**
 * Modal for selecting which platform data source to preview
 * Shows platforms with uploaded data and blended data option
 * Includes retry logic for failed requests
 */
export default function PlatformDataSelectionModal({
  isOpen,
  clientId,
  platformDataInfo,
  onSelect,
  onClose,
}) {
  const { showError } = useNotification();
  const [selectedOption, setSelectedOption] = useState(null);
  const [platformsWithData, setPlatformsWithData] = useState([]);
  const [hasBlendedData, setHasBlendedData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Fetch platform data status
  const fetchDataStatus = useCallback(async () => {
    if (!clientId || !platformDataInfo) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Get platforms that have data
      const platforms = platformDataInfo.platforms?.filter((p) => p.hasData) || [];
      setPlatformsWithData(platforms);

      // Check if blended data exists
      try {
        const blendedResult = await clientDataApi.getBlendedDataPreview(clientId, 1, 0);
        setHasBlendedData(blendedResult.totalRows > 0);
      } catch {
        setHasBlendedData(false);
      }
    } catch (err) {
      showError(err.message || 'Failed to load data sources');
      setError(err.message || 'Failed to load data sources');
      setPlatformsWithData([]);
      setHasBlendedData(false);
    } finally {
      setLoading(false);
    }
  }, [clientId, platformDataInfo, showError]);

  useEffect(() => {
    if (isOpen) {
      fetchDataStatus();
    }
  }, [fetchDataStatus, isOpen]);

  const handleRetry = useCallback(() => {
    setRetryCount((prev) => prev + 1);
    fetchDataStatus();
  }, [fetchDataStatus]);

  const handleContinue = () => {
    if (selectedOption) {
      onSelect(selectedOption);
    }
  };

  const noDataAvailable = platformsWithData.length === 0 && !hasBlendedData;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      closeOnOverlayClick
      closeOnEscape
    >
      <header className={styles.header}>
        <h2 id="platform-data-selection-title" className={styles.title}>
          Select Data to View
        </h2>
        <p className={styles.subtitle}>
          Choose a data source to preview
        </p>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close modal"
        >
          <Icon name="close" size={20} />
        </button>
      </header>

      <div className={styles.content}>
        {loading ? (
          <div className={styles.loadingState}>
            <PSXSprite sprite="hourglass" size="sm" ariaLabel="Loading" />
            <span>Loading data sources...</span>
          </div>
        ) : error ? (
          <div className={styles.errorState}>
            <PSXSprite sprite="tubeRed" size="md" ariaLabel="Error" />
            <span className={styles.errorMessage}>{error}</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRetry}
            >
              {retryCount > 0 ? 'Retry Again' : 'Retry'}
            </Button>
          </div>
        ) : noDataAvailable ? (
          <div className={styles.emptyState}>
            <PSXSprite sprite="floppy" size="md" ariaLabel="No data" />
            <span>No data uploaded yet</span>
            <p>Upload CSV files to your data sources to preview data here.</p>
          </div>
        ) : (
          <div className={styles.optionList}>
            {/* Platform options */}
            {platformsWithData.map((platform) => (
              <Card
                key={platform.platformId}
                interactive
                onClick={() => setSelectedOption({
                  type: 'platform',
                  platformId: platform.platformId,
                  platformName: platform.name,
                })}
                className={`${styles.optionCard} ${selectedOption?.platformId === platform.platformId ? styles.selected : ''}`}
              >
                <div className={`${styles.optionIcon} ${selectedOption?.platformId === platform.platformId ? styles.optionIconSelected : ''}`}>
                  {selectedOption?.platformId === platform.platformId ? (
                    <Icon name="check" size={24} />
                  ) : (
                    <Icon name="database" size={24} />
                  )}
                </div>
                <div className={styles.optionInfo}>
                  <span className={styles.optionName}>{platform.name}</span>
                  <span className={styles.optionMeta}>
                    {platform.rowCount?.toLocaleString() || 0} rows
                  </span>
                </div>
                {selectedOption?.platformId === platform.platformId && (
                  <PSXSprite sprite="coin" size="sm" className={styles.coinIcon} ariaLabel="Selected" />
                )}
              </Card>
            ))}

            {/* Blended data option */}
            {hasBlendedData && (
              <Card
                interactive
                onClick={() => setSelectedOption({ type: 'blended' })}
                className={`${styles.optionCard} ${styles.blendedOption} ${selectedOption?.type === 'blended' ? styles.selected : ''}`}
              >
                <div className={`${styles.optionIcon} ${selectedOption?.type === 'blended' ? styles.optionIconSelected : ''}`}>
                  {selectedOption?.type === 'blended' ? (
                    <Icon name="check" size={24} />
                  ) : (
                    <Icon name="grid" size={24} />
                  )}
                </div>
                <div className={styles.optionInfo}>
                  <span className={styles.optionName}>Blended Dataset</span>
                  <span className={styles.optionMeta}>
                    Harmonized data from all platforms
                  </span>
                </div>
                {selectedOption?.type === 'blended' && (
                  <PSXSprite sprite="coin" size="sm" className={styles.coinIcon} ariaLabel="Selected" />
                )}
              </Card>
            )}
          </div>
        )}
      </div>

      <footer className={styles.footer}>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          disabled={!selectedOption || loading}
          onClick={handleContinue}
        >
          Continue
        </Button>
      </footer>
    </Modal>
  );
}

PlatformDataSelectionModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  clientId: PropTypes.string.isRequired,
  platformDataInfo: PropTypes.shape({
    platforms: PropTypes.arrayOf(PropTypes.shape({
      platformId: PropTypes.string,
      name: PropTypes.string,
      hasData: PropTypes.bool,
      rowCount: PropTypes.number,
    })),
  }),
  onSelect: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};
