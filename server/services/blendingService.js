import {
  platformMappings,
  applyTransformation,
} from '../data/platformMappings.js';

/**
 * Blending Service
 *
 * Harmonizes data from multiple platforms into a unified dataset.
 * Uses the platform mappings to translate field names and apply transformations.
 */

// Standard blended output columns
const BLENDED_COLUMNS = {
  date: { type: 'dimension', required: true },
  source_platform: { type: 'meta', required: true },
  campaign_name: { type: 'dimension', required: false },
  ad_group_name: { type: 'dimension', required: false },
  ad_name: { type: 'dimension', required: false },
  impressions: { type: 'metric', required: false },
  clicks: { type: 'metric', required: false },
  spend: { type: 'metric', required: false },
  conversions: { type: 'metric', required: false },
  revenue: { type: 'metric', required: false },
  ctr: { type: 'metric', required: false, derived: true },
  cpc: { type: 'metric', required: false, derived: true },
};

class BlendingService {
  /**
   * Harmonize a single row of data from a platform to canonical format
   *
   * @param {Object} row - Raw data row with platform field names
   * @param {string} platformId - Platform identifier
   * @returns {Object} Harmonized row with canonical field names
   */
  harmonizeRow(row, platformId) {
    const mapping = platformMappings[platformId];
    if (!mapping) {
      throw new Error(`No mapping found for platform: ${platformId}`);
    }

    const harmonized = {
      source_platform: platformId,
    };

    // Map dimensions
    if (mapping.dimensions) {
      for (const [canonicalId, platformField] of Object.entries(mapping.dimensions)) {
        const value = row[platformField];
        if (value !== undefined && value !== null && value !== '') {
          harmonized[canonicalId] = this.normalizeValue(value, 'dimension', canonicalId);
        }
      }
    }

    // Map metrics with transformations
    if (mapping.metrics) {
      for (const [canonicalId, platformField] of Object.entries(mapping.metrics)) {
        let value = row[platformField];
        if (value !== undefined && value !== null && value !== '') {
          // Parse numeric value
          value = this.parseNumeric(value);
          // Apply transformation if exists
          value = applyTransformation(platformId, canonicalId, value);
          harmonized[canonicalId] = value;
        }
      }
    }

    // Calculate derived metrics
    harmonized.ctr = this.calculateCTR(harmonized);
    harmonized.cpc = this.calculateCPC(harmonized);

    return harmonized;
  }

  /**
   * Harmonize an entire dataset from a platform
   *
   * @param {Array} data - Array of raw data rows
   * @param {string} platformId - Platform identifier
   * @returns {Array} Array of harmonized rows
   */
  harmonizeDataset(data, platformId) {
    return data.map((row) => this.harmonizeRow(row, platformId));
  }

  /**
   * Blend data from multiple sources into a unified dataset
   *
   * @param {Array} sources - Array of { platformId, data } objects
   * @returns {Array} Blended dataset with all sources
   */
  blendSources(sources) {
    const blended = [];

    for (const source of sources) {
      const { platformId, data } = source;

      if (!data || data.length === 0) {
        continue;
      }

      const harmonizedData = this.harmonizeDataset(data, platformId);
      blended.push(...harmonizedData);
    }

    // Sort by date, then platform
    blended.sort((a, b) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      if (dateA !== dateB) {
        return dateA.localeCompare(dateB);
      }
      return (a.source_platform || '').localeCompare(b.source_platform || '');
    });

    return blended;
  }

  /**
   * Aggregate blended data by specified dimensions
   *
   * @param {Array} blendedData - Harmonized blended dataset
   * @param {Array} groupBy - Dimensions to group by (e.g., ['date', 'source_platform'])
   * @returns {Array} Aggregated dataset
   */
  aggregateData(blendedData, groupBy = ['date', 'source_platform']) {
    const groups = new Map();

    for (const row of blendedData) {
      // Create group key
      const keyParts = groupBy.map((dim) => row[dim] || '(none)');
      const key = keyParts.join('|');

      if (!groups.has(key)) {
        // Initialize group with dimensions
        const group = {};
        groupBy.forEach((dim) => {
          group[dim] = row[dim];
        });
        // Initialize metrics to 0
        group.impressions = 0;
        group.clicks = 0;
        group.spend = 0;
        group.conversions = 0;
        group.revenue = 0;
        groups.set(key, group);
      }

      // Sum metrics
      const group = groups.get(key);
      group.impressions += this.parseNumeric(row.impressions) || 0;
      group.clicks += this.parseNumeric(row.clicks) || 0;
      group.spend += this.parseNumeric(row.spend) || 0;
      group.conversions += this.parseNumeric(row.conversions) || 0;
      group.revenue += this.parseNumeric(row.revenue) || 0;
    }

    // Convert back to array and calculate derived metrics
    return Array.from(groups.values()).map((group) => {
      group.ctr = this.calculateCTR(group);
      group.cpc = this.calculateCPC(group);
      // Round numeric values for cleaner output
      group.impressions = Math.round(group.impressions);
      group.clicks = Math.round(group.clicks);
      group.spend = this.round(group.spend, 2);
      group.conversions = this.round(group.conversions, 2);
      group.revenue = this.round(group.revenue, 2);
      return group;
    });
  }

  /**
   * Get summary statistics for blended data
   *
   * @param {Array} blendedData - Harmonized blended dataset
   * @returns {Object} Summary statistics
   */
  getSummaryStats(blendedData) {
    const stats = {
      totalRows: blendedData.length,
      dateRange: { start: null, end: null },
      platforms: new Set(),
      totals: {
        impressions: 0,
        clicks: 0,
        spend: 0,
        conversions: 0,
        revenue: 0,
      },
    };

    for (const row of blendedData) {
      // Track platforms
      if (row.source_platform) {
        stats.platforms.add(row.source_platform);
      }

      // Track date range
      if (row.date) {
        if (!stats.dateRange.start || row.date < stats.dateRange.start) {
          stats.dateRange.start = row.date;
        }
        if (!stats.dateRange.end || row.date > stats.dateRange.end) {
          stats.dateRange.end = row.date;
        }
      }

      // Sum totals
      stats.totals.impressions += this.parseNumeric(row.impressions) || 0;
      stats.totals.clicks += this.parseNumeric(row.clicks) || 0;
      stats.totals.spend += this.parseNumeric(row.spend) || 0;
      stats.totals.conversions += this.parseNumeric(row.conversions) || 0;
      stats.totals.revenue += this.parseNumeric(row.revenue) || 0;
    }

    // Calculate derived totals
    stats.totals.ctr = this.calculateCTR(stats.totals);
    stats.totals.cpc = this.calculateCPC(stats.totals);
    stats.totals.roas =
      stats.totals.spend > 0
        ? this.round(stats.totals.revenue / stats.totals.spend, 2)
        : 0;

    // Convert Set to Array
    stats.platforms = Array.from(stats.platforms);

    // Round totals
    stats.totals.impressions = Math.round(stats.totals.impressions);
    stats.totals.clicks = Math.round(stats.totals.clicks);
    stats.totals.spend = this.round(stats.totals.spend, 2);
    stats.totals.conversions = this.round(stats.totals.conversions, 2);
    stats.totals.revenue = this.round(stats.totals.revenue, 2);

    return stats;
  }

  /**
   * Normalize a value based on its type
   *
   * @private
   */
  normalizeValue(value, type, fieldName) {
    if (value === null || value === undefined) return null;

    // Handle date normalization
    if (fieldName === 'date' || fieldName.toLowerCase().includes('date')) {
      return this.normalizeDate(value);
    }

    // String values - trim whitespace
    if (typeof value === 'string') {
      return value.trim();
    }

    return value;
  }

  /**
   * Normalize date to YYYY-MM-DD format
   *
   * @private
   */
  normalizeDate(value) {
    if (!value) return null;

    // Already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }

    // GA4 YYYYMMDD format
    if (/^\d{8}$/.test(value)) {
      return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
    }

    // Try parsing as date
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch {
      // Ignore parse errors
    }

    // Return as-is if unparseable
    return String(value);
  }

  /**
   * Parse a value as numeric
   *
   * @private
   */
  parseNumeric(value) {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return value;

    // Remove currency symbols, commas, etc.
    const cleaned = String(value).replace(/[$,€£¥]/g, '').trim();
    const parsed = parseFloat(cleaned);

    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Calculate CTR (Click-Through Rate)
   *
   * @private
   */
  calculateCTR(row) {
    const impressions = this.parseNumeric(row.impressions);
    const clicks = this.parseNumeric(row.clicks);

    if (impressions > 0) {
      return this.round((clicks / impressions) * 100, 2);
    }
    return 0;
  }

  /**
   * Calculate CPC (Cost Per Click)
   *
   * @private
   */
  calculateCPC(row) {
    const spend = this.parseNumeric(row.spend);
    const clicks = this.parseNumeric(row.clicks);

    if (clicks > 0) {
      return this.round(spend / clicks, 2);
    }
    return 0;
  }

  /**
   * Round a number to specified decimal places
   *
   * @private
   */
  round(value, decimals = 2) {
    const multiplier = Math.pow(10, decimals);
    return Math.round(value * multiplier) / multiplier;
  }

  /**
   * Get the blended column schema
   *
   * @returns {Object} Column definitions
   */
  getBlendedSchema() {
    return { ...BLENDED_COLUMNS };
  }
}

// Singleton instance
const blendingService = new BlendingService();

export default blendingService;
export { BlendingService, BLENDED_COLUMNS };
