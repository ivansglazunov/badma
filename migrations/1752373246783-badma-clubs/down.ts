import dotenv from 'dotenv';
import { Hasura } from 'hasyx';
import Debug from '../../lib/debug';

const debug = Debug('migration:badma-clubs:down');
dotenv.config();

const hasura = new Hasura({
  url: process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL!,
  secret: process.env.HASURA_ADMIN_SECRET!,
});

const badmaSchema = 'badma';

// Define permissions to drop (reverse of up.ts)
const permissionsToDrop = [
  // clubs
  { role: 'admin', table: 'clubs', types: ['select', 'insert', 'update', 'delete'] },
  { role: 'user', table: 'clubs', types: ['select', 'insert', 'update'] },
  { role: 'anonymous', table: 'clubs', types: ['select'] },
  // in_clubs
  { role: 'admin', table: 'in_clubs', types: ['select', 'insert', 'update', 'delete'] },
  { role: 'user', table: 'in_clubs', types: ['select', 'insert', 'update', 'delete'] },
  { role: 'anonymous', table: 'in_clubs', types: ['select'] },
];

// Define relationships to drop (reverse of up.ts)
const relationshipsToDrop = [
  // For in_clubs
  { table: 'in_clubs', name: 'created_by' },
  { table: 'in_clubs', name: 'user' },
  { table: 'in_clubs', name: 'club' },
  // For clubs
  { table: 'clubs', name: 'user' },
  { table: 'clubs', name: 'in_clubs' },
];

// Define relationships on public schema tables to drop
const publicRelationshipsToDrop = [
  { schema: 'public', table: 'users', name: 'in_clubs' },
  { schema: 'public', table: 'users', name: 'owned_clubs' },
  { schema: 'public', table: 'users', name: 'created_in_clubs' },
];

const tablesToUntrackAndDrop = [
  { schema: badmaSchema, name: 'in_clubs' },
  { schema: badmaSchema, name: 'clubs' },
];

const dropTablesSQL = `
  DROP TRIGGER IF EXISTS validate_in_clubs_status_update ON ${badmaSchema}.in_clubs;
  DROP FUNCTION IF EXISTS ${badmaSchema}.validate_status_update();
  DROP TABLE IF EXISTS ${badmaSchema}.in_clubs CASCADE;
  DROP TABLE IF EXISTS ${badmaSchema}.clubs CASCADE;
`;

async function dropPermissionsFunc() {
  debug('🔧 Dropping club permissions...');
  for (const p of permissionsToDrop) {
    for (const type of p.types) {
      const action = `pg_drop_${type}_permission`;
      debug(`     Dropping ${type} for ${p.role}.${p.table}...`);
      try {
        await hasura.v1({
          type: action,
          args: {
            source: 'default',
            table: { schema: badmaSchema, name: p.table },
            role: p.role,
          }
        });
      } catch (e: any) {
        // Log error but continue, as permission might not exist (idempotency)
        debug(`     Could not drop ${type} for ${p.role}.${p.table} (may not exist): ${e.message}`);
      }
    }
  }
  debug('✅ Club permissions dropped.');
}

async function dropRelationshipsFunc() {
  debug('🔗 Dropping club relationships...');
  
  // Drop relationships from badma schema tables
  for (const rel of relationshipsToDrop) {
     debug(`  🗑️ Dropping relationship ${rel.name} for table ${badmaSchema}.${rel.table}...`);
     try {
        await hasura.v1({
            type: 'pg_drop_relationship',
            args: {
                source: 'default',
                table: { schema: badmaSchema, name: rel.table },
                relationship: rel.name,
            }
        });
    } catch (e: any) {
        debug(`     Could not drop relationship ${rel.name} on ${rel.table} (may not exist): ${e.message}`);
    }
  }
  
  // Drop relationships from public schema tables
  for (const rel of publicRelationshipsToDrop) {
     debug(`  🗑️ Dropping relationship ${rel.name} for table ${rel.schema}.${rel.table}...`);
     try {
        await hasura.v1({
            type: 'pg_drop_relationship',
            args: {
                source: 'default',
                table: { schema: rel.schema, name: rel.table },
                relationship: rel.name,
            }
        });
    } catch (e: any) {
        debug(`     Could not drop relationship ${rel.name} on ${rel.schema}.${rel.table} (may not exist): ${e.message}`);
    }
  }
  
  debug('✅ Club relationships dropped.');
}

async function untrackTablesFunc() {
  debug('🔍 Untracking club tables...');
  for (const table of tablesToUntrackAndDrop) {
    debug(`  📝 Untracking table ${table.schema}.${table.name}...`);
    try {
        await hasura.v1({ 
            type: 'pg_untrack_table', 
            args: { source: 'default', table: { schema: table.schema, name: table.name }, cascade: true }
        });
    } catch (e: any) {
        debug(`     Could not untrack table ${table.schema}.${table.name} (may not exist or already untracked): ${e.message}`);
    }
  }
  debug('✅ Club table untracking complete.');
}

async function dropSQLSchema() {
  debug('🔧 Dropping SQL schema for clubs...');
  await hasura.sql(dropTablesSQL, 'default', true);
  debug('✅ Clubs SQL schema dropped.');
}

async function down() {
  debug('🚀 Starting Clubs schema migration DOWN...');
  try {
    // Order of operations is important: permissions, relationships, untrack, then drop tables
    await dropPermissionsFunc();
    await dropRelationshipsFunc();
    await untrackTablesFunc();
    await dropSQLSchema();
    debug('✨ Clubs schema migration DOWN completed successfully!');
  } catch (error) {
    debug('❗ Critical error during Clubs DOWN migration:', error instanceof Error ? error.message : String(error), error);
    debug('❌ Clubs DOWN Migration failed.');
    process.exit(1);
  }
}

down(); 