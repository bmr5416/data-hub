import { supabase } from '../lib/supabase';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 100,
  maxDelay: 5000,
};

/**
 * Sleep with optional jitter for retry backoff
 * @param {number} ms - Base milliseconds
 * @returns {Promise<void>}
 */
function sleep(ms) {
  const jitter = ms * (0.5 + Math.random());
  return new Promise((resolve) => setTimeout(resolve, jitter));
}

/**
 * Check if error is retryable
 * @param {Error} error - Error to check
 * @returns {boolean}
 */
function isRetryableError(error) {
  // Network errors are retryable
  if (error.status === 0 || error.name === 'TypeError') {
    return true;
  }
  // Server errors and rate limits are retryable
  if (error.status >= 500 || error.status === 429) {
    return true;
  }
  // Check explicit retryable flag
  return error.retryable === true;
}

/**
 * Enhanced API Error class with full error details
 */
class ApiError extends Error {
  /**
   * @param {string} message - Error message
   * @param {number} status - HTTP status code
   * @param {string|null} code - Error code from server (e.g., 'RATE_LIMIT', '23505')
   * @param {string|null} requestId - Request ID for debugging
   * @param {boolean} retryable - Whether this error is retryable
   */
  constructor(message, status, code = null, requestId = null, retryable = false) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    this.retryable = retryable;
  }

  /**
   * Create error object for use in hook state
   */
  toStateObject() {
    return {
      message: this.message,
      status: this.status,
      code: this.code,
      requestId: this.requestId,
      retryable: this.retryable,
    };
  }
}

/**
 * Get current access token from Supabase session
 * @returns {Promise<string|null>}
 */
async function getAuthToken() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

/**
 * Make a single API request attempt
 * @private
 */
async function requestAttempt(url, config) {
  let response;
  try {
    response = await fetch(url, config);
  } catch (error) {
    throw new ApiError('Network error: Unable to connect to server', 0, null, null, true);
  }

  // Handle 401 Unauthorized - sign out and throw (not retryable)
  if (response.status === 401) {
    await supabase.auth.signOut();
    throw new ApiError('Session expired. Please sign in again.', 401);
  }

  if (!response.ok) {
    let errorMessage = 'Request failed';
    let errorCode = null;
    let requestId = response.headers.get('X-Request-ID');
    let retryable = false;

    try {
      const errorData = await response.json();
      errorMessage = errorData.error?.message || errorData.message || errorMessage;
      errorCode = errorData.error?.code || errorData.code || null;
      // Server may indicate if error is retryable
      retryable = errorData.error?.retryable || errorData.retryable || false;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }

    // Automatically mark 5xx and 429 as retryable
    if (!retryable) {
      retryable = response.status >= 500 || response.status === 429;
    }

    throw new ApiError(errorMessage, response.status, errorCode, requestId, retryable);
  }

  try {
    return await response.json();
  } catch {
    throw new ApiError('Invalid response from server', response.status);
  }
}

/**
 * Make authenticated API request with automatic retry for transient errors
 * Automatically includes Authorization header from Supabase session.
 * Retries 5xx errors and rate limits with exponential backoff.
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  // Get auth token
  const token = await getAuthToken();

  // Check if body is FormData - don't set Content-Type or stringify
  const isFormData = options.body instanceof FormData;

  const config = {
    ...options,
    headers: {
      // Don't set Content-Type for FormData - browser will set it with boundary
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      // Add Authorization header if token exists
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  };

  // Only stringify non-FormData bodies
  if (options.body && typeof options.body === 'object' && !isFormData) {
    config.body = JSON.stringify(options.body);
  }

  // Retry loop with exponential backoff
  const { maxRetries, baseDelay, maxDelay } = RETRY_CONFIG;
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestAttempt(url, config);
    } catch (error) {
      lastError = error;

      // Don't retry non-retryable errors or if we've exhausted attempts
      if (!isRetryableError(error) || attempt >= maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);

      // Log retry (in development)
      if (import.meta.env.DEV) {
        console.warn(`API request failed, retrying (attempt ${attempt + 1}/${maxRetries})...`, {
          endpoint,
          status: error.status,
          delay,
        });
      }

      await sleep(delay);
    }
  }

  throw lastError;
}

// Auth API
export const authApi = {
  // Get current user profile with assigned clients
  me: () => request('/auth/me'),
  // Validate current session
  session: () => request('/auth/session'),
  // Server-side signout (for audit logging)
  signout: () => request('/auth/signout', { method: 'POST' }),
  // Update user profile
  updateProfile: (data) => request('/auth/profile', { method: 'PUT', body: data }),
};

// Admin API (requires admin role)
export const adminApi = {
  // List all users
  listUsers: () => request('/admin/users'),
  // Get specific user
  getUser: (userId) => request(`/admin/users/${userId}`),
  // Invite new user
  inviteUser: (data) => request('/admin/users', { method: 'POST', body: data }),
  // Update user
  updateUser: (userId, data) => request(`/admin/users/${userId}`, { method: 'PUT', body: data }),
  // Update user's client assignments
  updateUserClients: (userId, clients) => request(`/admin/users/${userId}/clients`, {
    method: 'PUT',
    body: { clients },
  }),
  // Delete user
  deleteUser: (userId) => request(`/admin/users/${userId}`, { method: 'DELETE' }),
  // Resend invite email
  resendInvite: (userId) => request(`/admin/users/${userId}/resend-invite`, { method: 'POST' }),
};

// Client API
export const clientsApi = {
  list: () => request('/clients'),
  get: (id) => request(`/clients/${id}`),
  create: (data) => request('/clients', { method: 'POST', body: data }),
  update: (id, data) => request(`/clients/${id}`, { method: 'PUT', body: data }),
  delete: (id) => request(`/clients/${id}`, { method: 'DELETE' }),
  // Nested resources
  getSources: (clientId) => request(`/clients/${clientId}/sources`),
  addSource: (clientId, data) => request(`/clients/${clientId}/sources`, { method: 'POST', body: data }),
  getETL: (clientId) => request(`/clients/${clientId}/etl`),
  addETL: (clientId, data) => request(`/clients/${clientId}/etl`, { method: 'POST', body: data }),
  getKPIs: (clientId) => request(`/clients/${clientId}/kpis`),
  addKPI: (clientId, data) => request(`/clients/${clientId}/kpis`, { method: 'POST', body: data }),
  getReports: (clientId) => request(`/clients/${clientId}/reports`),
  addReport: (clientId, data) => request(`/clients/${clientId}/reports`, { method: 'POST', body: data }),
};

// Sources API
export const sourcesApi = {
  list: () => request('/sources'),
  get: (id) => request(`/sources/${id}`),
  update: (id, data) => request(`/sources/${id}`, { method: 'PUT', body: data }),
  delete: (id) => request(`/sources/${id}`, { method: 'DELETE' }),
};

// ETL API
export const etlApi = {
  list: () => request('/etl'),
  get: (id) => request(`/etl/${id}`),
  update: (id, data) => request(`/etl/${id}`, { method: 'PUT', body: data }),
  delete: (id) => request(`/etl/${id}`, { method: 'DELETE' }),
};

// KPIs API
export const kpisApi = {
  list: () => request('/kpis'),
  get: (id) => request(`/kpis/${id}`),
  update: (id, data) => request(`/kpis/${id}`, { method: 'PUT', body: data }),
  delete: (id) => request(`/kpis/${id}`, { method: 'DELETE' }),
};

// Reports API
export const reportsApi = {
  list: () => request('/reports'),
  get: (id) => request(`/reports/${id}`),
  create: (clientId, data) => request('/reports', {
    method: 'POST',
    body: { ...data, clientId },
  }),
  update: (id, data) => request(`/reports/${id}`, { method: 'PUT', body: data }),
  delete: (id) => request(`/reports/${id}`, { method: 'DELETE' }),
  // Report Builder specific endpoints
  preview: (id) => request(`/reports/${id}/preview`),
  sendTest: (id, email) => request(`/reports/${id}/test-email`, {
    method: 'POST',
    body: { testEmail: email },
  }),
  sendNow: (id) => request(`/reports/${id}/send`, { method: 'POST' }),
  // Report Alerts endpoints
  getAlerts: (reportId) => request(`/reports/${reportId}/alerts`),
  createAlert: (reportId, data) => request(`/reports/${reportId}/alerts`, {
    method: 'POST',
    body: data,
  }),
  updateAlert: (reportId, alertId, data) => request(`/reports/${reportId}/alerts/${alertId}`, {
    method: 'PUT',
    body: data,
  }),
  deleteAlert: (reportId, alertId) => request(`/reports/${reportId}/alerts/${alertId}`, {
    method: 'DELETE',
  }),
  // Visualization Preview endpoint
  getVizPreview: (reportId, vizConfig) => request(`/reports/${reportId}/viz-preview`, {
    method: 'POST',
    body: vizConfig,
  }),
};

// Lineage API
export const lineageApi = {
  get: (clientId) => request(`/lineage/${clientId}`),
  create: (data) => request('/lineage', { method: 'POST', body: data }),
  delete: (id) => request(`/lineage/${id}`, { method: 'DELETE' }),
};

// Notes API
export const notesApi = {
  get: (entityType, entityId) => request(`/notes/${entityType}/${entityId}`),
  save: (entityType, entityId, note, updatedBy) =>
    request(`/notes/${entityType}/${entityId}`, {
      method: 'POST',
      body: { note, updatedBy },
    }),
  delete: (entityType, entityId) =>
    request(`/notes/${entityType}/${entityId}`, { method: 'DELETE' }),
};

// Platform API
export const platformApi = {
  list: (category = null) => {
    const query = category ? `?category=${category}` : '';
    return request(`/platforms${query}`);
  },
  get: (platformId) => request(`/platforms/${platformId}`),
  getDimensions: (platformId) => request(`/platforms/${platformId}/dimensions`),
  getMetrics: (platformId) => request(`/platforms/${platformId}/metrics`),
  validate: (platformId, dimensions, metrics) =>
    request(`/platforms/${platformId}/validate`, {
      method: 'POST',
      body: { dimensions, metrics },
    }),
};

// SMTP API
export const smtpApi = {
  list: () => request('/smtp'),
  get: (id) => request(`/smtp/${id}`),
  create: (data) => request('/smtp', { method: 'POST', body: data }),
  update: (id, data) => request(`/smtp/${id}`, { method: 'PUT', body: data }),
  delete: (id) => request(`/smtp/${id}`, { method: 'DELETE' }),
  verify: (id) => request(`/smtp/${id}/verify`, { method: 'POST' }),
  test: (id, testEmail) => request(`/smtp/${id}/test`, {
    method: 'POST',
    body: { testEmail },
  }),
  verifyEnv: () => request('/smtp/verify-env', { method: 'POST' }),
  testEnv: (testEmail) => request('/smtp/test-env', {
    method: 'POST',
    body: { testEmail },
  }),
};

// Warehouse API
export const warehouseApi = {
  list: (clientId) => request(`/clients/${clientId}/warehouses`),
  get: (warehouseId) => request(`/warehouses/${warehouseId}`),
  create: (clientId, data) => request(`/clients/${clientId}/warehouses`, {
    method: 'POST',
    body: data,
  }),
  update: (warehouseId, data) => request(`/warehouses/${warehouseId}`, {
    method: 'PUT',
    body: data,
  }),
  delete: (warehouseId) => request(`/warehouses/${warehouseId}`, {
    method: 'DELETE',
  }),
  getSchema: (warehouseId) => request(`/warehouses/${warehouseId}/schema`),
  getStats: (warehouseId) => request(`/warehouses/${warehouseId}/stats`),
};

// Client Data API - Client Data Workspace management
export const clientDataApi = {
  /**
   * Get data workspace info for a client
   */
  get: (clientId) => request(`/clients/${clientId}/data`),

  /**
   * Create a new data workspace for a client
   */
  create: (clientId) => request(`/clients/${clientId}/data`, { method: 'POST' }),

  /**
   * Add a platform to the client's data workspace
   */
  addPlatform: (clientId, platformData) =>
    request(`/clients/${clientId}/data/platforms`, {
      method: 'POST',
      body: platformData,
    }),

  /**
   * Upload a CSV file for a platform
   */
  uploadFile: (clientId, platformId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request(`/clients/${clientId}/data/upload/${platformId}`, {
      method: 'POST',
      body: formData,
    });
  },

  /**
   * List all uploads for a client
   */
  listUploads: (clientId, platformId = null) => {
    const query = platformId ? `?platformId=${platformId}` : '';
    return request(`/clients/${clientId}/data/uploads${query}`);
  },

  /**
   * Delete an upload and its data
   */
  deleteUpload: (clientId, uploadId) =>
    request(`/clients/${clientId}/data/uploads/${uploadId}`, { method: 'DELETE' }),

  /**
   * Remove a platform from the client's data workspace
   */
  removePlatform: (clientId, platformId) =>
    request(`/clients/${clientId}/data/platforms/${platformId}`, { method: 'DELETE' }),

  /**
   * Validate uploaded data for a platform
   */
  validateData: (clientId, platformId = null) => {
    const query = platformId ? `?platformId=${platformId}` : '';
    return request(`/clients/${clientId}/data/validate${query}`);
  },

  /**
   * Blend data from all uploaded sources
   */
  blendData: (clientId, options = {}) =>
    request(`/clients/${clientId}/data/blend`, {
      method: 'POST',
      body: options,
    }),

  /**
   * Get blended data for a client
   */
  getBlendedData: (clientId) => request(`/clients/${clientId}/data/blended`),

  /**
   * Get platform schema
   */
  getSchema: (clientId, platformId) =>
    request(`/clients/${clientId}/data/schema/${platformId}`),

  /**
   * Get preview of platform data with pagination
   * @param {string} clientId - Client ID
   * @param {string} platformId - Platform ID
   * @param {number|string} limit - Row limit (number or 'all')
   * @param {number} offset - Row offset for pagination
   */
  getDataPreview: (clientId, platformId, limit = 10, offset = 0) => {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    return request(`/clients/${clientId}/data/data/${platformId}/preview?${params}`);
  },

  /**
   * Get preview of blended data with pagination
   * @param {string} clientId - Client ID
   * @param {number|string} limit - Row limit (number or 'all')
   * @param {number} offset - Row offset for pagination
   */
  getBlendedDataPreview: (clientId, limit = 10, offset = 0) => {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    return request(`/clients/${clientId}/data/blended/preview?${params}`);
  },
};

// Backwards compatibility alias
export const workbookApi = clientDataApi;

// Mappings API
export const mappingsApi = {
  /**
   * List all custom mappings for a client
   */
  list: (clientId) => request(`/clients/${clientId}/mappings`),

  /**
   * Get merged mappings (custom + defaults) for a platform
   */
  get: (clientId, platformId) => request(`/clients/${clientId}/mappings/${platformId}`),

  /**
   * Create a custom mapping
   */
  create: (clientId, data) =>
    request(`/clients/${clientId}/mappings`, {
      method: 'POST',
      body: data,
    }),

  /**
   * Update a custom mapping
   */
  update: (mappingId, data) =>
    request(`/mappings/${mappingId}`, {
      method: 'PUT',
      body: data,
    }),

  /**
   * Delete a custom mapping (reverts to system default)
   */
  delete: (mappingId) =>
    request(`/mappings/${mappingId}`, { method: 'DELETE' }),

  /**
   * Reset all custom mappings for a platform
   */
  reset: (clientId, platformId) =>
    request(`/clients/${clientId}/mappings/${platformId}/reset`, { method: 'POST' }),
};

// Alerts API
export const alertsApi = {
  /**
   * List all alerts for a KPI
   */
  list: (kpiId) => request(`/kpis/${kpiId}/alerts`),

  /**
   * Create a new alert for a KPI
   */
  create: (kpiId, data) =>
    request(`/kpis/${kpiId}/alerts`, {
      method: 'POST',
      body: data,
    }),

  /**
   * Update an alert
   */
  update: (alertId, data) =>
    request(`/alerts/${alertId}`, {
      method: 'PUT',
      body: data,
    }),

  /**
   * Delete an alert
   */
  delete: (alertId) =>
    request(`/alerts/${alertId}`, { method: 'DELETE' }),

  /**
   * Get trigger history for an alert
   */
  getHistory: (alertId, limit = 100) =>
    request(`/alerts/${alertId}/history?limit=${limit}`),

  /**
   * Manually evaluate a KPI's alerts
   */
  evaluate: (kpiId, currentValue) =>
    request(`/alerts/evaluate/${kpiId}`, {
      method: 'POST',
      body: { currentValue },
    }),
};

// Generic API wrapper for direct endpoint access
const api = {
  get: (endpoint) => request(endpoint),
  post: (endpoint, data) => request(endpoint, { method: 'POST', body: data }),
  put: (endpoint, data) => request(endpoint, { method: 'PUT', body: data }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
};

// Export ApiError for use in components/hooks
export { ApiError };

export default api;
