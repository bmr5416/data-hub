/**
 * Test Data Factories
 *
 * Centralized exports for all test data factories
 */

export * from './client.factory'
export * from './source.factory'
export * from './warehouse.factory'
export * from './report.factory'

// Default exports for convenient access
import clientFactory from './client.factory'
import sourceFactory from './source.factory'
import warehouseFactory from './warehouse.factory'
import reportFactory from './report.factory'

export const factories = {
  client: clientFactory,
  source: sourceFactory,
  warehouse: warehouseFactory,
  report: reportFactory,
}

export default factories
