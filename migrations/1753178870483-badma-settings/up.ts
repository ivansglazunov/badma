import dotenv from 'dotenv';
import { Hasura, ColumnType } from 'hasyx/lib/hasura'; 
import Debug from '../../lib/debug';

const debug = Debug('migration:badma-settings:up');
dotenv.config();

const hasura = new Hasura({
  url: process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL!,
  secret: process.env.HASURA_ADMIN_SECRET!,
});

const badmaSchema = 'badma';
const publicSchema = 'public';

async function clearInconsistentMetadata(hasura: Hasura) {
  debug('🧹 Clearing inconsistent metadata...');
  try {
    await hasura.dropInconsistentMetadata();
    debug('✅ Inconsistent metadata cleared.');
  } catch (error) {
    debug('⚠️ Could not clear inconsistent metadata (may not exist):', error instanceof Error ? error.message : String(error));
  }
}

async function addReasonIdToItems(hasura: Hasura) {
  debug('🔧 Adding reason_id column to badma.items table...');
  
  await hasura.defineColumn({
    schema: badmaSchema,
    table: 'items',
    name: 'reason_id',
    type: ColumnType.UUID,
    postfix: 'NULL',
    comment: 'Опциональный ID причины предоставления предмета'
  });
  
  debug('✅ reason_id column added to badma.items table.');
}

async function createSettingsTable(hasura: Hasura) {
  debug('🔧 Creating badma.settings table...');
  
  await hasura.defineTable({ 
    schema: badmaSchema, 
    table: 'settings',
    id: 'id',
    type: ColumnType.UUID
  });
  
  // Define columns
  await hasura.defineColumn({
    schema: badmaSchema,
    table: 'settings',
    name: 'user_id',
    type: ColumnType.UUID,
    postfix: 'NOT NULL',
    comment: 'ID пользователя, чья настройка'
  });
  
  await hasura.defineColumn({
    schema: badmaSchema,
    table: 'settings',
    name: 'key',
    type: ColumnType.TEXT,
    postfix: 'NOT NULL CHECK (key IN (\'board\', \'pieces\'))',
    comment: 'Ключ настройки (board или pieces)'
  });
  
  await hasura.defineColumn({
    schema: badmaSchema,
    table: 'settings',
    name: 'value',
    type: ColumnType.TEXT,
    postfix: 'NOT NULL',
    comment: 'Значение настройки'
  });
  
  await hasura.defineColumn({
    schema: badmaSchema,
    table: 'settings',
    name: 'created_at',
    type: ColumnType.BIGINT,
    postfix: 'NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000',
    comment: 'Creation timestamp'
  });
  
  await hasura.defineColumn({
    schema: badmaSchema,
    table: 'settings',
    name: 'updated_at',
    type: ColumnType.BIGINT,
    postfix: 'NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000',
    comment: 'Update timestamp'
  });
  
  // Unique constraint will be created via SQL
  await hasura.sql(`
    ALTER TABLE ${badmaSchema}.settings 
    ADD CONSTRAINT settings_user_key_unique UNIQUE (user_id, key);
  `);
  
  // Create foreign key
  await hasura.defineForeignKey({
    from: { schema: badmaSchema, table: 'settings', column: 'user_id' },
    to: { schema: publicSchema, table: 'users', column: 'id' },
    on_delete: 'CASCADE',
    on_update: 'CASCADE'
  });
  
  debug('✅ Badma.settings table created successfully.');
}

async function createSettingsTriggers(hasura: Hasura) {
  debug('🔧 Creating settings triggers...');
  
  // Create trigger function for updating updated_at timestamp
  await hasura.defineFunction({
    schema: badmaSchema,
    name: 'update_settings_updated_at',
    definition: `()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = EXTRACT(EPOCH FROM NOW()) * 1000;
        RETURN NEW;
      END;
      $$`,
    language: 'plpgsql'
  });
  
  // Create trigger for updating updated_at on UPDATE
  await hasura.defineTrigger({
    schema: badmaSchema,
    table: 'settings',
    name: 'trigger_update_settings_updated_at',
    function_name: `${badmaSchema}.update_settings_updated_at`,
    timing: 'BEFORE',
    event: 'UPDATE'
  });
  
  debug('✅ Settings triggers created successfully.');
}

const tablesToTrack = [
  { schema: badmaSchema, name: 'settings' },
];

// Define relationships
const relationships = [
  // For settings
  {
    name: 'user',
    type: 'object' as const,
    using: { foreign_key_constraint_on: 'user_id' }
  }
];

// Define public schema relationships
const publicRelationships = [
  {
    table: 'users',
    name: 'settings',
    type: 'array' as const,
    using: { 
      foreign_key_constraint_on: { 
        table: { schema: badmaSchema, name: 'settings' }, 
        column: 'user_id'
      } 
    }
  }
];

// Define permissions for settings table
const settingsPermissions = [
  // Insert permission - user can only create settings for themselves with allowed keys
  {
    role: 'user',
    table: 'settings',
    type: 'insert',
    permission: {
      check: { user_id: { _eq: 'X-Hasura-User-Id' } },
      columns: ['user_id', 'key', 'value'],
      set: { user_id: 'X-Hasura-User-Id' }
    }
  },
  // Select permission - user can only read their own settings
  {
    role: 'user',
    table: 'settings',
    type: 'select',
    permission: {
      filter: { user_id: { _eq: 'X-Hasura-User-Id' } },
      columns: ['id', 'user_id', 'key', 'value', 'created_at', 'updated_at']
    }
  },
  // Update permission - user can only update value of their own settings
  {
    role: 'user',
    table: 'settings',
    type: 'update',
    permission: {
      filter: { user_id: { _eq: 'X-Hasura-User-Id' } },
      columns: ['value'],
      check: {}
    }
  }
  // No delete permission - settings cannot be deleted
];

async function main() {
  try {
    await clearInconsistentMetadata(hasura);
    
    // Add reason_id to items table
    await addReasonIdToItems(hasura);
    
    // Create settings table
    await createSettingsTable(hasura);
    await createSettingsTriggers(hasura);
    
    // Track tables
    for (const table of tablesToTrack) {
      debug(`📋 Tracking table ${table.schema}.${table.name}...`);
      await hasura.trackTable({ schema: table.schema, table: table.name });
    }
    
    // Create relationships for settings table
    for (const rel of relationships) {
      debug(`🔗 Creating relationship ${rel.name} for settings...`);
      await hasura.defineRelationship({
        schema: badmaSchema,
        table: 'settings',
        name: rel.name,
        type: rel.type,
        using: rel.using
      });
    }
    
    // Create public schema relationships
    for (const rel of publicRelationships) {
      debug(`🔗 Creating relationship ${rel.name} for ${rel.table}...`);
      await hasura.defineRelationship({
        schema: publicSchema,
        table: rel.table,
        name: rel.name,
        type: rel.type,
        using: rel.using
      });
    }
    
    // Set permissions for settings table
    for (const perm of settingsPermissions) {
      debug(`🔐 Setting ${perm.type} permission for role ${perm.role} on settings...`);
      await hasura.definePermission({
        schema: badmaSchema,
        table: perm.table,
        operation: perm.type as 'select' | 'insert' | 'update' | 'delete',
        role: perm.role,
        filter: perm.permission.filter || {},
        columns: perm.permission.columns,
        aggregate: false
      });
    }
    
    debug('🎉 Migration completed successfully!');
  } catch (error) {
    debug('❌ Migration failed:', error);
    throw error;
  }
}

main().catch(console.error);
