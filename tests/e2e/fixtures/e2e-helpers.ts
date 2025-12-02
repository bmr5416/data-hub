/**
 * E2E Test Helpers
 */

import { Page, expect } from '@playwright/test'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// ============================================================================
// Configuration
// ============================================================================

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321'
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001'

// Test user credentials (must match scripts/setup-test-user.js)
const TEST_EMAIL = 'test@test.com'
const TEST_PASSWORD = 'testtest'

// Onboarding localStorage key
const ONBOARDING_KEY = 'datahub_onboarding_complete'

// Route constants (mirror client/src/constants/routes.js)
export const ROUTES = {
  LANDING: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  SETTINGS: '/dashboard/settings',
} as const

/**
 * Generate client detail route
 */
export function clientDetailRoute(clientId: string): string {
  return `/dashboard/clients/${clientId}`
}

// Sequence counter for guaranteed uniqueness
let uniqueCounter = 0

// ============================================================================
// Unique ID Generation
// ============================================================================

/**
 * Generate a unique test ID for isolation
 * Format: e2e-{timestamp36}-{random6}
 */
export function getTestId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  const sequence = (++uniqueCounter).toString(36).padStart(2, '0')
  return `e2e-${timestamp}-${random}-${sequence}`
}

/**
 * Generate a short unique string
 */
export function getShortUnique(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 6)
}

// ============================================================================
// Test Data Factories
// ============================================================================

const INDUSTRIES = [
  'E-commerce',
  'SaaS',
  'Healthcare',
  'Finance',
  'Education',
  'Media',
  'Travel',
  'Retail',
  'Technology',
  'Other',
]

/**
 * Generate test client data with unique identifiers
 */
export function testClient(testId: string) {
  return {
    name: `Test Client [${testId}]`,
    email: `test-${testId}@test.local`,
    industry: INDUSTRIES[Math.floor(Math.random() * INDUSTRIES.length)],
  }
}

/**
 * Generate test source data
 */
export function testSource(testId: string, platform = 'meta_ads') {
  return {
    name: `Test Source [${testId}]`,
    platform,
    sourceType: 'advertising',
    connectionMethod: 'manual_upload',
    refreshFrequency: 'daily',
    status: 'connected',
  }
}

/**
 * Generate test warehouse data
 */
export function testWarehouse(testId: string, platforms = ['meta_ads']) {
  return {
    name: `Test Warehouse [${testId}]`,
    platforms,
    includeBlendedTable: true,
  }
}

/**
 * Generate test report data
 */
export function testReport(testId: string) {
  return {
    name: `Test Report [${testId}]`,
    type: 'builder',
    frequency: 'on_demand',
    deliveryFormat: 'view_only',
  }
}

// ============================================================================
// Supabase Client
// ============================================================================

/**
 * Create a Supabase admin client for API-level cleanup
 */
export function createAdminClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

// ============================================================================
// API-Level Cleanup
// ============================================================================

/**
 * Clean up test data by matching test ID in client names
 * Uses cascade deletion - deleting client removes all related data
 */
export async function cleanupByTestId(testId: string): Promise<void> {
  const supabase = createAdminClient()

  try {
    // Delete clients matching the test ID (cascades to all related data)
    const { error } = await supabase
      .from('clients')
      .delete()
      .like('name', `%${testId}%`)

    if (error && error.code !== 'PGRST116') {
      console.warn(`Cleanup warning for testId ${testId}:`, error.message)
    }
  } catch (err) {
    console.warn('Cleanup error:', err)
  }
}

/**
 * Clean up all E2E test data (use with caution)
 * Only deletes records with 'e2e-' prefix
 */
export async function cleanupAllE2EData(): Promise<void> {
  const supabase = createAdminClient()

  try {
    await supabase.from('clients').delete().like('name', '%[e2e-%')
  } catch (err) {
    console.warn('Full cleanup error:', err)
  }
}

// ============================================================================
// App Setup Helpers
// ============================================================================

/**
 * Login via the UI using test credentials
 * Uses test@test.com / testtest by default
 */
export async function login(
  page: Page,
  email = TEST_EMAIL,
  password = TEST_PASSWORD,
): Promise<void> {
  // Navigate to login page
  await page.goto(ROUTES.LOGIN)
  await page.waitForLoadState('networkidle')

  // Fill login form
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/password/i).fill(password)

  // Submit
  await page.getByRole('button', { name: /sign in/i }).click()

  // Wait for navigation to dashboard
  await page.waitForURL(`**${ROUTES.DASHBOARD}**`, { timeout: 10000 })
  await page.waitForLoadState('networkidle')
}

/**
 * Login and wait for app to be ready
 */
export async function setupApp(page: Page): Promise<void> {
  await login(page)
  await page.waitForLoadState('networkidle')
}

/**
 * Setup app without login (for testing login page itself)
 */
export async function setupAppNoAuth(page: Page): Promise<void> {
  await page.goto(ROUTES.LOGIN)
  await page.waitForLoadState('networkidle')
}

/**
 * Navigate to landing page (public)
 */
export async function goToLanding(page: Page): Promise<void> {
  await page.goto(ROUTES.LANDING)
  await page.waitForLoadState('networkidle')
}

/**
 * Navigate to dashboard (requires auth)
 */
export async function goToDashboard(page: Page): Promise<void> {
  await page.goto(ROUTES.DASHBOARD)
  await page.waitForLoadState('networkidle')
}

// ============================================================================
// Page Interaction Helpers
// ============================================================================

/**
 * Wait for all loading states to complete
 */
export async function waitForLoad(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle')

  // Wait for any loading indicators to disappear
  const loadingIndicators = page.locator('[data-loading="true"], .loading, [aria-busy="true"]')
  await expect(loadingIndicators).toHaveCount(0, { timeout: 10000 })
}

/**
 * Wait for a modal to be visible
 */
export async function waitForModal(page: Page, titlePattern: RegExp): Promise<void> {
  await page.getByRole('dialog').waitFor({ state: 'visible' })
  await expect(page.getByRole('heading', { name: titlePattern })).toBeVisible()
}

/**
 * Close a modal by clicking Cancel or X button
 */
export async function closeModal(page: Page): Promise<void> {
  const dialog = page.getByRole('dialog')
  if (await dialog.isVisible()) {
    const cancelButton = dialog.getByRole('button', { name: /cancel|close/i })
    if (await cancelButton.isVisible()) {
      await cancelButton.click()
    } else {
      // Try pressing Escape
      await page.keyboard.press('Escape')
    }
    await expect(dialog).not.toBeVisible()
  }
}

/**
 * Navigate to a specific tab in client detail
 */
export async function navigateToTab(page: Page, tabName: string): Promise<void> {
  await page.getByRole('tab', { name: new RegExp(tabName, 'i') }).click()
  await waitForLoad(page)
}

/**
 * Fill a form field by label
 */
export async function fillField(
  page: Page,
  labelPattern: RegExp,
  value: string,
): Promise<void> {
  await page.getByLabel(labelPattern).fill(value)
}

/**
 * Select an option from a dropdown by label
 */
export async function selectOption(
  page: Page,
  labelPattern: RegExp,
  value: string,
): Promise<void> {
  await page.getByLabel(labelPattern).selectOption(value)
}

// ============================================================================
// Wizard Navigation Helpers
// ============================================================================

/**
 * Click Next in a wizard
 */
export async function wizardNext(page: Page): Promise<void> {
  await page.getByRole('button', { name: /next|continue/i }).click()
  await waitForLoad(page)
}

/**
 * Click Back in a wizard
 */
export async function wizardBack(page: Page): Promise<void> {
  await page.getByRole('button', { name: /back|previous/i }).click()
  await waitForLoad(page)
}

/**
 * Click Cancel in a wizard
 */
export async function wizardCancel(page: Page): Promise<void> {
  await page.getByRole('button', { name: /cancel/i }).click()
}

/**
 * Complete a wizard by clicking the final submit button
 */
export async function wizardComplete(page: Page): Promise<void> {
  await page
    .getByRole('button', { name: /create|finish|complete|save|done/i })
    .click()
  await waitForLoad(page)
}

// ============================================================================
// Assertion Helpers
// ============================================================================

/**
 * Assert a toast/notification message appears
 */
export async function expectToast(page: Page, textPattern: RegExp): Promise<void> {
  await expect(page.getByRole('alert').filter({ hasText: textPattern })).toBeVisible({
    timeout: 5000,
  })
}

/**
 * Assert a validation error appears
 */
export async function expectFieldError(page: Page, errorText: RegExp): Promise<void> {
  await expect(page.getByText(errorText)).toBeVisible()
}

/**
 * Assert an element with specific text exists
 */
export async function expectText(page: Page, text: RegExp | string): Promise<void> {
  await expect(page.getByText(text)).toBeVisible()
}

// ============================================================================
// File Upload Helpers
// ============================================================================

/**
 * Upload a CSV file via file input
 */
export async function uploadCSV(
  page: Page,
  filePath: string,
  inputSelector = 'input[type="file"]',
): Promise<void> {
  const fileInput = page.locator(inputSelector)
  await fileInput.setInputFiles(filePath)
  await waitForLoad(page)
}

// ============================================================================
// API Helpers (for setup/verification)
// ============================================================================

/**
 * Create a client via API (faster than UI for test setup)
 */
export async function createClientViaAPI(
  testId: string,
): Promise<{ id: string; name: string }> {
  const clientData = testClient(testId)
  const headers = await getAuthHeaders()

  const response = await fetch(`${API_BASE_URL}/api/clients`, {
    method: 'POST',
    headers,
    body: JSON.stringify(clientData),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to create client: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  return { id: data.client.id, name: clientData.name }
}

/**
 * Delete a client via API
 */
export async function deleteClientViaAPI(clientId: string): Promise<void> {
  const headers = await getAuthHeaders()
  await fetch(`${API_BASE_URL}/api/clients/${clientId}`, {
    method: 'DELETE',
    headers,
  })
}

/**
 * Verify a client exists via API
 */
export async function clientExistsViaAPI(clientId: string): Promise<boolean> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_BASE_URL}/api/clients/${clientId}`, { headers })
  return response.ok
}

// ============================================================================
// Test Context Class
// ============================================================================

/**
 * E2E Test Context
 * Manages test isolation and cleanup
 */
export class E2ETestContext {
  public readonly testId: string
  private createdClientIds: string[] = []

  constructor() {
    this.testId = getTestId()
  }

  /**
   * Track a created client for cleanup
   */
  trackClient(clientId: string): void {
    this.createdClientIds.push(clientId)
  }

  /**
   * Get test data with unique identifiers
   */
  get client() {
    return testClient(this.testId)
  }

  get source() {
    return testSource(this.testId)
  }

  get warehouse() {
    return testWarehouse(this.testId)
  }

  get report() {
    return testReport(this.testId)
  }

  /**
   * Clean up all created data
   */
  async cleanup(): Promise<void> {
    // Clean up tracked clients via API (cascades to all related data)
    for (const clientId of this.createdClientIds) {
      await deleteClientViaAPI(clientId)
    }

    // Also clean up by test ID pattern (catches any missed items)
    await cleanupByTestId(this.testId)
  }
}

// ============================================================================
// Authentication Token Helpers
// ============================================================================

let cachedAuthToken: string | null = null
let tokenExpiry: number = 0

/**
 * Get an auth token by signing in via Supabase
 * Caches the token for efficiency
 */
export async function getAuthToken(): Promise<string> {
  // Return cached token if still valid (with 5 minute buffer)
  if (cachedAuthToken && Date.now() < tokenExpiry - 300000) {
    return cachedAuthToken
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  const { data, error } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  })

  if (error || !data.session) {
    throw new Error(`Failed to get auth token: ${error?.message || 'No session returned'}`)
  }

  cachedAuthToken = data.session.access_token
  // Token expires in 1 hour by default, cache expiry time
  tokenExpiry = Date.now() + 3600000

  return cachedAuthToken
}

/**
 * Clear the cached auth token (useful for cleanup)
 */
export function clearAuthToken(): void {
  cachedAuthToken = null
  tokenExpiry = 0
}

/**
 * Get headers for authenticated API requests
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getAuthToken()
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

// ============================================================================
// API Setup Helpers (for faster test setup)
// ============================================================================

/**
 * Create a source via API (faster than UI for test setup)
 */
export async function createSourceViaAPI(
  clientId: string,
  testId: string,
  platform = 'meta_ads',
): Promise<{ id: string; name: string }> {
  const headers = await getAuthHeaders()
  const sourceData = testSource(testId, platform)

  const response = await fetch(`${API_BASE_URL}/api/clients/${clientId}/sources`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: sourceData.name,
      platform_id: platform,
      source_type: sourceData.sourceType,
      connection_method: sourceData.connectionMethod,
      refresh_frequency: sourceData.refreshFrequency,
      status: sourceData.status,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to create source: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  return { id: data.source.id, name: sourceData.name }
}

/**
 * Create a warehouse via API (faster than UI for test setup)
 */
export async function createWarehouseViaAPI(
  clientId: string,
  testId: string,
  platforms: string[] = ['meta_ads'],
): Promise<{ id: string; name: string }> {
  const headers = await getAuthHeaders()
  const warehouseData = testWarehouse(testId, platforms)

  // Build field selections for each platform
  const fieldSelections: Record<string, { dimensions: string[]; metrics: string[] }> = {}
  for (const platform of platforms) {
    fieldSelections[platform] = {
      dimensions: ['date', 'campaign_name'],
      metrics: ['impressions', 'clicks', 'spend'],
    }
  }

  const response = await fetch(`${API_BASE_URL}/api/clients/${clientId}/warehouses`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: warehouseData.name,
      platforms,
      fieldSelections,
      includeBlendedTable: warehouseData.includeBlendedTable,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to create warehouse: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  return { id: data.warehouse.id, name: warehouseData.name }
}

/**
 * Create a report via API (faster than UI for test setup)
 */
export async function createReportViaAPI(
  clientId: string,
  warehouseId: string,
  testId: string,
): Promise<{ id: string; name: string }> {
  const headers = await getAuthHeaders()
  const reportData = testReport(testId)

  const response = await fetch(`${API_BASE_URL}/api/reports`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: reportData.name,
      client_id: clientId,
      warehouse_id: warehouseId,
      type: reportData.type,
      frequency: reportData.frequency,
      delivery_format: reportData.deliveryFormat,
      is_scheduled: false,
      recipients: [],
      visualization_config: { visualizations: [], dateRange: 'last_30_days' },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to create report: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  return { id: data.report.id, name: reportData.name }
}

/**
 * Get the absolute path to a test fixture file
 */
export function getFixturePath(relativePath: string): string {
  // Path relative to the tests directory
  return `tests/fixtures/${relativePath}`
}

// ============================================================================
// Exports
// ============================================================================

export {
  TEST_EMAIL,
  TEST_PASSWORD,
  API_BASE_URL,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  INDUSTRIES,
  ONBOARDING_KEY,
}
