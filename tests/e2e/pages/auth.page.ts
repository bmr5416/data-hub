/**
 * Auth Page Object
 *
 * Note: The Data Hub app currently has no frontend login page.
 * Authentication is handled at the API level only.
 * This page object provides a consistent interface for tests
 * that might need auth functionality in the future.
 */

import { Page } from '@playwright/test'

export class AuthPage {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  /**
   * Navigate to the app root
   * Since there's no login page, this just goes to /
   */
  async goto(): Promise<void> {
    await this.page.goto('/')
  }

  /**
   * Login flow - currently a no-op since app has no frontend auth
   * Kept for API compatibility with tests
   */
  async login(_password?: string): Promise<void> {
    // No-op: App has no frontend login
    // Just ensure we're on a page
    const url = this.page.url()
    if (url === 'about:blank' || !url.startsWith('http')) {
      await this.page.goto('/')
    }
  }

  /**
   * Assert login was successful
   * Since there's no login, this just verifies we can access the app
   */
  async expectLoginSuccess(): Promise<void> {
    // Wait for the app to be loaded (dashboard visible)
    await this.page.waitForSelector('h1', { timeout: 10000 })
  }
}
