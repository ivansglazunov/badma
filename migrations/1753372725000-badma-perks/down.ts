import dotenv from 'dotenv';
import { Hasura } from 'hasyx/lib/hasura/hasura';
import Debug from '../../lib/debug';

const debug = Debug('migration:badma-perks:down');
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

async function dropPermissionsFunc() {
  debug('🔧 Dropping perks permissions...');
  
  const permissionsToDrop = [
    { role: 'user', table: 'perks', operation: 'select' },
  ];
  
  for (const perm of permissionsToDrop) {
    try {
      debug(`Dropping ${perm.operation} permission for ${perm.role} on ${perm.table}`);
      await hasura.deletePermission({
        schema: badmaSchema,
        table: perm.table,
        operation: perm.operation as any,
        role: perm.role
      });
    } catch (error) {
      debug(`⚠️ Could not drop ${perm.operation} permission for ${perm.role} on ${perm.table}:`, error instanceof Error ? error.message : String(error));
    }
  }
  
  debug('✅ Perks permissions dropped successfully.');
}

async function dropRelationshipsFunc() {
  debug('🔧 Dropping relationships...');
  
  const relationshipsToDrop = [
    { table: { schema: badmaSchema, name: 'perks' }, name: 'game' },
    { table: { schema: badmaSchema, name: 'perks' }, name: 'user' },
    { table: { schema: badmaSchema, name: 'games' }, name: 'perks' },
    { table: { schema: publicSchema, name: 'users' }, name: 'perks' },
  ];
  
  for (const rel of relationshipsToDrop) {
    try {
      debug(`Dropping relationship: ${rel.table.schema}.${rel.table.name}.${rel.name}`);
      await hasura.deleteRelationship({
        schema: rel.table.schema,
        table: rel.table.name,
        name: rel.name
      });
    } catch (error) {
      debug(`⚠️ Could not drop relationship ${rel.table.schema}.${rel.table.name}.${rel.name}:`, error instanceof Error ? error.message : String(error));
    }
  }
  
  debug('✅ Relationships dropped successfully.');
}

async function untrackTablesFunc() {
  debug('🔧 Untracking tables...');
  
  const tablesToUntrack = [
    { schema: badmaSchema, name: 'perks' },
  ];
  
  for (const table of tablesToUntrack) {
    try {
      debug(`Untracking table: ${table.schema}.${table.name}`);
      await hasura.untrackTable({ schema: table.schema, table: table.name });
    } catch (error) {
      debug(`⚠️ Could not untrack table ${table.schema}.${table.name}:`, error instanceof Error ? error.message : String(error));
    }
  }
  
  debug('✅ All tables untracked successfully.');
}

async function dropTriggersFunc() {
  debug('🔧 Dropping triggers...');
  
  try {
    await hasura.sql(`
      DROP TRIGGER IF EXISTS trigger_update_perk_applied_at ON ${badmaSchema}.perks;
    `);
    debug('✅ Trigger trigger_update_perk_applied_at dropped.');
  } catch (error) {
    debug('⚠️ Could not drop trigger trigger_update_perk_applied_at:', error instanceof Error ? error.message : String(error));
  }
  
  debug('✅ Triggers dropped successfully.');
}

async function dropFunctionsFunc() {
  debug('🔧 Dropping functions...');
  
  try {
    await hasura.sql(`
      DROP FUNCTION IF EXISTS ${badmaSchema}.update_perk_applied_at();
    `);
    debug('✅ Function update_perk_applied_at dropped.');
  } catch (error) {
    debug('⚠️ Could not drop function update_perk_applied_at:', error instanceof Error ? error.message : String(error));
  }
  
  debug('✅ Functions dropped successfully.');
}

async function dropForeignKeysFunc() {
  debug('🔧 Dropping foreign keys...');
  
  try {
    await hasura.sql(`
      ALTER TABLE ${badmaSchema}.perks DROP CONSTRAINT IF EXISTS perks_game_id_fkey;
      ALTER TABLE ${badmaSchema}.perks DROP CONSTRAINT IF EXISTS perks_user_id_fkey;
    `);
    debug('✅ Foreign keys dropped.');
  } catch (error) {
    debug('⚠️ Could not drop foreign keys:', error instanceof Error ? error.message : String(error));
  }
  
  debug('✅ Foreign keys dropped successfully.');
}

async function dropTableFunc() {
  debug('🔧 Dropping badma.perks table...');
  
  try {
    await hasura.sql(`
      DROP TABLE IF EXISTS ${badmaSchema}.perks CASCADE;
    `);
    debug('✅ Badma.perks table dropped.');
  } catch (error) {
    debug('⚠️ Could not drop badma.perks table:', error instanceof Error ? error.message : String(error));
  }
  
  debug('✅ Table dropped successfully.');
}

async function down() {
  debug('🚀 Starting badma-perks migration (down)...');
  
  await clearInconsistentMetadata(hasura);
  await dropPermissionsFunc();
  await dropRelationshipsFunc();
  await untrackTablesFunc();
  await dropTriggersFunc();
  await dropFunctionsFunc();
  await dropForeignKeysFunc();
  await dropTableFunc();
  
  debug('✅ Migration badma-perks (down) completed successfully!');
}

down();
