/**
 * Dashboard Page Object
 *
 * Represents the main dashboard with client list.
 */

import { Page, Locator, expect } from '@playwright/test'

export class DashboardPage {
  readonly page: Page

  // Selectors
  readonly heading: Locator
  readonly addClientButton: Locator
  readonly clientList: Locator
  readonly emptyState: Locator

  // Stats
  readonly totalClientsCard: Locator
  readonly activeClientsCard: Locator
  readonly dataSourcesCard: Locator
  readonly etlProcessesCard: Locator

  // Add Client Modal
  readonly addClientModal: Locator
  readonly clientNameInput: Locator
  readonly clientEmailInput: Locator
  readonly clientIndustrySelect: Locator
  readonly clientNotesTextarea: Locator
  readonly modalSubmitButton: Locator
  readonly modalCancelButton: Locator

  constructor(page: Page) {
    this.page = page

    // Main page elements
    this.heading = page.getByRole('heading', { level: 1, name: /dashboard/i })
    this.addClientButton = page.getByRole('button', { name: /add client/i })
    this.clientList = page.locator('[class*="clientList"]')
    this.emptyState = page.getByText(/no clients yet/i)

    // Stats cards - find by text content within the stats container
    const statsContainer = page.locator('[class*="stats"]')
    this.totalClientsCard = statsContainer.locator(':has-text("Total Clients")').first()
    this.activeClientsCard = statsContainer.locator(':has-text("Active")').first()
    this.dataSourcesCard = statsContainer.locator(':has-text("Data Sources")').first()
    this.etlProcessesCard = statsContainer.locator(':has-text("ETL Processes")').first()

    // Add Client Modal elements
    this.addClientModal = page.getByRole('dialog')
    this.clientNameInput = page.getByLabel(/client name/i)
    this.clientEmailInput = page.getByLabel(/email/i)
    this.clientIndustrySelect = page.getByLabel(/industry/i)
    this.clientNotesTextarea = page.getByLabel(/notes/i)
    this.modalSubmitButton = this.addClientModal.getByRole('button', {
      name: /create|add|save/i,
    })
    this.modalCancelButton = this.addClientModal.getByRole('button', {
      name: /cancel/i,
    })
  }

  /**
   * Navigate to the dashboard
   */
  async goto(): Promise<void> {
    await this.page.goto('/')
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Wait for the dashboard to load
   */
  async waitForLoad(): Promise<void> {
    await expect(this.heading).toBeVisible({ timeout: 10000 })
  }

  /**
   * Open the Add Client modal
   */
  async openAddClientModal(): Promise<void> {
    await this.addClientButton.click()
    await expect(this.addClientModal).toBeVisible()
  }

  /**
   * Fill the Add Client form
   */
  async fillClientForm(data: {
    name: string
    email: string
    industry?: string
    notes?: string
  }): Promise<void> {
    await this.clientNameInput.fill(data.name)
    await this.clientEmailInput.fill(data.email)

    if (data.industry) {
      await this.clientIndustrySelect.selectOption(data.industry)
    }

    if (data.notes) {
      await this.clientNotesTextarea.fill(data.notes)
    }
  }

  /**
   * Submit the Add Client form
   */
  async submitClientForm(): Promise<void> {
    await this.modalSubmitButton.click()
  }

  /**
   * Cancel the Add Client modal
   */
  async cancelClientModal(): Promise<void> {
    await this.modalCancelButton.click()
    await expect(this.addClientModal).not.toBeVisible()
  }

  /**
   * Create a new client via the modal
   */
  async createClient(data: {
    name: string
    email: string
    industry?: string
    notes?: string
  }): Promise<void> {
    await this.openAddClientModal()
    await this.fillClientForm(data)
    await this.submitClientForm()
  }

  /**
   * Get a client card by name
   * Uses link with heading containing the name
   */
  getClientCard(name: string): Locator {
    // Client cards are links containing an h3 with the client name
    return this.page.getByRole('link').filter({
      has: this.page.getByRole('heading', { name, level: 3 }),
    })
  }

  /**
   * Click on a client card to navigate to detail
   */
  async clickClient(name: string): Promise<void> {
    const card = this.getClientCard(name)
    await card.click()
    await this.page.waitForURL(/\/clients\//)
  }

  /**
   * Get the list of visible client names
   */
  async getClientNames(): Promise<string[]> {
    // Get all h3 headings within the client list area
    const headings = this.clientList.locator('h3')
    return headings.allTextContents()
  }

  /**
   * Assert a client exists on the dashboard
   */
  async expectClientVisible(name: string): Promise<void> {
    await expect(this.getClientCard(name)).toBeVisible()
  }

  /**
   * Assert a client does not exist on the dashboard
   */
  async expectClientNotVisible(name: string): Promise<void> {
    await expect(this.getClientCard(name)).not.toBeVisible()
  }

  /**
   * Assert the empty state is shown
   */
  async expectEmptyState(): Promise<void> {
    await expect(this.emptyState).toBeVisible()
  }

  /**
   * Get stat card value
   */
  async getStatValue(label: 'total' | 'active' | 'sources' | 'etl'): Promise<number> {
    const cardMap = {
      total: this.totalClientsCard,
      active: this.activeClientsCard,
      sources: this.dataSourcesCard,
      etl: this.etlProcessesCard,
    }

    const card = cardMap[label]
    // Wait for the card to be visible first
    await card.waitFor({ state: 'visible', timeout: 10000 })
    // Get the text content which includes both value and label
    const text = await card.textContent()
    // Extract numeric value (the first number in the text)
    const match = text?.match(/(\d+)/)
    return match ? parseInt(match[1], 10) : 0
  }

  /**
   * Assert form field error is shown
   */
  async expectFieldError(fieldLabel: RegExp, errorText: RegExp): Promise<void> {
    const field = this.page.getByLabel(fieldLabel)
    await expect(field).toHaveAttribute('aria-invalid', 'true')
    await expect(this.page.getByText(errorText)).toBeVisible()
  }
}
