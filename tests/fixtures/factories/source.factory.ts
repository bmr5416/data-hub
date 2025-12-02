/**
 * Data Source Test Data Factory
 *
 * Generates realistic data source test data
 */

import { faker } from '@faker-js/faker'

export type PlatformType =
  | 'meta_ads'
  | 'google_ads'
  | 'tiktok_ads'
  | 'ga4'
  | 'shopify'
  | 'custom'

export type SourceStatus = 'connected' | 'pending' | 'error' | 'disconnected'

export interface TestSource {
  name: string
  platform: PlatformType
  status: SourceStatus
  client_id?: string
  credentials?: Record<string, string>
  config?: Record<string, any>
  last_sync?: string
  notes?: string
}

const PLATFORMS: PlatformType[] = [
  'meta_ads',
  'google_ads',
  'tiktok_ads',
  'ga4',
  'shopify',
  'custom',
]

const PLATFORM_NAMES: Record<PlatformType, string> = {
  meta_ads: 'Meta Ads',
  google_ads: 'Google Ads',
  tiktok_ads: 'TikTok Ads',
  ga4: 'Google Analytics 4',
  shopify: 'Shopify',
  custom: 'Custom',
}

/**
 * Generate a unique source name
 */
function generateSourceName(platform: PlatformType): string {
  const platformName = PLATFORM_NAMES[platform]
  const unique = getShortUnique()
  return `${platformName} Source [${unique}]`
}

/**
 * Create test source data
 */
export function createTestSource(overrides: Partial<TestSource> = {}): TestSource {
  const platform = overrides.platform || faker.helpers.arrayElement(PLATFORMS)

  return {
    name: generateSourceName(platform),
    platform,
    status: faker.helpers.arrayElement([
      'connected',
      'pending',
      'error',
      'disconnected',
    ]),
    credentials: {
      api_key: faker.string.alphanumeric(32),
      account_id: faker.string.numeric(10),
    },
    config: {
      sync_frequency: faker.helpers.arrayElement(['hourly', 'daily', 'weekly']),
      lookback_days: faker.helpers.arrayElement([7, 14, 30, 90]),
    },
    last_sync: faker.date.recent().toISOString(),
    notes: faker.lorem.sentence(),
    ...overrides,
  }
}

/**
 * Create a connected source
 */
export function createConnectedSource(
  platform?: PlatformType,
  overrides: Partial<TestSource> = {},
): TestSource {
  return createTestSource({
    platform: platform || faker.helpers.arrayElement(PLATFORMS),
    status: 'connected',
    ...overrides,
  })
}

/**
 * Create a source with error status
 */
export function createErrorSource(overrides: Partial<TestSource> = {}): TestSource {
  return createTestSource({
    status: 'error',
    ...overrides,
  })
}

/**
 * Create sources for all platforms
 */
export function createSourcesForAllPlatforms(
  overrides: Partial<TestSource> = {},
): TestSource[] {
  return PLATFORMS.map((platform) =>
    createTestSource({
      platform,
      ...overrides,
    }),
  )
}

/**
 * Create multiple test sources
 */
export function createTestSources(
  count: number,
  overrides: Partial<TestSource> = {},
): TestSource[] {
  return Array.from({ length: count }, () => createTestSource(overrides))
}

export default {
  create: createTestSource,
  createConnected: createConnectedSource,
  createError: createErrorSource,
  createMany: createTestSources,
  createAllPlatforms: createSourcesForAllPlatforms,
  PLATFORMS,
  PLATFORM_NAMES,
}
