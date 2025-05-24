import dotenv from 'dotenv';
import { Hasura } from 'hasyx';
import Debug from '../../lib/debug';

const debug = Debug('migration:tournaments:down');
dotenv.config();

const hasura = new Hasura({
  url: process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL!,
  secret: process.env.HASURA_ADMIN_SECRET!,
});

const badmaSchema = 'badma';

// Define permissions to drop (reverse of up.ts)
const permissionsToDrop = [
  // tournaments
  { role: 'admin', table: 'tournaments', types: ['select', 'insert', 'update', 'delete'] },
  { role: 'user', table: 'tournaments', types: ['select', 'insert', 'update'] },
  { role: 'anonymous', table: 'tournaments', types: ['select'] },
  // tournament_participants
  { role: 'admin', table: 'tournament_participants', types: ['select', 'insert', 'update', 'delete'] },
  { role: 'user', table: 'tournament_participants', types: ['select'] },
  { role: 'anonymous', table: 'tournament_participants', types: ['select'] },
  // tournament_games
  { role: 'admin', table: 'tournament_games', types: ['select', 'insert', 'update', 'delete'] },
  { role: 'user', table: 'tournament_games', types: ['select'] },
  { role: 'anonymous', table: 'tournament_games', types: ['select'] },
  // tournament_scores
  { role: 'admin', table: 'tournament_scores', types: ['select', 'insert', 'update', 'delete'] },
  { role: 'user', table: 'tournament_scores', types: ['select'] },
  { role: 'anonymous', table: 'tournament_scores', types: ['select'] },
];

// Define relationships to drop (reverse of up.ts)
const relationshipsToDrop = [
  // For tournament_scores
  { table: 'tournament_scores', name: 'game' },
  { table: 'tournament_scores', name: 'tournament_participation' },
  // For tournament_games
  { table: 'tournament_games', name: 'tournament' },
  { table: 'tournament_games', name: 'game' },
  // For tournament_participants
  { table: 'tournament_participants', name: 'scores' },
  { table: 'tournament_participants', name: 'tournament' },
  { table: 'tournament_participants', name: 'user' },
  // For tournaments
  { table: 'tournaments', name: 'user' },
  { table: 'tournaments', name: 'tournament_games' },
  { table: 'tournaments', name: 'participants' },
  // For games (NEW)
  { table: 'games', name: 'tournament_games' },
];

// Define relationships on public schema tables to drop
const publicRelationshipsToDrop = [
  { schema: 'public', table: 'users', name: 'tournament_participations' },
  { schema: 'public', table: 'users', name: 'tournaments' },
];

const tablesToUntrackAndDrop = [
  { schema: badmaSchema, name: 'tournament_scores' },
  { schema: badmaSchema, name: 'tournament_games' },
  { schema: badmaSchema, name: 'tournament_participants' },
  { schema: badmaSchema, name: 'tournaments' },
];

const dropTablesSQL = `
  DROP TABLE IF EXISTS ${badmaSchema}.tournament_scores CASCADE;
  DROP TABLE IF EXISTS ${badmaSchema}.tournament_games CASCADE;
  DROP TABLE IF EXISTS ${badmaSchema}.tournament_participants CASCADE;
  DROP TABLE IF EXISTS ${badmaSchema}.tournaments CASCADE;
`;

async function dropPermissionsFunc() {
  debug('🔧 Dropping tournament permissions...');
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
  debug('✅ Tournament permissions dropped.');
}

async function dropRelationshipsFunc() {
  debug('🔗 Dropping tournament relationships...');
  
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
  
  debug('✅ Tournament relationships dropped.');
}

async function untrackTablesFunc() {
  debug('🔍 Untracking tournament tables...');
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
  debug('✅ Tournament table untracking complete.');
}

async function dropSQLSchema() {
  debug('🔧 Dropping SQL schema for tournaments...');
  await hasura.sql(dropTablesSQL, 'default', true);
  debug('✅ Tournaments SQL schema dropped.');
}

async function down() {
  debug('🚀 Starting Tournaments schema migration DOWN...');
  try {
    // Order of operations is important: permissions, relationships, untrack, then drop tables
    await dropPermissionsFunc();
    await dropRelationshipsFunc();
    await untrackTablesFunc();
    await dropSQLSchema();
    debug('✨ Tournaments schema migration DOWN completed successfully!');
  } catch (error) {
    debug('❗ Critical error during Tournaments DOWN migration:', error instanceof Error ? error.message : String(error), error);
    debug('❌ Tournaments DOWN Migration failed.');
    process.exit(1);
  }
}

down(); 