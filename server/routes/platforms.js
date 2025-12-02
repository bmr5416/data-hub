/**
 * Platform Routes
 *
 * API endpoints for platforms, dimensions, metrics, and compatibility.
 * NOTE: Client mapping routes are in mappings.js to avoid route collisions.
 */

import express from 'express';
import {
  getPlatforms,
  getPlatformDetails,
  getPlatformDimensions,
  getPlatformMetrics,
  getDimensions,
  getMetrics,
  searchPlatforms,
  searchDimensions,
  searchMetrics,
  getCompatibilityMatrix,
  validatePlatformSupport,
} from '../services/platformRegistry.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

// ========== PLATFORM ENDPOINTS ==========

/**
 * GET /api/platforms
 * List all platforms, optionally filtered by category
 */
router.get('/platforms', (req, res, next) => {
  try {
    const { category, search } = req.query;

    if (search) {
      const results = searchPlatforms(search);
      res.json(results);
    } else {
      const platforms = getPlatforms(category || null);
      res.json(platforms);
    }
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/platforms/:platformId
 * Get detailed information about a specific platform
 */
router.get('/platforms/:platformId', (req, res, next) => {
  try {
    const { platformId } = req.params;
    const platform = getPlatformDetails(platformId);

    if (!platform) {
      throw new AppError('Platform not found', 404);
    }

    res.json(platform);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/platforms/:platformId/dimensions
 * Get all available dimensions for a platform
 */
router.get('/platforms/:platformId/dimensions', (req, res, next) => {
  try {
    const { platformId } = req.params;
    const dimensions = getPlatformDimensions(platformId);
    res.json(dimensions);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/platforms/:platformId/metrics
 * Get all available metrics for a platform
 */
router.get('/platforms/:platformId/metrics', (req, res, next) => {
  try {
    const { platformId } = req.params;
    const metrics = getPlatformMetrics(platformId);
    res.json(metrics);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/platforms/:platformId/validate
 * Validate that a platform supports specific dimensions and metrics
 */
router.post('/platforms/:platformId/validate', (req, res, next) => {
  try {
    const { platformId } = req.params;
    const { dimensions = [], metrics = [] } = req.body;

    const validation = validatePlatformSupport(platformId, dimensions, metrics);
    res.json(validation);
  } catch (error) {
    next(error);
  }
});

// ========== DIMENSION ENDPOINTS ==========

/**
 * GET /api/dimensions
 * Get all canonical dimensions
 */
router.get('/dimensions', (req, res, next) => {
  try {
    const { groupByCategory, search } = req.query;

    if (search) {
      const results = searchDimensions(search);
      res.json(results);
    } else {
      const dimensions = getDimensions(groupByCategory === 'true');
      res.json(dimensions);
    }
  } catch (error) {
    next(error);
  }
});

// ========== METRIC ENDPOINTS ==========

/**
 * GET /api/metrics
 * Get all canonical metrics
 */
router.get('/metrics', (req, res, next) => {
  try {
    const { groupByCategory, search } = req.query;

    if (search) {
      const results = searchMetrics(search);
      res.json(results);
    } else {
      const metrics = getMetrics(groupByCategory === 'true');
      res.json(metrics);
    }
  } catch (error) {
    next(error);
  }
});

// ========== COMPATIBILITY ENDPOINTS ==========

/**
 * GET /api/compatibility
 * Get compatibility matrix showing which platforms support which fields
 */
router.get('/compatibility', (req, res, next) => {
  try {
    const matrix = getCompatibilityMatrix();
    res.json(matrix);
  } catch (error) {
    next(error);
  }
});

export default router;
