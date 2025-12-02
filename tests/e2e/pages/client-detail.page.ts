/**
 * Client Detail Page Object
 *
 * Represents the client detail page with tabs.
 */

import { Page, Locator, expect } from '@playwright/test'

export type TabName = 'sources' | 'etl' | 'kpis' | 'reports' | 'warehouse' | 'lineage'

export class ClientDetailPage {
  readonly page: Page

  // Header elements
  readonly heading: Locator
  readonly clientEmail: Locator
  readonly clientIndustry: Locator
  readonly statusBadge: Locator
  readonly editClientButton: Locator
  readonly viewPlatformDataButton: Locator
  readonly backToDashboard: Locator

  // Tab navigation
  readonly tabBar: Locator

  // Add buttons (context-dependent)
  readonly addSourceButton: Locator
  readonly addETLButton: Locator
  readonly addKPIButton: Locator
  readonly addReportButton: Locator
  readonly createWarehouseButton: Locator
  readonly addLineageButton: Locator

  // Edit Client Modal
  readonly editClientModal: Locator
  readonly editNameInput: Locator
  readonly editEmailInput: Locator
  readonly editIndustrySelect: Locator
  readonly editStatusSelect: Locator
  readonly editNotesTextarea: Locator
  readonly editSaveButton: Locator
  readonly editCancelButton: Locator

  // Delete Confirmation Modal
  readonly confirmDeleteModal: Locator
  readonly confirmDeleteButton: Locator
  readonly cancelDeleteButton: Locator

  constructor(page: Page) {
    this.page = page

    // Header
    this.heading = page.getByRole('heading', { level: 1 })
    this.clientEmail = page.locator('[class*="email"]')
    this.clientIndustry = page.locator('[class*="industry"]')
    this.statusBadge = page.getByRole('status')
    this.editClientButton = page.getByRole('button', { name: /edit client/i })
    this.viewPlatformDataButton = page.getByRole('button', { name: /platform data/i })
    this.backToDashboard = page.getByRole('link', { name: /back|dashboard/i })

    // Tabs
    this.tabBar = page.locator('[class*="tabs"]')

    // Add buttons
    this.addSourceButton = page.getByRole('button', { name: /add source/i })
    this.addETLButton = page.getByRole('button', { name: /add etl/i })
    this.addKPIButton = page.getByRole('button', { name: /add kpi/i })
    this.addReportButton = page.getByRole('button', { name: /add report|create report/i })
    this.createWarehouseButton = page.getByRole('button', { name: /create data warehouse/i })
    this.addLineageButton = page.getByRole('button', { name: /add connection|add lineage/i })

    // Edit Client Modal
    this.editClientModal = page.getByRole('dialog').filter({ hasText: /edit client/i })
    this.editNameInput = page.getByLabel(/client name/i)
    this.editEmailInput = page.getByLabel(/email/i)
    this.editIndustrySelect = page.getByLabel(/industry/i)
    this.editStatusSelect = page.getByLabel(/status/i)
    this.editNotesTextarea = page.getByLabel(/notes/i)
    this.editSaveButton = page.getByRole('button', { name: /save changes/i })
    this.editCancelButton = this.editClientModal.getByRole('button', { name: /cancel/i })

    // Delete Confirmation Modal
    this.confirmDeleteModal = page.getByRole('dialog').filter({ hasText: /delete/i })
    this.confirmDeleteButton = page.getByRole('button', { name: /^delete$/i })
    this.cancelDeleteButton = this.confirmDeleteModal.getByRole('button', { name: /cancel/i })
  }

  /**
   * Navigate to a client detail page
   */
  async goto(clientId: string): Promise<void> {
    await this.page.goto(`/clients/${clientId}`)
    await this.waitForLoad()
  }

  /**
   * Wait for the page to load
   */
  async waitForLoad(): Promise<void> {
    await expect(this.heading).toBeVisible({ timeout: 10000 })
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Get the client name from the heading
   */
  async getClientName(): Promise<string> {
    return (await this.heading.textContent()) || ''
  }

  /**
   * Navigate to a specific tab
   */
  async clickTab(tabName: TabName): Promise<void> {
    await this.page.getByRole('tab', { name: new RegExp(tabName, 'i') }).click()
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Get the active tab name
   */
  async getActiveTab(): Promise<string> {
    const activeTab = this.page.getByRole('tab', { selected: true })
    return (await activeTab.textContent()) || ''
  }

  /**
   * Get tab badge count
   */
  async getTabCount(tabName: TabName): Promise<number> {
    const tab = this.page.getByRole('tab', { name: new RegExp(tabName, 'i') })
    const text = await tab.textContent()
    const match = text?.match(/\((\d+)\)/)
    return match ? parseInt(match[1], 10) : 0
  }

  // ============================================================================
  // Edit Client Modal
  // ============================================================================

  /**
   * Open the Edit Client modal
   */
  async openEditClientModal(): Promise<void> {
    await this.editClientButton.click()
    await expect(this.editClientModal).toBeVisible()
  }

  /**
   * Fill the Edit Client form
   */
  async fillEditForm(data: {
    name?: string
    email?: string
    industry?: string
    status?: string
    notes?: string
  }): Promise<void> {
    if (data.name !== undefined) {
      await this.editNameInput.clear()
      await this.editNameInput.fill(data.name)
    }
    if (data.email !== undefined) {
      await this.editEmailInput.clear()
      await this.editEmailInput.fill(data.email)
    }
    if (data.industry) {
      await this.editIndustrySelect.selectOption(data.industry)
    }
    if (data.status) {
      await this.editStatusSelect.selectOption(data.status)
    }
    if (data.notes !== undefined) {
      await this.editNotesTextarea.clear()
      await this.editNotesTextarea.fill(data.notes)
    }
  }

  /**
   * Save changes in the Edit Client modal
   */
  async saveEditChanges(): Promise<void> {
    await this.editSaveButton.click()
    await expect(this.editClientModal).not.toBeVisible({ timeout: 5000 })
  }

  /**
   * Cancel the Edit Client modal
   */
  async cancelEdit(): Promise<void> {
    await this.editCancelButton.click()
    await expect(this.editClientModal).not.toBeVisible()
  }

  /**
   * Edit a client via the modal
   */
  async editClient(data: {
    name?: string
    email?: string
    industry?: string
    status?: string
    notes?: string
  }): Promise<void> {
    await this.openEditClientModal()
    await this.fillEditForm(data)
    await this.saveEditChanges()
  }

  /**
   * Get the character count from notes textarea
   */
  async getNotesCharCount(): Promise<{ current: number; max: number }> {
    const countText = await this.page.locator('[class*="charCount"]').textContent()
    const match = countText?.match(/(\d+)\/(\d+)/)
    return {
      current: match ? parseInt(match[1], 10) : 0,
      max: match ? parseInt(match[2], 10) : 0,
    }
  }

  // ============================================================================
  // Delete Flow
  // ============================================================================

  /**
   * Initiate client deletion (opens confirmation modal)
   */
  async clickDeleteClient(): Promise<void> {
    const deleteButton = this.page.getByRole('button', { name: /delete client/i })
    await deleteButton.click()
    await expect(this.confirmDeleteModal).toBeVisible()
  }

  /**
   * Confirm deletion in the modal
   */
  async confirmDelete(): Promise<void> {
    await this.confirmDeleteButton.click()
    await expect(this.confirmDeleteModal).not.toBeVisible()
  }

  /**
   * Cancel deletion in the modal
   */
  async cancelDelete(): Promise<void> {
    await this.cancelDeleteButton.click()
    await expect(this.confirmDeleteModal).not.toBeVisible()
  }

  /**
   * Delete client and wait for redirect
   */
  async deleteClient(): Promise<void> {
    await this.clickDeleteClient()
    await this.confirmDelete()
    await this.page.waitForURL(/\/$|\/dashboard/)
  }

  // ============================================================================
  // Source Tab Actions
  // ============================================================================

  /**
   * Open the Add Source wizard
   */
  async openAddSourceWizard(): Promise<void> {
    await this.clickTab('sources')
    await this.addSourceButton.click()
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Get a source item by name
   */
  getSourceItem(name: string): Locator {
    return this.page.locator('[class*="source"]').filter({ hasText: name })
  }

  /**
   * Click on a source to view details
   */
  async clickSource(name: string): Promise<void> {
    await this.getSourceItem(name).click()
  }

  // ============================================================================
  // Report Tab Actions
  // ============================================================================

  /**
   * Open the Report Builder wizard
   */
  async openReportBuilder(): Promise<void> {
    await this.clickTab('reports')
    await this.addReportButton.click()
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Get a report item by name
   */
  getReportItem(name: string): Locator {
    return this.page.locator('[class*="report"]').filter({ hasText: name })
  }

  /**
   * Click on a report to view details
   */
  async clickReport(name: string): Promise<void> {
    await this.getReportItem(name).click()
  }

  // ============================================================================
  // Warehouse Tab Actions
  // ============================================================================

  /**
   * Open the Create Warehouse wizard
   */
  async openWarehouseWizard(): Promise<void> {
    await this.clickTab('warehouse')
    await this.createWarehouseButton.click()
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Get a warehouse item by name
   */
  getWarehouseItem(name: string): Locator {
    return this.page.locator('[class*="warehouse"]').filter({ hasText: name })
  }

  /**
   * Click on a warehouse to view details
   */
  async clickWarehouse(name: string): Promise<void> {
    await this.getWarehouseItem(name).click()
  }

  // ============================================================================
  // Assertions
  // ============================================================================

  /**
   * Assert the client status badge shows expected status
   */
  async expectStatus(status: 'active' | 'inactive' | 'onboarding'): Promise<void> {
    await expect(this.statusBadge).toContainText(new RegExp(status, 'i'))
  }

  /**
   * Assert an item exists in the current tab
   */
  async expectItemInTab(name: string): Promise<void> {
    await expect(this.page.getByText(name)).toBeVisible()
  }

  /**
   * Assert a form field error is shown
   */
  async expectFieldError(errorText: RegExp): Promise<void> {
    await expect(this.page.getByText(errorText)).toBeVisible()
  }
}
