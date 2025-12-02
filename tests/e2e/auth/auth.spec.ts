/**
 * Authentication E2E Tests
 */

import { test, expect } from '@playwright/test'
import { login, setupAppNoAuth, ROUTES, TEST_EMAIL, TEST_PASSWORD } from '../fixtures/e2e-helpers'

test.describe('Login Page', () => {
  test('shows login form when not authenticated', async ({ page }) => {
    await setupAppNoAuth(page)

    // Should see login page
    await expect(page.getByRole('heading', { name: /data hub/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('successful login redirects to dashboard', async ({ page }) => {
    await login(page, TEST_EMAIL, TEST_PASSWORD)
    await page.waitForLoadState('networkidle')

    // Should be on dashboard
    await expect(page).toHaveURL(new RegExp(ROUTES.DASHBOARD))

    // Should see app content
    const hasContent = await page.locator('h1, h2, [role="dialog"]').first().isVisible()
    expect(hasContent).toBe(true)
  })

  test('invalid credentials show error', async ({ page }) => {
    await setupAppNoAuth(page)

    // Fill with wrong password
    await page.getByLabel(/email/i).fill(TEST_EMAIL)
    await page.getByLabel(/password/i).fill('wrong-password')
    await page.getByRole('button', { name: /sign in/i }).click()

    // Should show error message
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 })
  })

  test('empty email shows validation error', async ({ page }) => {
    await setupAppNoAuth(page)

    // Submit without email
    await page.getByLabel(/password/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /sign in/i }).click()

    // Should show validation error
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 })
  })

  test('empty password shows validation error', async ({ page }) => {
    await setupAppNoAuth(page)

    // Submit without password
    await page.getByLabel(/email/i).fill(TEST_EMAIL)
    await page.getByRole('button', { name: /sign in/i }).click()

    // Should show validation error
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Authenticated Session', () => {
  test('app loads after login', async ({ page }) => {
    await login(page, TEST_EMAIL, TEST_PASSWORD)

    // Should see app content (dashboard or onboarding)
    await page.waitForLoadState('networkidle')
    const hasAppContent = await page.locator('h1, h2, [role="dialog"]').first().isVisible()
    expect(hasAppContent).toBe(true)
  })

  test('session persists on page reload', async ({ page }) => {
    await login(page, TEST_EMAIL, TEST_PASSWORD)
    await page.waitForLoadState('networkidle')

    // Reload page
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Should still be authenticated (not showing login form)
    await expect(page.getByLabel(/email/i)).not.toBeVisible()
  })
})
