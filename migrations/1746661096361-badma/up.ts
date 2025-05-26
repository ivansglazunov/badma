import dotenv from 'dotenv';
import path from 'path';
import { Hasura } from 'hasyx'; // Import from installed package
import Debug from '../../lib/debug';

// Initialize debug
const debug = Debug('migration:up');

// Load environment variables from the root .env file
dotenv.config();

// Initialize Hasura client (validation happens inside constructor)
const hasura = new Hasura({
  url: process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL!, // Use non-null assertion
  secret: process.env.HASURA_ADMIN_SECRET!,
});

const badmaSchema = 'badma';
const publicSchema = 'public';

// --- SQL Schema Definition (from init-sql) ---
const triggerFunctionSQL = `
CREATE OR REPLACE FUNCTION _set_storage_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.storage_updated_at = EXTRACT(EPOCH FROM NOW()) * 1000; -- Use Unix timestamp (milliseconds)
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
`;

const sqlSchema = `
  -- Create schema if not exists
  CREATE SCHEMA IF NOT EXISTS ${badmaSchema};

  -- Servers table (mutable)
  CREATE TABLE IF NOT EXISTS ${badmaSchema}.servers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_address TEXT NOT NULL,
    global_address TEXT NOT NULL,
    created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
    active_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
  );

  -- Games table (immutable except fen)
  CREATE TABLE IF NOT EXISTS ${badmaSchema}.games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES ${publicSchema}.users(id) ON DELETE CASCADE,
    sides INTEGER NOT NULL DEFAULT 2,
    side INTEGER NOT NULL DEFAULT 1,
    mode TEXT NOT NULL DEFAULT 'classic',
    fen TEXT, -- Dynamically updated with each move
    status TEXT NOT NULL DEFAULT 'await',
    created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
    updated_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
    storage_inserted_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000, -- Changed to BIGINT
    storage_updated_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000, -- Changed to BIGINT
    CONSTRAINT side_within_sides CHECK (side <= sides),
    CONSTRAINT side_min_value CHECK (side >= 1)
  );

  -- Moves table (immutable)
  CREATE TABLE IF NOT EXISTS ${badmaSchema}.moves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "from" TEXT,
    "to" TEXT,
    promotion TEXT NULL,
    type TEXT,
    side INTEGER,
    user_id UUID NOT NULL REFERENCES ${publicSchema}.users(id) ON DELETE CASCADE,
    game_id UUID NOT NULL REFERENCES ${badmaSchema}.games(id) ON DELETE CASCADE,
    created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
  );

  -- Joins table (immutable)
  CREATE TABLE IF NOT EXISTS ${badmaSchema}.joins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES ${publicSchema}.users(id) ON DELETE CASCADE,
    game_id UUID NOT NULL REFERENCES ${badmaSchema}.games(id) ON DELETE CASCADE,
    side INTEGER NOT NULL,
    role INTEGER NOT NULL,
    client_id UUID NULL,
    created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
    -- Removed constraint side_valid_range as side can be 0 for spectator/observer
  );

  -- AIs table (user configurations for AI)
  CREATE TABLE IF NOT EXISTS ${badmaSchema}.ais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES ${publicSchema}.users(id) ON DELETE CASCADE,
    options JSONB NOT NULL DEFAULT '{"engine": "js-chess-engine", "level": 0}'::jsonb,
    created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
    updated_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
  );

  -- Errors table
  CREATE TABLE IF NOT EXISTS ${badmaSchema}.errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES ${publicSchema}.users(id) ON DELETE SET NULL,
    game_id UUID REFERENCES ${badmaSchema}.games(id) ON DELETE SET NULL,
    context TEXT,
    request_payload JSONB,
    response_payload JSONB,
    error_message TEXT,
    created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
  );

  -- <<< ADDED Trigger for badma.games storage_updated_at >>>
  DROP TRIGGER IF EXISTS set_storage_updated_at_trigger ON ${badmaSchema}.games;
  CREATE TRIGGER set_storage_updated_at_trigger
  BEFORE UPDATE ON ${badmaSchema}.games
  FOR EACH ROW
  EXECUTE FUNCTION _set_storage_updated_at();
`;

// --- Tables to Track (from init-sql) ---
const tablesToTrack = [
  { schema: badmaSchema, name: 'servers' },
  { schema: badmaSchema, name: 'games' },
  { schema: badmaSchema, name: 'moves' },
  { schema: badmaSchema, name: 'joins' },
  { schema: badmaSchema, name: 'ais' },
  { schema: badmaSchema, name: 'errors' }
];

// --- Relationships Definition (from init-gql) ---
const relationships = [
  // Relationships between badma tables
  {
    type: 'pg_create_object_relationship',
    args: {
      source: 'default',
      table: { schema: badmaSchema, name: 'moves' },
      name: 'game',
      using: { foreign_key_constraint_on: 'game_id' }
    }
  },
  {
    type: 'pg_create_array_relationship',
    args: {
      source: 'default',
      table: { schema: badmaSchema, name: 'games' },
      name: 'moves',
      using: { foreign_key_constraint_on: { table: { schema: badmaSchema, name: 'moves' }, column: 'game_id' } }
    }
  },
  {
    type: 'pg_create_object_relationship',
    args: {
      source: 'default',
      table: { schema: badmaSchema, name: 'joins' },
      name: 'game',
      using: { foreign_key_constraint_on: 'game_id' }
    }
  },
  {
    type: 'pg_create_array_relationship',
    args: {
      source: 'default',
      table: { schema: badmaSchema, name: 'games' },
      name: 'joins',
      using: { foreign_key_constraint_on: { table: { schema: badmaSchema, name: 'joins' }, column: 'game_id' } }
    }
  },
  // Relationships involving public.users
  {
    type: 'pg_create_object_relationship',
    args: {
      source: 'default',
      table: { schema: badmaSchema, name: 'games' },
      name: 'user',
      using: { foreign_key_constraint_on: 'user_id' }
    }
  },
  {
    type: 'pg_create_array_relationship',
    args: {
      source: 'default',
      table: { schema: publicSchema, name: 'users' },
      name: 'games',
      using: { foreign_key_constraint_on: { table: { schema: badmaSchema, name: 'games' }, column: 'user_id' } }
    }
  },
  {
    type: 'pg_create_object_relationship',
    args: {
      source: 'default',
      table: { schema: badmaSchema, name: 'moves' },
      name: 'user',
      using: { foreign_key_constraint_on: 'user_id' }
    }
  },
  {
    type: 'pg_create_array_relationship',
    args: {
      source: 'default',
      table: { schema: publicSchema, name: 'users' },
      name: 'moves',
      using: { foreign_key_constraint_on: { table: { schema: badmaSchema, name: 'moves' }, column: 'user_id' } }
    }
  },
  {
    type: 'pg_create_object_relationship',
    args: {
      source: 'default',
      table: { schema: badmaSchema, name: 'joins' },
      name: 'user',
      using: { foreign_key_constraint_on: 'user_id' }
    }
  },
  {
    type: 'pg_create_array_relationship',
    args: {
      source: 'default',
      table: { schema: publicSchema, name: 'users' },
      name: 'joins',
      using: { foreign_key_constraint_on: { table: { schema: badmaSchema, name: 'joins' }, column: 'user_id' } }
    }
  },
  {
    type: 'pg_create_object_relationship',
    args: {
      source: 'default',
      table: { schema: badmaSchema, name: 'ais' },
      name: 'user',
      using: { foreign_key_constraint_on: 'user_id' }
    }
  },
  {
    type: 'pg_create_array_relationship',
    args: {
      source: 'default',
      table: { schema: publicSchema, name: 'users' },
      name: 'ais',
      using: { foreign_key_constraint_on: { table: { schema: badmaSchema, name: 'ais' }, column: 'user_id' } }
    }
  },
  // Relationships for badma.errors
  {
    type: 'pg_create_object_relationship',
    args: {
      source: 'default',
      table: { schema: badmaSchema, name: 'errors' },
      name: 'user',
      using: { foreign_key_constraint_on: 'user_id' }
    }
  },
  {
    type: 'pg_create_object_relationship',
    args: {
      source: 'default',
      table: { schema: badmaSchema, name: 'errors' },
      name: 'game',
      using: { foreign_key_constraint_on: 'game_id' }
    }
  },
  {
    type: 'pg_create_array_relationship',
    args: {
      source: 'default',
      table: { schema: publicSchema, name: 'users' },
      name: 'errors',
      using: { foreign_key_constraint_on: { table: { schema: badmaSchema, name: 'errors' }, column: 'user_id' } }
    }
  },
  {
    type: 'pg_create_array_relationship',
    args: {
      source: 'default',
      table: { schema: badmaSchema, name: 'games' },
      name: 'errors',
      using: { foreign_key_constraint_on: { table: { schema: badmaSchema, name: 'errors' }, column: 'game_id' } }
    }
  }
];

// --- Permissions Definition (from init-gql) ---
// We only need select permissions for 'user' role on most tables
const userPermissions = [
  { table: 'servers', columns: ['id', 'local_address', 'global_address', 'created_at', 'active_at'] },
  { table: 'games', columns: ['id', 'user_id', 'sides', 'mode', 'side', 'fen', 'status', 'created_at'] },
  { table: 'moves', columns: ['id', 'from', 'to', 'promotion', 'type', 'side', 'user_id', 'game_id', 'created_at'] },
  { table: 'joins', columns: ['id', 'user_id', 'game_id', 'side', 'role', 'created_at'] },
].map(p => ({
  type: 'pg_create_select_permission',
  args: {
    source: 'default',
    table: { schema: badmaSchema, name: p.table },
    role: 'user',
    permission: {
      columns: p.columns,
      filter: {}
    }
  }
}));

// Anonymous permissions - allow reading all games, moves, and joins
const anonymousPermissions = [
  { table: 'games', columns: ['id', 'user_id', 'sides', 'mode', 'side', 'fen', 'status', 'created_at', 'updated_at'] },
  { table: 'moves', columns: ['id', 'from', 'to', 'promotion', 'type', 'side', 'user_id', 'game_id', 'created_at'] },
  { table: 'joins', columns: ['id', 'user_id', 'game_id', 'side', 'role', 'client_id', 'created_at'] },
].map(p => ({
  type: 'pg_create_select_permission',
  args: {
    source: 'default',
    table: { schema: badmaSchema, name: p.table },
    role: 'anonymous',
    permission: {
      columns: p.columns,
      filter: {}
    }
  }
}));

// Special permissions for 'ais' table
const aisUserPermissions = [
  {
    type: 'pg_create_select_permission',
    args: {
      source: 'default',
      table: { schema: badmaSchema, name: 'ais' },
      role: 'user',
      permission: {
        columns: ['id', 'user_id', 'options', 'created_at', 'updated_at'],
        filter: {
          user_id: { _eq: 'X-Hasura-User-Id' } // Users can only see their own AI configs
        }
      }
    }
  },
  {
    type: 'pg_create_insert_permission',
    args: {
      source: 'default',
      table: { schema: badmaSchema, name: 'ais' },
      role: 'user',
      permission: {
        check: {
          user_id: { _eq: 'X-Hasura-User-Id' } // Users can only add AI configs for themselves
        },
        columns: ['user_id', 'options']
      }
    }
  },
  {
    type: 'pg_create_update_permission',
    args: {
      source: 'default',
      table: { schema: badmaSchema, name: 'ais' },
      role: 'user',
      permission: {
        columns: ['options'],
        filter: {
          user_id: { _eq: 'X-Hasura-User-Id' } // Users can only update their own AI configs
        },
        check: {}
      }
    }
  },
  {
    type: 'pg_create_delete_permission',
    args: {
      source: 'default',
      table: { schema: badmaSchema, name: 'ais' },
      role: 'user',
      permission: {
        filter: {
          user_id: { _eq: 'X-Hasura-User-Id' } // Users can only delete their own AI configs
        }
      }
    }
  }
];

// Permissions for badma.errors table
const errorsPermissions = [
  {
    type: 'pg_create_select_permission',
    args: {
      source: 'default', table: { schema: badmaSchema, name: 'errors' }, role: 'admin',
      permission: { columns: '*', filter: {} }
    }
  },
  {
    type: 'pg_create_insert_permission',
    args: {
      source: 'default', table: { schema: badmaSchema, name: 'errors' }, role: 'admin',
      permission: { columns: ['user_id', 'game_id', 'context', 'request_payload', 'response_payload', 'error_message'], check: {} }
    }
  },
  {
    type: 'pg_create_update_permission',
    args: {
      source: 'default', table: { schema: badmaSchema, name: 'errors' }, role: 'admin',
      permission: { columns: ['context', 'request_payload', 'response_payload', 'error_message'], filter: {}, check: {} }
    }
  },
  {
    type: 'pg_create_delete_permission',
    args: {
      source: 'default', table: { schema: badmaSchema, name: 'errors' }, role: 'admin',
      permission: { filter: {} }
    }
  },
  {
    type: 'pg_create_select_permission',
    args: {
      source: 'default', table: { schema: badmaSchema, name: 'errors' }, role: 'user',
      permission: {
        columns: ['id', 'user_id', 'game_id', 'context', 'request_payload', 'response_payload', 'error_message', 'created_at'],
        filter: { user_id: { _eq: 'X-Hasura-User-Id' } }
      }
    }
  }
];

// --- Migration Functions ---

async function applySQLSchema() {
  debug('🔧 Applying SQL schema for badma...');
  debug('   Applying trigger function _set_storage_updated_at...');
  await hasura.sql(triggerFunctionSQL, 'default', true);
  debug('   Trigger function applied.');
  await hasura.sql(sqlSchema, 'default', true); // cascade = true
  debug('✅ Badma SQL schema applied.');
}

async function trackTablesFunc() {
  debug('🔍 Tracking badma tables...');
  for (const table of tablesToTrack) {
    debug(`  📝 Tracking table ${table.schema}.${table.name}...`);
    await hasura.v1({ type: 'pg_track_table', args: { source: 'default', schema: table.schema, name: table.name } });
    // Note: hasura.v1 handles 'already tracked' messages internally
  }
  debug('✅ Badma table tracking complete.');
}

async function createRelationshipsFunc() {
  debug('🔗 Creating badma relationships...');
  for (const relationship of relationships) {
     debug(`  📝 Creating relationship ${relationship.args.name} for table ${relationship.args.table.name}...`);
     await hasura.v1(relationship);
     // Note: hasura.v1 handles 'already exists' messages internally
  }
  debug('✅ Badma relationships created.');
}

async function applyPermissionsFunc() {
  debug('🔧 Applying badma permissions...');

  // Drop existing permissions first (idempotency)
  const allTables = tablesToTrack.map(t => t.name);
  const rolesToDrop = ['user', 'admin', 'anonymous'];

  for (const table of allTables) {
    for (const role of rolesToDrop) {
       await hasura.v1({ type: 'pg_drop_select_permission', args: { source: 'default', table: { schema: badmaSchema, name: table }, role: role } }).catch(()=>{});
       await hasura.v1({ type: 'pg_drop_insert_permission', args: { source: 'default', table: { schema: badmaSchema, name: table }, role: role } }).catch(()=>{});
       await hasura.v1({ type: 'pg_drop_update_permission', args: { source: 'default', table: { schema: badmaSchema, name: table }, role: role } }).catch(()=>{});
       await hasura.v1({ type: 'pg_drop_delete_permission', args: { source: 'default', table: { schema: badmaSchema, name: table }, role: role } }).catch(()=>{});
    }
  }
  debug('  🗑️ Dropped existing badma permissions (if any)...');

  // Apply user permissions
  debug('  📝 Applying user permissions...');
  for (const permission of userPermissions) {
    debug(`     Applying select for user.${permission.args.table.name}...`);
    await hasura.v1(permission);
  }
  
  // Apply anonymous permissions
  debug('  📝 Applying anonymous permissions...');
  for (const permission of anonymousPermissions) {
    debug(`     Applying select for anonymous.${permission.args.table.name}...`);
    await hasura.v1(permission);
  }
  
  // Apply ais permissions
  debug('  📝 Applying ais permissions...');
  for (const permission of aisUserPermissions) {
    debug(`     Applying ${permission.type.split('_').pop()} for user.ais...`);
    await hasura.v1(permission);
  }

  // Apply errors permissions
  debug('  📝 Applying errors permissions...');
  for (const permission of errorsPermissions) {
    const permType = permission.type.replace('pg_create_', '').replace('_permission', '');
    debug(`     Applying ${permType} for ${permission.args.role}.${permission.args.table.name}...`);
    await hasura.v1(permission);
  }

  debug('✅ Badma permissions successfully applied.');
}

async function applyAggregationPermissionsFunc() {
  debug('🔧 Applying badma aggregation permissions...');

  // Tables that should have aggregation permissions
  const tablesForAggregation = [
    'games', 'moves', 'joins', 'ais', 'errors', 'servers'
  ];

  // Update existing select permissions to include aggregations
  for (const tableName of tablesForAggregation) {
    // For user role - update existing permission to include aggregations
    try {
      await hasura.v1({
        type: 'pg_drop_select_permission',
        args: {
          source: 'default',
          table: { schema: badmaSchema, name: tableName },
          role: 'user'
        }
      });
    } catch (error) {
      // Permission might not exist, that's ok
    }

    // Recreate user permission with aggregations
    const userTableConfig = userPermissions.find(p => p.args.table.name === tableName);
    if (userTableConfig) {
      await hasura.v1({
        type: 'pg_create_select_permission',
        args: {
          source: 'default',
          table: { schema: badmaSchema, name: tableName },
          role: 'user',
          permission: {
            columns: userTableConfig.args.permission.columns,
            filter: userTableConfig.args.permission.filter,
            allow_aggregations: true
          }
        }
      });
      debug(`     Applied aggregation permission for user.${tableName}`);
    }

    // For anonymous role - update existing permission to include aggregations
    try {
      await hasura.v1({
        type: 'pg_drop_select_permission',
        args: {
          source: 'default',
          table: { schema: badmaSchema, name: tableName },
          role: 'anonymous'
        }
      });
    } catch (error) {
      // Permission might not exist, that's ok
    }

    // Recreate anonymous permission with aggregations
    const anonymousTableConfig = anonymousPermissions.find(p => p.args.table.name === tableName);
    if (anonymousTableConfig) {
      await hasura.v1({
        type: 'pg_create_select_permission',
        args: {
          source: 'default',
          table: { schema: badmaSchema, name: tableName },
          role: 'anonymous',
          permission: {
            columns: anonymousTableConfig.args.permission.columns,
            filter: anonymousTableConfig.args.permission.filter,
            allow_aggregations: true
          }
        }
      });
      debug(`     Applied aggregation permission for anonymous.${tableName}`);
    }

    // For admin role - create full permission with aggregations
    try {
      await hasura.v1({
        type: 'pg_drop_select_permission',
        args: {
          source: 'default',
          table: { schema: badmaSchema, name: tableName },
          role: 'admin'
        }
      });
    } catch (error) {
      // Permission might not exist, that's ok
    }

    await hasura.v1({
      type: 'pg_create_select_permission',
      args: {
        source: 'default',
        table: { schema: badmaSchema, name: tableName },
        role: 'admin',
        permission: {
          columns: '*',
          filter: {},
          allow_aggregations: true
        }
      }
    });
    debug(`     Applied aggregation permission for admin.${tableName}`);
  }

  debug('✅ Badma aggregation permissions successfully applied.');
}

async function up() {
  debug('🚀 Starting Badma schema migration UP...');
  try {
    await applySQLSchema();
    await trackTablesFunc();
    await createRelationshipsFunc();
    await applyPermissionsFunc(); // Apply GQL permissions after tables/relationships
    await applyAggregationPermissionsFunc();
    debug('✨ Badma schema migration UP completed successfully!');
  } catch (error) {
    // console.error('❗ Critical error during Badma UP migration:', error);
    debug('❗ Critical error during Badma UP migration:', error instanceof Error ? error.message : String(error), error);
    debug('❌ Badma UP Migration failed.');
    process.exit(1); // Exit with error code on failure
  }
}

// Run the migration
up(); 