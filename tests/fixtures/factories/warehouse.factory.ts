/**
 * Data Warehouse Test Data Factory
 *
 * Generates realistic warehouse test data
 */

import { faker } from '@faker-js/faker'
import { PlatformType, PLATFORMS } from './source.factory'

export interface WarehouseField {
  name: string
  type: 'dimension' | 'metric'
  source_field: string
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max'
}

export interface TestWarehouse {
  name: string
  client_id?: string
  platforms: PlatformType[]
  fields: WarehouseField[]
  is_blended: boolean
  description?: string
  created_at?: string
  updated_at?: string
}

const COMMON_DIMENSIONS: WarehouseField[] = [
  { name: 'date', type: 'dimension', source_field: 'date' },
  { name: 'campaign_name', type: 'dimension', source_field: 'campaign_name' },
  { name: 'platform', type: 'dimension', source_field: 'platform' },
]

const COMMON_METRICS: WarehouseField[] = [
  { name: 'impressions', type: 'metric', source_field: 'impressions', aggregation: 'sum' },
  { name: 'clicks', type: 'metric', source_field: 'clicks', aggregation: 'sum' },
  { name: 'spend', type: 'metric', source_field: 'spend', aggregation: 'sum' },
  { name: 'conversions', type: 'metric', source_field: 'conversions', aggregation: 'sum' },
]

/**
 * Generate a unique warehouse name
 */
function generateWarehouseName(isBlended: boolean): string {
  const prefix = isBlended ? 'Blended' : 'Single'
  const type = faker.helpers.arrayElement(['Performance', 'Marketing', 'Analytics', 'Reporting'])
  const unique = getShortUnique()
  return `${prefix} ${type} Warehouse [${unique}]`
}

/**
 * Create test warehouse data
 */
export function createTestWarehouse(overrides: Partial<TestWarehouse> = {}): TestWarehouse {
  const platforms = overrides.platforms || [faker.helpers.arrayElement(PLATFORMS)]
  const isBlended = overrides.is_blended ?? platforms.length > 1

  return {
    name: generateWarehouseName(isBlended),
    platforms,
    fields: [...COMMON_DIMENSIONS, ...COMMON_METRICS],
    is_blended: isBlended,
    description: faker.lorem.sentence(),
    ...overrides,
  }
}

/**
 * Create a single-platform warehouse
 */
export function createSinglePlatformWarehouse(
  platform: PlatformType,
  overrides: Partial<TestWarehouse> = {},
): TestWarehouse {
  return createTestWarehouse({
    platforms: [platform],
    is_blended: false,
    ...overrides,
  })
}

/**
 * Create a blended warehouse with multiple platforms
 */
export function createBlendedWarehouse(
  platforms: PlatformType[] = ['meta_ads', 'google_ads'],
  overrides: Partial<TestWarehouse> = {},
): TestWarehouse {
  return createTestWarehouse({
    platforms,
    is_blended: true,
    ...overrides,
  })
}

/**
 * Create a warehouse with custom fields
 */
export function createWarehouseWithFields(
  fields: WarehouseField[],
  overrides: Partial<TestWarehouse> = {},
): TestWarehouse {
  return createTestWarehouse({
    fields,
    ...overrides,
  })
}

/**
 * Create multiple test warehouses
 */
export function createTestWarehouses(
  count: number,
  overrides: Partial<TestWarehouse> = {},
): TestWarehouse[] {
  return Array.from({ length: count }, () => createTestWarehouse(overrides))
}

/**
 * Create a minimal warehouse (required fields only)
 */
export function createMinimalWarehouse(name?: string): TestWarehouse {
  return {
    name: name || generateWarehouseName(false),
    platforms: ['meta_ads'],
    fields: [COMMON_DIMENSIONS[0], COMMON_METRICS[0]],
    is_blended: false,
  }
}

export default {
  create: createTestWarehouse,
  createSingle: createSinglePlatformWarehouse,
  createBlended: createBlendedWarehouse,
  createWithFields: createWarehouseWithFields,
  createMany: createTestWarehouses,
  createMinimal: createMinimalWarehouse,
  COMMON_DIMENSIONS,
  COMMON_METRICS,
}
