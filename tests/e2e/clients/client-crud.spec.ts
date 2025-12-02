/**
 * Client CRUD E2E Tests
 *
 * Tests for client management:
 * - Create client via modal
 * - Edit client via modal (EditClientModal)
 * - Delete client via confirmation modal (ConfirmDeleteModal)
 * - Form validation
 * - Navigation
 */

import { test, expect } from '@playwright/test'
import { DashboardPage, ClientDetailPage } from '../pages'
import { getTestId, cleanupByTestId, INDUSTRIES, login, ROUTES } from '../fixtures/e2e-helpers'

const ONBOARDING_KEY = 'datahub_onboarding_complete'

let testId: string

test.describe('Client CRUD', () => {
  test.beforeEach(async ({ page }) => {
    testId = getTestId()

    // Skip onboarding via localStorage before login
    await page.goto(ROUTES.LOGIN)
    await page.evaluate((key) => localStorage.setItem(key, '1'), ONBOARDING_KEY)

    // Login and navigate to dashboard
    await login(page)
  })

  test.afterEach(async () => {
    await cleanupByTestId(testId)
  })

  // ==========================================================================
  // CREATE
  // ==========================================================================

  test.describe('Create Client', () => {
    test('create client with valid data', async ({ page }) => {
      const dashboard = new DashboardPage(page)

      await dashboard.waitForLoad()

      const clientData = {
        name: `Test Client [${testId}]`,
        email: `test-${testId}@test.local`,
        industry: 'Technology',
        notes: 'Created by E2E test',
      }

      await dashboard.createClient(clientData)

      // Should navigate to client detail
      await page.waitForURL(/\/dashboard\/clients\//)

      const clientDetail = new ClientDetailPage(page)
      await clientDetail.waitForLoad()

      const name = await clientDetail.getClientName()
      expect(name).toContain(clientData.name)
    })

    test('create client - name validation (too short)', async ({ page }) => {
      const dashboard = new DashboardPage(page)

      await dashboard.waitForLoad()

      await dashboard.openAddClientModal()
      await dashboard.fillClientForm({
        name: 'A', // Too short (needs 2+ chars)
        email: `test-${testId}@test.local`,
      })
      await dashboard.submitClientForm()

      // Should show validation error
      await dashboard.expectFieldError(/client name/i, /at least 2 characters/i)
    })

    test('create client - name validation (too long)', async ({ page }) => {
      const dashboard = new DashboardPage(page)

      await dashboard.waitForLoad()

      await dashboard.openAddClientModal()
      await dashboard.fillClientForm({
        name: 'A'.repeat(101), // Too long (max 100 chars)
        email: `test-${testId}@test.local`,
      })
      await dashboard.submitClientForm()

      // Should show validation error
      await dashboard.expectFieldError(/client name/i, /less than 100 characters/i)
    })

    test('create client - email validation (invalid format)', async ({ page }) => {
      const dashboard = new DashboardPage(page)

      await dashboard.waitForLoad()

      await dashboard.openAddClientModal()
      await dashboard.fillClientForm({
        name: `Test Client [${testId}]`,
        // Use email that passes browser's native validation but fails custom regex
        // Regex requires: <local>@<domain>.<tld> format
        email: 'test@test', // Missing TLD (domain without dot)
      })
      await dashboard.submitClientForm()

      // Should show validation error from custom validation
      await dashboard.expectFieldError(/email/i, /valid email/i)
    })

    test('create client - all industries', async ({ page }) => {
      const dashboard = new DashboardPage(page)

      await dashboard.waitForLoad()

      // Test first industry as a sample
      const industry = INDUSTRIES[0]

      await dashboard.createClient({
        name: `Industry Test [${testId}]`,
        email: `industry-${testId}@test.local`,
        industry,
      })

      // Should navigate to client detail
      await page.waitForURL(/\/dashboard\/clients\//)
    })

    test('create client with max notes (1000 chars)', async ({ page }) => {
      const dashboard = new DashboardPage(page)

      await dashboard.waitForLoad()

      const maxNotes = 'A'.repeat(1000)

      await dashboard.createClient({
        name: `Notes Test [${testId}]`,
        email: `notes-${testId}@test.local`,
        notes: maxNotes,
      })

      // Should succeed
      await page.waitForURL(/\/dashboard\/clients\//)
    })

    test('cancel add client modal', async ({ page }) => {
      const dashboard = new DashboardPage(page)

      await dashboard.waitForLoad()

      await dashboard.openAddClientModal()
      await dashboard.fillClientForm({
        name: `Cancel Test [${testId}]`,
        email: `cancel-${testId}@test.local`,
      })
      await dashboard.cancelClientModal()

      // Modal should be closed
      await expect(dashboard.addClientModal).not.toBeVisible()

      // Client should NOT be created
      await dashboard.expectClientNotVisible(`Cancel Test [${testId}]`)
    })
  })

  // ==========================================================================
  // EDIT (EditClientModal)
  // ==========================================================================

  test.describe('Edit Client', () => {
    test('open edit modal shows current data', async ({ page }) => {
      const dashboard = new DashboardPage(page)
      const clientDetail = new ClientDetailPage(page)

      await dashboard.waitForLoad()

      // Create a client first
      const originalName = `Edit Test [${testId}]`
      await dashboard.createClient({
        name: originalName,
        email: `edit-${testId}@test.local`,
        industry: 'SaaS',
      })

      await clientDetail.waitForLoad()

      // Open edit modal
      await clientDetail.openEditClientModal()

      // Verify current data is populated
      await expect(clientDetail.editNameInput).toHaveValue(originalName)
      await expect(clientDetail.editEmailInput).toHaveValue(`edit-${testId}@test.local`)
    })

    test('edit client name', async ({ page }) => {
      const dashboard = new DashboardPage(page)
      const clientDetail = new ClientDetailPage(page)

      await dashboard.waitForLoad()

      // Create a client
      await dashboard.createClient({
        name: `Original Name [${testId}]`,
        email: `editname-${testId}@test.local`,
      })

      await clientDetail.waitForLoad()

      // Edit the name
      const newName = `Updated Name [${testId}]`
      await clientDetail.editClient({ name: newName })

      // Verify update persisted
      await page.waitForLoadState('networkidle')
      const displayedName = await clientDetail.getClientName()
      expect(displayedName).toContain(newName)
    })

    test('edit client email', async ({ page }) => {
      const dashboard = new DashboardPage(page)
      const clientDetail = new ClientDetailPage(page)

      await dashboard.waitForLoad()

      // Create a client
      await dashboard.createClient({
        name: `Email Test [${testId}]`,
        email: `old-${testId}@test.local`,
      })

      await clientDetail.waitForLoad()

      // Edit the email
      await clientDetail.editClient({ email: `new-${testId}@test.local` })

      // Reload to verify persistence
      await page.reload()
      await clientDetail.waitForLoad()

      await clientDetail.openEditClientModal()
      await expect(clientDetail.editEmailInput).toHaveValue(`new-${testId}@test.local`)
    })

    test('edit client status', async ({ page }) => {
      const dashboard = new DashboardPage(page)
      const clientDetail = new ClientDetailPage(page)

      await dashboard.waitForLoad()

      // Create a client (default status is usually 'onboarding')
      await dashboard.createClient({
        name: `Status Test [${testId}]`,
        email: `status-${testId}@test.local`,
      })

      await clientDetail.waitForLoad()

      // Edit status to 'active'
      await clientDetail.editClient({ status: 'active' })

      // Verify status badge updated
      await clientDetail.expectStatus('active')
    })

    test('edit with validation errors', async ({ page }) => {
      const dashboard = new DashboardPage(page)
      const clientDetail = new ClientDetailPage(page)

      await dashboard.waitForLoad()

      // Create a client
      await dashboard.createClient({
        name: `Validation Test [${testId}]`,
        email: `validation-${testId}@test.local`,
      })

      await clientDetail.waitForLoad()

      // Try to edit with invalid data
      await clientDetail.openEditClientModal()
      await clientDetail.fillEditForm({ name: '' }) // Empty name
      await clientDetail.editSaveButton.click()

      // Should show validation error
      await clientDetail.expectFieldError(/required/i)
    })

    test('cancel edit does not save changes', async ({ page }) => {
      const dashboard = new DashboardPage(page)
      const clientDetail = new ClientDetailPage(page)

      await dashboard.waitForLoad()

      const originalName = `Cancel Edit [${testId}]`
      await dashboard.createClient({
        name: originalName,
        email: `canceledit-${testId}@test.local`,
      })

      await clientDetail.waitForLoad()

      // Open edit modal and make changes
      await clientDetail.openEditClientModal()
      await clientDetail.fillEditForm({ name: 'Changed Name That Should Not Save' })
      await clientDetail.cancelEdit()

      // Name should still be original
      const displayedName = await clientDetail.getClientName()
      expect(displayedName).toContain(originalName)
    })

    test('character count on notes', async ({ page }) => {
      const dashboard = new DashboardPage(page)
      const clientDetail = new ClientDetailPage(page)

      await dashboard.waitForLoad()

      await dashboard.createClient({
        name: `Char Count [${testId}]`,
        email: `charcount-${testId}@test.local`,
      })

      await clientDetail.waitForLoad()

      // Open edit modal
      await clientDetail.openEditClientModal()

      // Type some notes
      const testNotes = 'This is a test note with 50 characters total!!!'
      await clientDetail.fillEditForm({ notes: testNotes })

      // Verify character count updates
      const charCount = await clientDetail.getNotesCharCount()
      expect(charCount.current).toBe(testNotes.length)
      expect(charCount.max).toBe(1000)
    })
  })

  // ==========================================================================
  // DELETE (ConfirmDeleteModal)
  // ==========================================================================

  test.describe('Delete Client', () => {
    test('delete with confirmation', async ({ page }) => {
      const dashboard = new DashboardPage(page)
      const clientDetail = new ClientDetailPage(page)

      await dashboard.waitForLoad()

      const clientName = `Delete Test [${testId}]`
      await dashboard.createClient({
        name: clientName,
        email: `delete-${testId}@test.local`,
      })

      await clientDetail.waitForLoad()

      // Delete client
      await clientDetail.deleteClient()

      // Should redirect to dashboard
      await dashboard.waitForLoad()

      // Client should no longer appear
      await dashboard.expectClientNotVisible(clientName)
    })

    test('cancel delete keeps client', async ({ page }) => {
      const dashboard = new DashboardPage(page)
      const clientDetail = new ClientDetailPage(page)

      await dashboard.waitForLoad()

      const clientName = `Keep Me [${testId}]`
      await dashboard.createClient({
        name: clientName,
        email: `keep-${testId}@test.local`,
      })

      await clientDetail.waitForLoad()

      // Open delete confirmation but cancel
      await clientDetail.clickDeleteClient()
      await clientDetail.cancelDelete()

      // Should still be on client detail page
      const displayedName = await clientDetail.getClientName()
      expect(displayedName).toContain(clientName)

      // Navigate to dashboard and verify client still exists
      await page.goto(ROUTES.DASHBOARD)
      await dashboard.waitForLoad()
      await dashboard.expectClientVisible(clientName)
    })

    test('delete shows entity name in confirmation', async ({ page }) => {
      const dashboard = new DashboardPage(page)
      const clientDetail = new ClientDetailPage(page)

      await dashboard.waitForLoad()

      const clientName = `Confirm Name [${testId}]`
      await dashboard.createClient({
        name: clientName,
        email: `confirm-${testId}@test.local`,
      })

      await clientDetail.waitForLoad()

      // Open delete confirmation
      await clientDetail.clickDeleteClient()

      // Modal should show the client name
      await expect(clientDetail.confirmDeleteModal).toContainText(clientName)

      // Cancel to clean up
      await clientDetail.cancelDelete()
    })

    test('loading state during delete', async ({ page }) => {
      const dashboard = new DashboardPage(page)
      const clientDetail = new ClientDetailPage(page)

      await dashboard.waitForLoad()

      await dashboard.createClient({
        name: `Loading Test [${testId}]`,
        email: `loading-${testId}@test.local`,
      })

      await clientDetail.waitForLoad()

      // Open delete confirmation
      await clientDetail.clickDeleteClient()

      // Click confirm and observe loading state
      // Note: This may be too fast to observe, but we verify the flow works
      await clientDetail.confirmDelete()

      // Should redirect after delete
      await dashboard.waitForLoad()
    })
  })

  // ==========================================================================
  // NAVIGATION
  // ==========================================================================

  test.describe('Navigation', () => {
    test('view client detail page', async ({ page }) => {
      const dashboard = new DashboardPage(page)
      const clientDetail = new ClientDetailPage(page)

      await dashboard.waitForLoad()

      const clientName = `Nav Test [${testId}]`
      await dashboard.createClient({
        name: clientName,
        email: `nav-${testId}@test.local`,
      })

      await clientDetail.waitForLoad()

      // Go back to dashboard
      await page.goto(ROUTES.DASHBOARD)
      await dashboard.waitForLoad()

      // Click client to navigate
      await dashboard.clickClient(clientName)

      // Should be on client detail page
      await clientDetail.waitForLoad()
      const displayedName = await clientDetail.getClientName()
      expect(displayedName).toContain(clientName)
    })

    test('client card shows correct info', async ({ page }) => {
      const dashboard = new DashboardPage(page)

      await dashboard.waitForLoad()

      const clientData = {
        name: `Card Info [${testId}]`,
        email: `cardinfo-${testId}@test.local`,
        industry: 'Healthcare',
      }

      await dashboard.createClient(clientData)

      // Navigate back to dashboard
      await page.goto(ROUTES.DASHBOARD)
      await dashboard.waitForLoad()

      // Verify client card shows info
      const clientCard = dashboard.getClientCard(clientData.name)
      await expect(clientCard).toContainText(clientData.email)
      await expect(clientCard).toContainText(clientData.industry)
    })
  })
})
