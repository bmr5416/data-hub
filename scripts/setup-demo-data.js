/**
 * Demo Data Setup Script
 *
 * Creates demo user and sample data for recording demo videos.
 * Uses Supabase Admin API to create users and seed data.
 *
 * Usage: npm run record:demo:setup
 *
 * Prerequisites:
 *   1. Local Supabase running: `supabase start`
 *   2. Environment variables set (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
 */

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Generate a prefixed ID (matching server/services/database/BaseService.js)
 */
function generateId(prefix) {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}

// =============================================================================
// Configuration
// =============================================================================

const CONFIG = {
  // Demo user credentials - MUST match record-demo.js
  user: {
    email: 'demo@datahub.local',
    password: 'demodemo123',
    displayName: 'Demo User',
  },

  // Demo client
  client: {
    name: 'Acme Marketing Co.',
    email: 'reports@acmemarketing.com',
    industry: 'Marketing Agency',
    status: 'active',
  },

  // Sample data sources (matches actual data_sources table schema)
  sources: [
    {
      name: 'Meta Ads - Acme',
      platform: 'meta_ads',
      source_type: 'api',
      connection_method: 'oauth',
      refresh_frequency: 'daily',
      status: 'connected',
    },
    {
      name: 'Google Ads - Acme',
      platform: 'google_ads',
      source_type: 'api',
      connection_method: 'oauth',
      refresh_frequency: 'daily',
      status: 'connected',
    },
    {
      name: 'GA4 - Acme Website',
      platform: 'ga4',
      source_type: 'api',
      connection_method: 'oauth',
      refresh_frequency: 'daily',
      status: 'connected',
    },
    {
      name: 'Shopify - Acme Store',
      platform: 'shopify',
      source_type: 'api',
      connection_method: 'api_key',
      refresh_frequency: 'daily',
      status: 'connected',
    },
  ],

  // Sample warehouse (matches actual data_warehouses table schema)
  warehouse: {
    name: 'Acme Performance Dashboard',
    platforms: ['meta_ads', 'google_ads', 'ga4', 'shopify'],
    field_selections: {
      meta_ads: ['date', 'campaign_name', 'spend', 'impressions', 'clicks', 'conversions'],
      google_ads: ['date', 'campaign_name', 'cost', 'impressions', 'clicks', 'conversions'],
      ga4: ['date', 'sessions', 'users', 'page_views', 'transactions', 'revenue'],
      shopify: ['date', 'orders', 'total_sales', 'average_order_value'],
    },
    include_blended_data: true,
  },

  // Sample KPIs (matches actual kpis table schema)
  kpis: [
    {
      name: 'Total Ad Spend',
      category: 'revenue',
      reporting_frequency: 'weekly',
      target_value: '$50,000',
      current_value: 47500,
      metric: 'spend',
      format: 'currency',
    },
    {
      name: 'ROAS',
      category: 'efficiency',
      reporting_frequency: 'weekly',
      target_value: '4.0x',
      current_value: 3.8,
      metric: 'roas',
      format: 'decimal',
    },
    {
      name: 'Conversion Rate',
      category: 'conversion',
      reporting_frequency: 'daily',
      target_value: '3.5%',
      current_value: 3.2,
      metric: 'conversion_rate',
      format: 'percentage',
    },
  ],

  // Sample ETL processes (matches actual etl_processes table schema)
  etlProcesses: [
    {
      name: 'Meta Ads Daily Sync',
      orchestrator: 'manual',
      status: 'active',
      transform_description: 'Daily import of Meta Ads performance data',
      schedule: '0 6 * * *',
    },
    {
      name: 'Google Ads Daily Sync',
      orchestrator: 'manual',
      status: 'active',
      transform_description: 'Daily import of Google Ads performance data',
      schedule: '0 6 * * *',
    },
    {
      name: 'Revenue Blending Pipeline',
      orchestrator: 'custom',
      status: 'active',
      transform_description: 'Combines Shopify revenue with ad platform data',
      schedule: '0 8 * * *',
    },
  ],

  // Sample report (matches actual reports table schema)
  report: {
    name: 'Weekly Performance Report',
    type: 'performance',
    frequency: 'weekly',
    recipients: 'reports@acmemarketing.com',
    delivery_format: 'pdf',
    is_scheduled: true,
    visualization_config: {
      kpis: [
        { metric: 'spend', label: 'Ad Spend', format: 'currency' },
        { metric: 'roas', label: 'ROAS', format: 'decimal' },
        { metric: 'conversions', label: 'Conversions', format: 'number' },
      ],
      charts: [
        { type: 'line', metric: 'spend', label: 'Spend Trend' },
        { type: 'bar', metric: 'conversions', label: 'Conversions by Platform' },
      ],
    },
    schedule_config: {
      frequency: 'weekly',
      dayOfWeek: 1,
      time: '09:00',
      timezone: 'America/New_York',
    },
    date_range: 'last_7_days',
  },
};

// =============================================================================
// Supabase Client
// =============================================================================

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.\n' +
        'Run `supabase status` to get these values.'
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// =============================================================================
// Setup Functions
// =============================================================================

/**
 * Create or get existing demo user
 */
async function setupDemoUser(supabase) {
  console.log('Setting up demo user...');

  // Check if user already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find(
    (u) => u.email === CONFIG.user.email
  );

  if (existingUser) {
    console.log(`  Demo user already exists: ${CONFIG.user.email}`);

    // Ensure user profile exists
    await supabase.from('user_profiles').upsert({
      id: existingUser.id,
      display_name: CONFIG.user.displayName,
      is_admin: true,
    });

    return existingUser;
  }

  // Create new demo user
  const { data: newUser, error } = await supabase.auth.admin.createUser({
    email: CONFIG.user.email,
    password: CONFIG.user.password,
    email_confirm: true,
    user_metadata: {
      display_name: CONFIG.user.displayName,
    },
  });

  if (error) {
    throw new Error(`Failed to create demo user: ${error.message}`);
  }

  // Create user profile
  await supabase.from('user_profiles').insert({
    id: newUser.user.id,
    display_name: CONFIG.user.displayName,
    is_admin: true,
  });

  console.log(`  Created demo user: ${CONFIG.user.email}`);
  return newUser.user;
}

/**
 * Create demo client
 */
async function setupDemoClient(supabase) {
  console.log('Setting up demo client...');

  // Check if client already exists
  const { data: existingClients } = await supabase
    .from('clients')
    .select('*')
    .eq('name', CONFIG.client.name);

  if (existingClients?.length > 0) {
    console.log(`  Demo client already exists: ${CONFIG.client.name}`);
    return existingClients[0];
  }

  // Create new client with generated ID
  const clientId = generateId('c');
  const { data: newClient, error } = await supabase
    .from('clients')
    .insert({ id: clientId, ...CONFIG.client })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create demo client: ${error.message}`);
  }

  console.log(`  Created demo client: ${CONFIG.client.name} (${clientId})`);
  return newClient;
}

/**
 * Create data sources for client
 */
async function setupDataSources(supabase, clientId) {
  console.log('Setting up data sources...');

  for (const source of CONFIG.sources) {
    // Check if source already exists
    const { data: existing } = await supabase
      .from('data_sources')
      .select('*')
      .eq('client_id', clientId)
      .eq('name', source.name);

    if (existing?.length > 0) {
      console.log(`  Source already exists: ${source.name}`);
      continue;
    }

    // Create source with generated ID
    const sourceId = generateId('s');
    const { error } = await supabase.from('data_sources').insert({
      id: sourceId,
      ...source,
      client_id: clientId,
    });

    if (error) {
      console.error(`  Failed to create source ${source.name}: ${error.message}`);
    } else {
      console.log(`  Created source: ${source.name}`);
    }
  }
}

/**
 * Create warehouse for client
 */
async function setupWarehouse(supabase, clientId) {
  console.log('Setting up warehouse...');

  // Check if warehouse already exists
  const { data: existing } = await supabase
    .from('data_warehouses')
    .select('*')
    .eq('client_id', clientId)
    .eq('name', CONFIG.warehouse.name);

  if (existing?.length > 0) {
    console.log(`  Warehouse already exists: ${CONFIG.warehouse.name}`);
    return existing[0];
  }

  // Create warehouse with generated ID
  const warehouseId = generateId('wh');
  const { data: newWarehouse, error } = await supabase
    .from('data_warehouses')
    .insert({
      id: warehouseId,
      client_id: clientId,
      name: CONFIG.warehouse.name,
      platforms: CONFIG.warehouse.platforms,
      field_selections: CONFIG.warehouse.field_selections,
      include_blended_data: CONFIG.warehouse.include_blended_data,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create warehouse: ${error.message}`);
  }

  console.log(`  Created warehouse: ${CONFIG.warehouse.name}`);
  return newWarehouse;
}

/**
 * Create KPIs for client
 */
async function setupKPIs(supabase, clientId) {
  console.log('Setting up KPIs...');

  for (const kpi of CONFIG.kpis) {
    // Check if KPI already exists
    const { data: existing } = await supabase
      .from('kpis')
      .select('*')
      .eq('client_id', clientId)
      .eq('name', kpi.name);

    if (existing?.length > 0) {
      console.log(`  KPI already exists: ${kpi.name}`);
      continue;
    }

    // Create KPI with generated ID
    const kpiId = generateId('k');
    const { error } = await supabase.from('kpis').insert({
      id: kpiId,
      ...kpi,
      client_id: clientId,
    });

    if (error) {
      console.error(`  Failed to create KPI ${kpi.name}: ${error.message}`);
    } else {
      console.log(`  Created KPI: ${kpi.name}`);
    }
  }
}

/**
 * Create ETL processes for client
 */
async function setupETLProcesses(supabase, clientId) {
  console.log('Setting up ETL processes...');

  for (const etl of CONFIG.etlProcesses) {
    // Check if ETL already exists
    const { data: existing } = await supabase
      .from('etl_processes')
      .select('*')
      .eq('client_id', clientId)
      .eq('name', etl.name);

    if (existing?.length > 0) {
      console.log(`  ETL already exists: ${etl.name}`);
      continue;
    }

    // Create ETL with generated ID
    const etlId = generateId('e');
    const { error } = await supabase.from('etl_processes').insert({
      id: etlId,
      ...etl,
      client_id: clientId,
    });

    if (error) {
      console.error(`  Failed to create ETL ${etl.name}: ${error.message}`);
    } else {
      console.log(`  Created ETL: ${etl.name}`);
    }
  }
}

/**
 * Create report for client
 */
async function setupReport(supabase, clientId, warehouseId) {
  console.log('Setting up report...');

  // Check if report already exists
  const { data: existing } = await supabase
    .from('reports')
    .select('*')
    .eq('client_id', clientId)
    .eq('name', CONFIG.report.name);

  if (existing?.length > 0) {
    console.log(`  Report already exists: ${CONFIG.report.name}`);
    return existing[0];
  }

  // Create report with generated ID
  const reportId = generateId('r');
  const { data: newReport, error } = await supabase
    .from('reports')
    .insert({
      id: reportId,
      client_id: clientId,
      warehouse_id: warehouseId,
      ...CONFIG.report,
    })
    .select()
    .single();

  if (error) {
    console.error(`  Failed to create report: ${error.message}`);
    return null;
  }

  console.log(`  Created report: ${CONFIG.report.name}`);
  return newReport;
}

/**
 * Create data lineage connections
 */
async function setupDataLineage(supabase, clientId, sources, warehouseId, reportId) {
  console.log('Setting up data lineage...');

  // Source → Warehouse connections
  for (const source of sources) {
    const { data: existing } = await supabase
      .from('data_lineage')
      .select('*')
      .eq('client_id', clientId)
      .eq('source_type', 'data_source')
      .eq('source_id', source.id)
      .eq('destination_type', 'warehouse')
      .eq('destination_id', warehouseId);

    if (existing?.length > 0) {
      continue;
    }

    const lineageId = generateId('l');
    const { error } = await supabase.from('data_lineage').insert({
      id: lineageId,
      client_id: clientId,
      source_type: 'data_source',
      source_id: source.id,
      destination_type: 'warehouse',
      destination_id: warehouseId,
      transformation: 'ETL import',
    });

    if (error) {
      console.error(`  Failed to create lineage for ${source.name}: ${error.message}`);
    } else {
      console.log(`  Created lineage: ${source.name} → Warehouse`);
    }
  }

  // Warehouse → Report connection
  if (reportId) {
    const { data: existing } = await supabase
      .from('data_lineage')
      .select('*')
      .eq('client_id', clientId)
      .eq('source_type', 'warehouse')
      .eq('source_id', warehouseId)
      .eq('destination_type', 'report')
      .eq('destination_id', reportId);

    if (!existing?.length) {
      const lineageId = generateId('l');
      const { error } = await supabase.from('data_lineage').insert({
        id: lineageId,
        client_id: clientId,
        source_type: 'warehouse',
        source_id: warehouseId,
        destination_type: 'report',
        destination_id: reportId,
        transformation: 'Visualization',
      });

      if (error) {
        console.error(`  Failed to create lineage for report: ${error.message}`);
      } else {
        console.log(`  Created lineage: Warehouse → Report`);
      }
    }
  }
}

/**
 * Assign demo user to demo client
 */
async function assignUserToClient(supabase, userId, clientId) {
  console.log('Assigning user to client...');

  // Check if assignment already exists
  const { data: existing } = await supabase
    .from('user_client_assignments')
    .select('*')
    .eq('user_id', userId)
    .eq('client_id', clientId);

  if (existing?.length > 0) {
    console.log('  Assignment already exists');
    return;
  }

  // Create assignment
  const { error } = await supabase.from('user_client_assignments').insert({
    user_id: userId,
    client_id: clientId,
    role: 'admin',
  });

  if (error) {
    console.error(`  Failed to assign user: ${error.message}`);
  } else {
    console.log('  User assigned as admin');
  }
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  console.log('='.repeat(60));
  console.log('Data Hub Demo Data Setup');
  console.log('='.repeat(60));
  console.log('');

  try {
    const supabase = getSupabaseClient();

    // Setup in order
    const user = await setupDemoUser(supabase);
    const client = await setupDemoClient(supabase);
    await setupDataSources(supabase, client.id);
    const warehouse = await setupWarehouse(supabase, client.id);
    await setupKPIs(supabase, client.id);
    await setupETLProcesses(supabase, client.id);
    const report = await setupReport(supabase, client.id, warehouse?.id);

    // Get sources for lineage setup
    const { data: sources } = await supabase
      .from('data_sources')
      .select('id, name')
      .eq('client_id', client.id);

    if (warehouse && sources?.length > 0) {
      await setupDataLineage(supabase, client.id, sources, warehouse.id, report?.id);
    }

    await assignUserToClient(supabase, user.id, client.id);

    console.log('');
    console.log('='.repeat(60));
    console.log('Setup Complete!');
    console.log('='.repeat(60));
    console.log('');
    console.log('Demo Credentials:');
    console.log(`  Email:    ${CONFIG.user.email}`);
    console.log(`  Password: ${CONFIG.user.password}`);
    console.log('');
    console.log('Demo Data Created:');
    console.log(`  Client:     ${CONFIG.client.name}`);
    console.log(`  Sources:    ${CONFIG.sources.length} data sources`);
    console.log(`  KPIs:       ${CONFIG.kpis.length} KPIs`);
    console.log(`  ETL:        ${CONFIG.etlProcesses.length} processes`);
    console.log(`  Warehouse:  ${CONFIG.warehouse.name}`);
    console.log(`  Report:     ${CONFIG.report.name}`);
    console.log('');
    console.log('Now run: npm run video:record');
  } catch (error) {
    console.error('');
    console.error('Setup failed:', error.message);
    process.exit(1);
  }
}

main();
