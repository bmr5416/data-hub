/**
 * Mapping Service
 *
 * Handles CRUD operations for custom client platform mappings.
 * Merges system default mappings with client-specific overrides.
 */

import { mappingRepository } from './repositories/index.js';
import {
  getPlatformMapping,
} from '../data/platformMappings.js';
import { getDimensionById } from '../data/dimensions.js';
import { getMetricById } from '../data/metrics.js';

/**
 * Get complete mappings for a client's platform
 * Merges system defaults with client custom mappings
 */
async function getClientPlatformMappings(clientId, platformId) {
  // Get system default mappings
  const defaultMapping = getPlatformMapping(platformId);
  if (!defaultMapping) {
    throw new Error(`Platform ${platformId} not found`);
  }

  // Get client custom mappings
  const customMappings = await mappingRepository.findByClientAndPlatform(clientId, platformId);

  // Build custom mappings lookup
  const customDimensionsMap = {};
  const customMetricsMap = {};

  customMappings.forEach((mapping) => {
    if (mapping.fieldType === 'dimension') {
      customDimensionsMap[mapping.canonicalId] = {
        platformFieldName: mapping.platformFieldName,
        transformation: mapping.transformation,
        mappingId: mapping.id,
      };
    } else if (mapping.fieldType === 'metric') {
      customMetricsMap[mapping.canonicalId] = {
        platformFieldName: mapping.platformFieldName,
        transformation: mapping.transformation,
        mappingId: mapping.id,
      };
    }
  });

  // Merge: custom overrides default
  const dimensions = {};
  Object.keys(defaultMapping.dimensions || {}).forEach((canonicalId) => {
    dimensions[canonicalId] = {
      canonical: getDimensionById(canonicalId),
      platformFieldName:
        customDimensionsMap[canonicalId]?.platformFieldName ||
        defaultMapping.dimensions[canonicalId],
      transformation: customDimensionsMap[canonicalId]?.transformation,
      isCustom: !!customDimensionsMap[canonicalId],
      mappingId: customDimensionsMap[canonicalId]?.mappingId,
    };
  });

  const metrics = {};
  Object.keys(defaultMapping.metrics || {}).forEach((canonicalId) => {
    metrics[canonicalId] = {
      canonical: getMetricById(canonicalId),
      platformFieldName:
        customMetricsMap[canonicalId]?.platformFieldName || defaultMapping.metrics[canonicalId],
      transformation: customMetricsMap[canonicalId]?.transformation,
      isCustom: !!customMetricsMap[canonicalId],
      mappingId: customMetricsMap[canonicalId]?.mappingId,
    };
  });

  return {
    platformId,
    dimensions,
    metrics,
    defaultMapping,
    customMappingsCount: customMappings.length,
  };
}

/**
 * Get all custom mappings for a client across all platforms
 */
async function getAllClientMappings(clientId) {
  return await mappingRepository.findByClientId(clientId);
}

/**
 * Create a custom mapping for a client
 */
async function createCustomMapping(clientId, data) {
  // Validate field exists in canonical definitions
  if (data.fieldType === 'dimension') {
    const dimension = getDimensionById(data.canonicalId);
    if (!dimension) {
      throw new Error(`Dimension ${data.canonicalId} not found in canonical definitions`);
    }
  } else if (data.fieldType === 'metric') {
    const metric = getMetricById(data.canonicalId);
    if (!metric) {
      throw new Error(`Metric ${data.canonicalId} not found in canonical definitions`);
    }
  } else {
    throw new Error('fieldType must be "dimension" or "metric"');
  }

  // Check if custom mapping already exists
  const existing = await mappingRepository.findByClientAndPlatform(clientId, data.platformId);
  const duplicate = existing.find(
    (m) => m.canonicalId === data.canonicalId && m.fieldType === data.fieldType
  );

  if (duplicate) {
    throw new Error(
      `Custom mapping for ${data.fieldType} ${data.canonicalId} already exists. Use update instead.`
    );
  }

  return await mappingRepository.create({
    clientId,
    platformId: data.platformId,
    fieldType: data.fieldType,
    canonicalId: data.canonicalId,
    platformFieldName: data.platformFieldName,
    transformation: data.transformation,
  });
}

/**
 * Get a specific custom mapping by ID
 */
async function getCustomMapping(mappingId) {
  return await mappingRepository.findById(mappingId);
}

/**
 * Update a custom mapping
 */
async function updateCustomMapping(mappingId, data) {
  return await mappingRepository.update(mappingId, data);
}

/**
 * Delete a custom mapping (reverts to system default)
 */
async function deleteCustomMapping(mappingId) {
  return await mappingRepository.delete(mappingId);
}

/**
 * Reset all custom mappings for a client's platform (reverts to system defaults)
 */
async function resetPlatformMappings(clientId, platformId) {
  const customMappings = await mappingRepository.findByClientAndPlatform(clientId, platformId);

  for (const mapping of customMappings) {
    await mappingRepository.delete(mapping.id);
  }

  return {
    deletedCount: customMappings.length,
    message: `Reset ${customMappings.length} custom mappings for platform ${platformId}`,
  };
}

/**
 * Get a specific field mapping for a client
 */
async function getFieldMapping(clientId, platformId, canonicalId, fieldType) {
  const allMappings = await getClientPlatformMappings(clientId, platformId);

  if (fieldType === 'dimension') {
    return allMappings.dimensions[canonicalId] || null;
  } else if (fieldType === 'metric') {
    return allMappings.metrics[canonicalId] || null;
  }

  return null;
}

/**
 * Validate that all required fields have mappings
 */
async function validateMappings(clientId, platformId, requiredDimensions = [], requiredMetrics = []) {
  const mappings = await getClientPlatformMappings(clientId, platformId);

  const missingDimensions = requiredDimensions.filter((dimId) => !mappings.dimensions[dimId]);
  const missingMetrics = requiredMetrics.filter((metricId) => !mappings.metrics[metricId]);

  return {
    valid: missingDimensions.length === 0 && missingMetrics.length === 0,
    missingDimensions,
    missingMetrics,
  };
}

/**
 * Bulk create custom mappings for a client
 */
async function bulkCreateMappings(clientId, platformId, mappingsData) {
  const results = {
    created: [],
    errors: [],
  };

  for (const data of mappingsData) {
    try {
      const mapping = await createCustomMapping(clientId, {
        ...data,
        platformId,
      });
      results.created.push(mapping);
    } catch (error) {
      results.errors.push({
        data,
        error: error.message,
      });
    }
  }

  return results;
}

export {
  getClientPlatformMappings,
  getAllClientMappings,
  getCustomMapping,
  createCustomMapping,
  updateCustomMapping,
  deleteCustomMapping,
  resetPlatformMappings,
  getFieldMapping,
  validateMappings,
  bulkCreateMappings,
};
