# Service Layer Patterns

## Service Structure

```javascript
import { supabase } from './supabaseClient.js';
import { v4 as uuidv4 } from 'uuid';

class MyService {
  constructor() {
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    if (!supabase) {
      throw new Error('Supabase client not configured');
    }
    this.initialized = true;
  }

  // Methods...
}

export const myService = new MyService();
```

## Common Query Patterns

### Select All

```javascript
async getAll() {
  await this.init();

  const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(this.formatRow);
}
```

### Select by ID

```javascript
async getById(id) {
  await this.init();

  const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  return this.formatRow(data);
}
```

### Select by Parent ID

```javascript
async getByClientId(clientId) {
  await this.init();

  const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(this.formatRow);
}
```

### Insert

```javascript
async create(data) {
  await this.init();

  const { data: row, error } = await supabase
    .from('table_name')
    .insert({
      id: uuidv4(),
      field1: data.field1,
      field2: data.field2,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return this.formatRow(row);
}
```

### Update

```javascript
async update(id, updates) {
  await this.init();

  // Filter out undefined values
  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([_, v]) => v !== undefined)
  );

  const { data: row, error } = await supabase
    .from('table_name')
    .update({
      ...cleanUpdates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return this.formatRow(row);
}
```

### Delete

```javascript
async delete(id) {
  await this.init();

  const { error } = await supabase
    .from('table_name')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}
```

### Cascade Delete

```javascript
async deleteClient(clientId) {
  await this.init();

  // Delete related records first (in order of dependencies)
  await Promise.all([
    supabase.from('data_lineage').delete().eq('client_id', clientId),
    supabase.from('data_sources').delete().eq('client_id', clientId),
    supabase.from('etl_processes').delete().eq('client_id', clientId),
    supabase.from('kpis').delete().eq('client_id', clientId),
    supabase.from('reports').delete().eq('client_id', clientId),
  ]);

  // Then delete the parent
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', clientId);

  if (error) throw error;
  return true;
}
```

## Parallel Queries

```javascript
async getClientDetails(clientId) {
  await this.init();

  const [client, sources, etl, kpis] = await Promise.all([
    this.getById(clientId),
    this.getClientSources(clientId),
    this.getClientETL(clientId),
    this.getClientKPIs(clientId),
  ]);

  return { ...client, sources, etl, kpis };
}
```

## Aggregate Counts

```javascript
async getCountsByClientId(table, clientIds) {
  if (clientIds.length === 0) return {};

  const { data, error } = await supabase
    .from(table)
    .select('client_id')
    .in('client_id', clientIds);

  if (error) throw error;

  const counts = {};
  for (const row of data) {
    counts[row.client_id] = (counts[row.client_id] || 0) + 1;
  }
  return counts;
}
```

## Data Formatting

```javascript
formatRow(row) {
  return {
    id: row.id,
    name: row.name,
    // snake_case to camelCase
    clientId: row.client_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
```

## Error Handling

```javascript
// Supabase error codes
const SUPABASE_ERRORS = {
  PGRST116: 'Not found (single row expected)',
  23505: 'Unique constraint violation',
  23503: 'Foreign key violation',
};

// Handle in service
if (error) {
  if (error.code === 'PGRST116') return null;
  if (error.code === '23505') {
    throw new Error('Item already exists');
  }
  throw error;
}
```
