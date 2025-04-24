import dotenv from 'dotenv';
import path from 'path';
import { Hasura } from 'hasyx'; // Try importing from dist/index
import Debug from '../../lib/debug';

// Initialize debug
const debug = Debug('migration:down');

// Load environment variables from the root .env file
dotenv.config();

// Initialize Hasura client (validation happens inside constructor)
const hasura = new Hasura({
  url: process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL!, // Use non-null assertion
  secret: process.env.HASURA_ADMIN_SECRET!,
});

const badmaSchema = 'badma';
const publicSchema = 'public';
const badmaTables = ['servers', 'games', 'moves', 'joins', 'conflicts', 'ai'];

// Permissions to drop (matching those created in up.ts)
const userPermissionsToDrop = [
  { type: 'pg_drop_select_permission', args: { source: 'default', table: { schema: badmaSchema, name: 'servers' }, role: 'user' } },
  { type: 'pg_drop_select_permission', args: { source: 'default', table: { schema: badmaSchema, name: 'games' }, role: 'user' } },
  { type: 'pg_drop_select_permission', args: { source: 'default', table: { schema: badmaSchema, name: 'moves' }, role: 'user' } },
  { type: 'pg_drop_select_permission', args: { source: 'default', table: { schema: badmaSchema, name: 'joins' }, role: 'user' } },
  { type: 'pg_drop_select_permission', args: { source: 'default', table: { schema: badmaSchema, name: 'conflicts' }, role: 'user' } },
  { type: 'pg_drop_select_permission', args: { source: 'default', table: { schema: badmaSchema, name: 'ai' }, role: 'user' } },
];

const adminPermissionsAiToDrop = [
  { type: 'pg_drop_select_permission', args: { source: 'default', table: { schema: badmaSchema, name: 'ai' }, role: 'admin' } },
  { type: 'pg_drop_insert_permission', args: { source: 'default', table: { schema: badmaSchema, name: 'ai' }, role: 'admin' } },
  { type: 'pg_drop_delete_permission', args: { source: 'default', table: { schema: badmaSchema, name: 'ai' }, role: 'admin' } },
];

// Relationships to drop (based on up.ts and clean)
const relationshipsToDrop = [
  // Relationships between badma tables
  { type: 'pg_drop_relationship', args: { source: 'default', table: { schema: badmaSchema, name: 'moves' }, relationship: 'game' } },
  { type: 'pg_drop_relationship', args: { source: 'default', table: { schema: badmaSchema, name: 'games' }, relationship: 'moves' } },
  { type: 'pg_drop_relationship', args: { source: 'default', table: { schema: badmaSchema, name: 'games' }, relationship: 'joins' } },
  { type: 'pg_drop_relationship', args: { source: 'default', table: { schema: badmaSchema, name: 'joins' }, relationship: 'game' } },
  { type: 'pg_drop_relationship', args: { source: 'default', table: { schema: badmaSchema, name: 'conflicts' }, relationship: 'game' } },
  { type: 'pg_drop_relationship', args: { source: 'default', table: { schema: badmaSchema, name: 'games' }, relationship: 'conflicts' } },
  { type: 'pg_drop_relationship', args: { source: 'default', table: { schema: badmaSchema, name: 'ai' }, relationship: 'join' } },
  { type: 'pg_drop_relationship', args: { source: 'default', table: { schema: badmaSchema, name: 'joins' }, relationship: 'ai_bots' } },

  // Relationships involving public.users
  { type: 'pg_drop_relationship', args: { source: 'default', table: { schema: badmaSchema, name: 'games' }, relationship: 'user' } },
  { type: 'pg_drop_relationship', args: { source: 'default', table: { schema: publicSchema, name: 'users' }, relationship: 'games' } },
  { type: 'pg_drop_relationship', args: { source: 'default', table: { schema: badmaSchema, name: 'moves' }, relationship: 'user' } },
  { type: 'pg_drop_relationship', args: { source: 'default', table: { schema: publicSchema, name: 'users' }, relationship: 'moves' } },
  { type: 'pg_drop_relationship', args: { source: 'default', table: { schema: badmaSchema, name: 'joins' }, relationship: 'user' } },
  { type: 'pg_drop_relationship', args: { source: 'default', table: { schema: publicSchema, name: 'users' }, relationship: 'joins' } },
  { type: 'pg_drop_relationship', args: { source: 'default', table: { schema: badmaSchema, name: 'conflicts' }, relationship: 'user' } },
  { type: 'pg_drop_relationship', args: { source: 'default', table: { schema: publicSchema, name: 'users' }, relationship: 'conflicts' } },
];

// Tables to untrack
const tablesToUntrack = badmaTables.map(table => ({
  type: 'pg_untrack_table',
  args: { source: 'default', table: { schema: badmaSchema, name: table }, cascade: true }
}));

// SQL to drop tables and schema
const dropFunctionSQL = `
DROP FUNCTION IF EXISTS _set_storage_updated_at() CASCADE;
`;

const dropTablesSQL = `
  DROP TABLE IF EXISTS badma.ai CASCADE;
  DROP TABLE IF EXISTS badma.moves CASCADE;
  DROP TABLE IF EXISTS badma.joins CASCADE;
  DROP TABLE IF EXISTS badma.conflicts CASCADE;
  DROP TABLE IF EXISTS badma.games CASCADE;
  DROP TABLE IF EXISTS badma.servers CASCADE;
  DROP SCHEMA IF EXISTS badma CASCADE;
`;

async function dropMetadata() {
  debug('🧹 Dropping permissions, relationships, and untracking tables for badma schema...');

  debug('  🗑️ Dropping user permissions...');
  for (const dropRequest of userPermissionsToDrop) {
    const perm = `${dropRequest.args.role} on ${dropRequest.args.table.schema}.${dropRequest.args.table.name}`;
    debug(`     Dropping select permission for ${perm}...`);
    await hasura.v1(dropRequest);
    // Note: hasura.v1 handles 'not found' messages internally
  }
  debug('  ✅ User permissions dropped.');

  debug('  🗑️ Dropping admin permissions for badma.ai...');
  for (const dropRequest of adminPermissionsAiToDrop) {
    const perm = `${dropRequest.args.role} on ${dropRequest.args.table.schema}.${dropRequest.args.table.name}`;
    debug(`     Dropping permission for ${perm}...`);
    await hasura.v1(dropRequest);
  }
  debug('  ✅ Admin permissions for badma.ai dropped.');


  debug('  🗑️ Dropping relationships...');
  for (const dropRequest of relationshipsToDrop) {
    const rel = `${dropRequest.args.relationship} on ${dropRequest.args.table.schema}.${dropRequest.args.table.name}`;
    debug(`     Dropping relationship ${rel}...`);
    await hasura.v1(dropRequest);
    // Note: hasura.v1 handles 'not found' messages internally
  }
  debug('  ✅ Relationships dropped.');

  debug('  🗑️ Untracking tables...');
  for (const untrackRequest of tablesToUntrack) {
    const tableName = `${untrackRequest.args.table.schema}.${untrackRequest.args.table.name}`;
    debug(`     Untracking table ${tableName}...`);
    await hasura.v1(untrackRequest);
     // Note: hasura.v1 handles 'not found' messages internally
  }
  debug('✅ Tables untracked.');
}

async function dropTablesFunc() {
  debug('🧹 Dropping badma tables and schema...');
  debug('  🗑️ Dropping trigger function _set_storage_updated_at...');
  await hasura.sql(dropFunctionSQL);
  debug('  ✅ Trigger function dropped.');
  await hasura.sql(dropTablesSQL);
  debug('✅ Badma tables and schema dropped successfully.');
}

async function down() {
  debug('🚀 Starting Badma schema migration DOWN...');
  try {
    // Drop metadata first (permissions, relationships, tracking)
    await dropMetadata();

    // Then drop the tables and schema
    await dropTablesFunc();

    debug('✨ Badma schema migration DOWN completed successfully!');
  } catch (error) {
    console.error('❗ Critical error during Badma DOWN migration:', error);
    debug('❌ Badma DOWN Migration failed.');
    process.exit(1); // Exit with error code on failure
  }
}

// Run the migration
down();
