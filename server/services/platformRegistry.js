/**
 * Platform Registry Service
 *
 * Provides programmatic access to platform metadata, dimensions, and metrics.
 * Acts as a facade over the data files in server/data/
 */

import {
  getAllPlatforms,
  getPlatformById,
  getPlatformsByCategory,
  PLATFORM_CATEGORIES,
} from '../data/platforms.js';

import {
  getAllDimensions,
  getDimensionById,
  getDimensionsGroupedByCategory,
  DIMENSION_CATEGORIES,
} from '../data/dimensions.js';

import {
  getAllMetrics,
  getMetricById,
  getMetricsGroupedByCategory,
  METRIC_CATEGORIES,
} from '../data/metrics.js';

import {
  getPlatformMapping,
  getDimensionMapping,
  getMetricMapping,
  getPlatformsSupportingDimension,
  getPlatformsSupportingMetric,
} from '../data/platformMappings.js';

/**
 * Get all platforms with optional category filter
 */
function getPlatforms(categoryFilter = null) {
  if (categoryFilter) {
    return getPlatformsByCategory(categoryFilter);
  }
  return getAllPlatforms();
}

/**
 * Get platform details including available dimensions and metrics
 */
function getPlatformDetails(platformId) {
  const platform = getPlatformById(platformId);
  if (!platform) {
    return null;
  }

  const mapping = getPlatformMapping(platformId);
  const availableDimensions = mapping?.dimensions
    ? Object.keys(mapping.dimensions).map((canonicalId) => ({
        ...getDimensionById(canonicalId),
        platformFieldName: mapping.dimensions[canonicalId],
      }))
    : [];

  const availableMetrics = mapping?.metrics
    ? Object.keys(mapping.metrics).map((canonicalId) => ({
        ...getMetricById(canonicalId),
        platformFieldName: mapping.metrics[canonicalId],
      }))
    : [];

  return {
    ...platform,
    availableDimensions,
    availableMetrics,
    dimensionCount: availableDimensions.length,
    metricCount: availableMetrics.length,
  };
}

/**
 * Get all dimensions for a specific platform
 */
function getPlatformDimensions(platformId) {
  const mapping = getPlatformMapping(platformId);
  if (!mapping?.dimensions) {
    return [];
  }

  return Object.keys(mapping.dimensions).map((canonicalId) => {
    const dimension = getDimensionById(canonicalId);
    return {
      ...dimension,
      platformFieldName: mapping.dimensions[canonicalId],
    };
  });
}

/**
 * Get all metrics for a specific platform
 */
function getPlatformMetrics(platformId) {
  const mapping = getPlatformMapping(platformId);
  if (!mapping?.metrics) {
    return [];
  }

  return Object.keys(mapping.metrics).map((canonicalId) => {
    const metric = getMetricById(canonicalId);
    return {
      ...metric,
      platformFieldName: mapping.metrics[canonicalId],
    };
  });
}

/**
 * Get all dimensions grouped by category
 */
function getDimensions(groupByCategory = false) {
  if (groupByCategory) {
    return getDimensionsGroupedByCategory();
  }
  return getAllDimensions();
}

/**
 * Get all metrics grouped by category
 */
function getMetrics(groupByCategory = false) {
  if (groupByCategory) {
    return getMetricsGroupedByCategory();
  }
  return getAllMetrics();
}

/**
 * Search platforms by name or category
 */
function searchPlatforms(query) {
  const lowerQuery = query.toLowerCase();
  const allPlatforms = getAllPlatforms();

  return allPlatforms.filter(
    (platform) =>
      platform.name.toLowerCase().includes(lowerQuery) ||
      platform.description.toLowerCase().includes(lowerQuery) ||
      platform.category.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Search dimensions by name or description
 */
function searchDimensions(query) {
  const lowerQuery = query.toLowerCase();
  const allDimensions = getAllDimensions();

  return allDimensions.filter(
    (dimension) =>
      dimension.name.toLowerCase().includes(lowerQuery) ||
      dimension.description.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Search metrics by name or description
 */
function searchMetrics(query) {
  const lowerQuery = query.toLowerCase();
  const allMetrics = getAllMetrics();

  return allMetrics.filter(
    (metric) =>
      metric.name.toLowerCase().includes(lowerQuery) ||
      metric.description.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get compatibility matrix: which platforms support which dimensions/metrics
 */
function getCompatibilityMatrix() {
  const allDimensions = getAllDimensions();
  const allMetrics = getAllMetrics();
  const allPlatforms = getAllPlatforms();

  const dimensionSupport = allDimensions.map((dimension) => ({
    ...dimension,
    supportedPlatforms: getPlatformsSupportingDimension(dimension.id),
    supportedPlatformCount: getPlatformsSupportingDimension(dimension.id).length,
  }));

  const metricSupport = allMetrics.map((metric) => ({
    ...metric,
    supportedPlatforms: getPlatformsSupportingMetric(metric.id),
    supportedPlatformCount: getPlatformsSupportingMetric(metric.id).length,
  }));

  return {
    dimensions: dimensionSupport,
    metrics: metricSupport,
    totalPlatforms: allPlatforms.length,
  };
}

/**
 * Get platform field mapping for a canonical field
 */
function getFieldMapping(platformId, fieldId, fieldType = 'dimension') {
  if (fieldType === 'dimension') {
    const platformFieldName = getDimensionMapping(platformId, fieldId);
    const dimension = getDimensionById(fieldId);
    return {
      canonical: dimension,
      platformFieldName,
      platformId,
    };
  } else {
    const platformFieldName = getMetricMapping(platformId, fieldId);
    const metric = getMetricById(fieldId);
    return {
      canonical: metric,
      platformFieldName,
      platformId,
    };
  }
}

/**
 * Validate that a platform supports specific dimensions and metrics
 */
function validatePlatformSupport(platformId, dimensionIds = [], metricIds = []) {
  const mapping = getPlatformMapping(platformId);
  if (!mapping) {
    return {
      valid: false,
      error: 'Platform not found',
    };
  }

  const unsupportedDimensions = dimensionIds.filter((dimId) => !mapping.dimensions?.[dimId]);
  const unsupportedMetrics = metricIds.filter((metricId) => !mapping.metrics?.[metricId]);

  const valid = unsupportedDimensions.length === 0 && unsupportedMetrics.length === 0;

  return {
    valid,
    unsupportedDimensions,
    unsupportedMetrics,
    message: valid
      ? 'All dimensions and metrics are supported'
      : 'Some dimensions or metrics are not supported by this platform',
  };
}

export {
  // Platform methods
  getPlatforms,
  getPlatformDetails,
  getPlatformDimensions,
  getPlatformMetrics,
  searchPlatforms,

  // Dimension methods
  getDimensions,
  searchDimensions,

  // Metric methods
  getMetrics,
  searchMetrics,

  // Mapping methods
  getFieldMapping,
  getCompatibilityMatrix,
  validatePlatformSupport,

  // Export categories for use in controllers
  PLATFORM_CATEGORIES,
  DIMENSION_CATEGORIES,
  METRIC_CATEGORIES,
};
