/**
 * Pagination Utilities
 *
 * Helpers for paginating API responses.
 */

export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;

/**
 * Parse pagination parameters from query string
 * @param {Object} query - Express request query object
 * @returns {Object} Parsed pagination parameters
 */
export function parsePaginationParams(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const requestedPageSize = parseInt(query.pageSize, 10) || DEFAULT_PAGE_SIZE;
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, requestedPageSize));
  const offset = (page - 1) * pageSize;

  return { page, pageSize, offset };
}

/**
 * Calculate pagination metadata
 * @param {number} total - Total count of items
 * @param {number} page - Current page number
 * @param {number} pageSize - Items per page
 * @returns {Object} Pagination metadata
 */
export function getPaginationMetadata(total, page, pageSize) {
  const totalPages = Math.ceil(total / pageSize);

  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

/**
 * Apply pagination to a Supabase query
 * @param {Object} query - Supabase query builder
 * @param {number} offset - Number of items to skip
 * @param {number} limit - Number of items to return
 * @returns {Object} Modified query
 */
export function applyPagination(query, offset, limit) {
  return query.range(offset, offset + limit - 1);
}
