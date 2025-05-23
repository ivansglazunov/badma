import dotenv from 'dotenv';
import { Hasura } from 'hasyx'; 
import Debug from '../../lib/debug';

const debug = Debug('migration:tournaments:up');
dotenv.config();

const hasura = new Hasura({
  url: process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL!,
  secret: process.env.HASURA_ADMIN_SECRET!,
});

const badmaSchema = 'badma';
const publicSchema = 'public';

const sqlSchema = `
  CREATE SCHEMA IF NOT EXISTS ${badmaSchema};

  CREATE TABLE IF NOT EXISTS ${badmaSchema}.tournaments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      type TEXT NOT NULL DEFAULT 'round-robin',
      status TEXT NOT NULL DEFAULT 'await',
      created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
      updated_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
  );

  CREATE TABLE IF NOT EXISTS ${badmaSchema}.tournament_participants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES ${publicSchema}.users(id) ON DELETE CASCADE,
      tournament_id UUID NOT NULL REFERENCES ${badmaSchema}.tournaments(id) ON DELETE CASCADE,
      role INTEGER NOT NULL DEFAULT 1,
      created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
      updated_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
  );
  COMMENT ON COLUMN ${badmaSchema}.tournament_participants.role IS '1 for join, 0 for leave';

  CREATE TABLE IF NOT EXISTS ${badmaSchema}.tournament_games (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      game_id UUID NOT NULL REFERENCES ${badmaSchema}.games(id) ON DELETE CASCADE,
      tournament_id UUID NOT NULL REFERENCES ${badmaSchema}.tournaments(id) ON DELETE CASCADE,
      created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
      updated_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
      UNIQUE (game_id, tournament_id)
  );

  CREATE TABLE IF NOT EXISTS ${badmaSchema}.tournament_scores (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tournament_participant_id UUID NOT NULL REFERENCES ${badmaSchema}.tournament_participants(id) ON DELETE CASCADE,
      game_id UUID NOT NULL REFERENCES ${badmaSchema}.games(id) ON DELETE CASCADE,
      score DECIMAL(5,2) NOT NULL DEFAULT 0.0,
      created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
      updated_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
  );
`;

const tablesToTrack = [
  { schema: badmaSchema, name: 'tournaments' },
  { schema: badmaSchema, name: 'tournament_participants' },
  { schema: badmaSchema, name: 'tournament_games' },
  { schema: badmaSchema, name: 'tournament_scores' },
];

const relationships = [
  // For tournaments
  {
    type: 'pg_create_array_relationship',
    args: {
      source: 'default',
      table: { schema: badmaSchema, name: 'tournaments' },
      name: 'participants',
      using: { foreign_key_constraint_on: { table: { schema: badmaSchema, name: 'tournament_participants' }, column: 'tournament_id' } }
    }
  },
  {
    type: 'pg_create_array_relationship',
    args: {
      source: 'default',
      table: { schema: badmaSchema, name: 'tournaments' },
      name: 'tournament_games',
      using: { foreign_key_constraint_on: { table: { schema: badmaSchema, name: 'tournament_games' }, column: 'tournament_id' } }
    }
  },
  // For tournament_participants
  {
    type: 'pg_create_object_relationship',
    args: {
      source: 'default',
      table: { schema: badmaSchema, name: 'tournament_participants' },
      name: 'user',
      using: { foreign_key_constraint_on: 'user_id' }
    }
  },
  {
    type: 'pg_create_object_relationship',
    args: {
      source: 'default',
      table: { schema: badmaSchema, name: 'tournament_participants' },
      name: 'tournament',
      using: { foreign_key_constraint_on: 'tournament_id' }
    }
  },
  {
    type: 'pg_create_array_relationship',
    args: {
      source: 'default',
      table: { schema: badmaSchema, name: 'tournament_participants' },
      name: 'scores',
      using: { foreign_key_constraint_on: { table: { schema: badmaSchema, name: 'tournament_scores' }, column: 'tournament_participant_id' } }
    }
  },
  // For tournament_games
  {
    type: 'pg_create_object_relationship',
    args: {
      source: 'default',
      table: { schema: badmaSchema, name: 'tournament_games' },
      name: 'game',
      using: { foreign_key_constraint_on: 'game_id' }
    }
  },
  {
    type: 'pg_create_object_relationship',
    args: {
      source: 'default',
      table: { schema: badmaSchema, name: 'tournament_games' },
      name: 'tournament',
      using: { foreign_key_constraint_on: 'tournament_id' }
    }
  },
  // For tournament_scores
  {
    type: 'pg_create_object_relationship',
    args: {
      source: 'default',
      table: { schema: badmaSchema, name: 'tournament_scores' },
      name: 'tournament_participation',
      using: { foreign_key_constraint_on: 'tournament_participant_id' }
    }
  },
  {
    type: 'pg_create_object_relationship',
    args: {
      source: 'default',
      table: { schema: badmaSchema, name: 'tournament_scores' },
      name: 'game',
      using: { foreign_key_constraint_on: 'game_id' }
    }
  },
  // Relationship from games to tournament_games
  {
    type: 'pg_create_array_relationship',
    args: {
      source: 'default',
      table: { schema: badmaSchema, name: 'games' }, 
      name: 'tournament_games', 
      using: { foreign_key_constraint_on: { table: { schema: badmaSchema, name: 'tournament_games' }, column: 'game_id' } }
    }
  },
  // ADDED: Relationship from public.users to badma.tournament_participants
  {
    type: 'pg_create_array_relationship',
    args: {
      source: 'default',
      table: { schema: publicSchema, name: 'users' }, // Relationship is ON the 'users' table
      name: 'tournament_participations', // Name for the relationship
      using: { 
        foreign_key_constraint_on: { // How it's linked
          table: { schema: badmaSchema, name: 'tournament_participants' }, 
          column: 'user_id'
        } 
      }
    }
  }
];

const permissions = [
  // tournaments
  { role: 'admin', table: 'tournaments', types: ['select', 'insert', 'update', 'delete'], permission: { columns: '*', filter: {}, check: {} } },
  { role: 'user', table: 'tournaments', types: ['select'], permission: { columns: '*', filter: {} } },
  { role: 'anonymous', table: 'tournaments', types: ['select'], permission: { columns: '*', filter: {} } },
  // tournament_participants
  { role: 'admin', table: 'tournament_participants', types: ['select', 'insert', 'update', 'delete'], permission: { columns: '*', filter: {}, check: {} } },
  { role: 'user', table: 'tournament_participants', types: ['select'], permission: { columns: '*', filter: {} } },
  { role: 'anonymous', table: 'tournament_participants', types: ['select'], permission: { columns: '*', filter: {} } },
  // tournament_games
  { role: 'admin', table: 'tournament_games', types: ['select', 'insert', 'update', 'delete'], permission: { columns: '*', filter: {}, check: {} } },
  { role: 'user', table: 'tournament_games', types: ['select'], permission: { columns: '*', filter: {} } },
  { role: 'anonymous', table: 'tournament_games', types: ['select'], permission: { columns: '*', filter: {} } },
  // tournament_scores
  { role: 'admin', table: 'tournament_scores', types: ['select', 'insert', 'update', 'delete'], permission: { columns: '*', filter: {}, check: {} } },
  { role: 'user', table: 'tournament_scores', types: ['select'], permission: { columns: '*', filter: {} } },
  { role: 'anonymous', table: 'tournament_scores', types: ['select'], permission: { columns: '*', filter: {} } },
];

async function applySQLSchema() {
  debug('🔧 Applying SQL schema for tournaments...');
  await hasura.sql(sqlSchema, 'default', true);
  debug('✅ Tournaments SQL schema applied.');
}

async function trackTablesFunc() {
  debug('🔍 Tracking tournament tables...');
  for (const table of tablesToTrack) {
    debug(`  📝 Tracking table ${table.schema}.${table.name}...`);
    await hasura.v1({ type: 'pg_track_table', args: { source: 'default', schema: table.schema, name: table.name } });
  }
  debug('✅ Tournament table tracking complete.');
}

async function createRelationshipsFunc() {
  debug('🔗 Creating tournament relationships...');
  for (const relationship of relationships) {
     debug(`  📝 Creating relationship ${relationship.args.name} for table ${relationship.args.table.schema}.${relationship.args.table.name}...`);
     await hasura.v1(relationship);
  }
  debug('✅ Tournament relationships created.');
}

async function applyPermissionsFunc() {
  debug('🔧 Applying tournament permissions...');
  for (const p of permissions) {
    for (const type of p.types) {
      const action = `pg_create_${type}_permission`;
      debug(`     Applying ${type} for ${p.role}.${p.table}...`);
      await hasura.v1({
        type: action,
        args: {
          source: 'default',
          table: { schema: badmaSchema, name: p.table },
          role: p.role,
          permission: p.permission,
        }
      });
    }
  }
  debug('✅ Tournament permissions successfully applied.');
}

async function up() {
  debug('🚀 Starting Tournaments schema migration UP...');
  try {
    await applySQLSchema();
    await trackTablesFunc();
    await createRelationshipsFunc();
    await applyPermissionsFunc();
    debug('✨ Tournaments schema migration UP completed successfully!');
  } catch (error) {
    debug('❗ Critical error during Tournaments UP migration:', error instanceof Error ? error.message : String(error), error);
    debug('❌ Tournaments UP Migration failed.');
    process.exit(1);
  }
}

up(); 