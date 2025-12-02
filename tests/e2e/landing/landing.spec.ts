/**
 * Landing Page E2E Tests
 *
 * Tests the public landing page at / including:
 * - Accessibility without authentication
 * - Hero section and CTAs
 * - Video player component
 * - Navigation to login
 * - Protected route redirects
 */

import { test, expect } from '@playwright/test'
import { ROUTES, login, goToLanding, goToDashboard } from '../fixtures/e2e-helpers'

test.describe('Landing Page', () => {
  test.describe('Public Access', () => {
    test('landing page is accessible without authentication', async ({ page }) => {
      await page.goto(ROUTES.LANDING)
      await page.waitForLoadState('networkidle')

      // Should show landing page content, not login
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(page.getByText(/bring clarity to chaos/i)).toBeVisible()
    })

    test('hero section displays correctly', async ({ page }) => {
      await goToLanding(page)

      // Check hero content
      await expect(page.getByText(/bring clarity to chaos/i)).toBeVisible()
      await expect(
        page.getByText(/marketing data platform|data warehouse|automated reports/i)
      ).toBeVisible()

      // Check CTAs
      await expect(page.getByRole('link', { name: /get started|sign in/i })).toBeVisible()
    })

    test('features grid displays all features', async ({ page }) => {
      await goToLanding(page)

      // Check feature cards (titles from LandingPage.jsx FEATURES array)
      const featureHeadings = [
        /data warehouse/i,
        /automated reports/i,
        /visual analytics/i,
        /smart alerts/i,
        /full lineage/i,
        /multi-platform/i,
      ]

      for (const heading of featureHeadings) {
        await expect(page.getByText(heading).first()).toBeVisible()
      }
    })

    test('sign in button navigates to login page', async ({ page }) => {
      await goToLanding(page)

      // Click sign in
      await page.getByRole('link', { name: /sign in/i }).first().click()

      // Should navigate to login
      await expect(page).toHaveURL(new RegExp(ROUTES.LOGIN))
    })
  })

  test.describe('Video Player', () => {
    test('video section is present', async ({ page }) => {
      await goToLanding(page)

      // Check video container exists (video may not load if no file exists)
      const videoSection = page.locator('[class*="video"], [class*="demo"], video')
      await expect(videoSection.first()).toBeVisible()
    })

    test('video player shows poster or play button when paused', async ({ page }) => {
      await goToLanding(page)

      // Look for video element or play button overlay
      const videoOrPlayButton = page.locator('video, [class*="playButton"], [aria-label*="play" i]')
      await expect(videoOrPlayButton.first()).toBeVisible()
    })
  })

  test.describe('Authentication Flow', () => {
    test('authenticated users are redirected from login to dashboard', async ({ page }) => {
      // First login
      await login(page)

      // Now try to go to login page
      await page.goto(ROUTES.LOGIN)
      await page.waitForLoadState('networkidle')

      // Should redirect to dashboard
      await expect(page).toHaveURL(new RegExp(ROUTES.DASHBOARD))
    })

    test('protected routes redirect to login when unauthenticated', async ({ page }) => {
      // Try to access dashboard directly without auth
      await page.goto(ROUTES.DASHBOARD)
      await page.waitForLoadState('networkidle')

      // Should redirect to login
      await expect(page).toHaveURL(new RegExp(ROUTES.LOGIN))
    })

    test('protected client detail route redirects to login', async ({ page }) => {
      // Try to access a client detail page without auth
      await page.goto('/dashboard/clients/some-fake-id')
      await page.waitForLoadState('networkidle')

      // Should redirect to login
      await expect(page).toHaveURL(new RegExp(ROUTES.LOGIN))
    })

    test('settings route redirects to login when unauthenticated', async ({ page }) => {
      await page.goto(ROUTES.SETTINGS)
      await page.waitForLoadState('networkidle')

      // Should redirect to login
      await expect(page).toHaveURL(new RegExp(ROUTES.LOGIN))
    })
  })

  test.describe('Navigation', () => {
    test('header logo links to landing page', async ({ page }) => {
      await goToLanding(page)

      // Should have a logo/home link
      const logoLink = page.locator('header').getByRole('link').first()
      await expect(logoLink).toBeVisible()
    })

    test('CTA section has action buttons', async ({ page }) => {
      await goToLanding(page)

      // Scroll to CTA section
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

      // Check for final CTA
      const ctaButton = page.getByRole('link', { name: /get started|sign in|start/i }).last()
      await expect(ctaButton).toBeVisible()
    })
  })

  test.describe('Responsive Design', () => {
    test('landing page is responsive on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      await goToLanding(page)

      // Hero should still be visible
      await expect(page.getByText(/bring clarity to chaos/i)).toBeVisible()

      // Features should stack
      const features = page.locator('[class*="feature"]')
      if ((await features.count()) > 0) {
        await expect(features.first()).toBeVisible()
      }
    })

    test('landing page is responsive on tablet', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 })
      await goToLanding(page)

      // Content should be visible
      await expect(page.getByText(/bring clarity to chaos/i)).toBeVisible()
      await expect(page.getByRole('link', { name: /sign in/i }).first()).toBeVisible()
    })
  })
})
