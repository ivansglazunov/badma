import dotenv from 'dotenv';
import { Hasura } from 'hasyx/lib/hasura/hasura';
import Debug from '../../lib/debug';

const debug = Debug('migration:badma-items:down');
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
  debug('🔧 Dropping items permissions...');
  
  const permissionsToDrop = [
    { role: 'admin', table: 'items', types: ['select', 'insert', 'update', 'delete'] },
    { role: 'user', table: 'items', types: ['select', 'insert', 'update'] },
    { role: 'anonymous', table: 'items', types: ['select'] },
  ];

  for (const p of permissionsToDrop) {
    for (const type of p.types) {
      debug(`     Dropping ${type} for ${p.role}.${p.table}...`);
      try {
        await hasura.deletePermission({
          schema: badmaSchema,
          table: p.table,
          operation: type as 'select' | 'insert' | 'update' | 'delete',
          role: p.role
        });
      } catch (e: any) {
        debug(`     Could not drop ${type} for ${p.role}.${p.table} (may not exist): ${e.message}`);
      }
    }
  }
  debug('✅ Items permissions dropped.');
}

async function dropRelationshipsFunc() {
  debug('🔗 Dropping items relationships...');
  
  // Drop relationships from badma schema tables
  const badmaRelationshipsToDrop = [
    { table: 'items', name: 'user' },
    { table: 'items', name: 'club' },
  ];
  
  for (const rel of badmaRelationshipsToDrop) {
    debug(`  🗑️ Dropping relationship ${rel.name} for table ${badmaSchema}.${rel.table}...`);
    try {
      await hasura.deleteRelationship({
        schema: badmaSchema,
        table: rel.table,
        name: rel.name
      });
    } catch (e: any) {
      debug(`     Could not drop relationship ${rel.name} on ${rel.table} (may not exist): ${e.message}`);
    }
  }
  
  // Drop relationships from public schema tables
  const publicRelationshipsToDrop = [
    { schema: 'public', table: 'users', name: 'items' },
  ];
  
  for (const rel of publicRelationshipsToDrop) {
    debug(`  🗑️ Dropping relationship ${rel.name} for table ${rel.schema}.${rel.table}...`);
    try {
      await hasura.deleteRelationship({
        schema: rel.schema,
        table: rel.table,
        name: rel.name
      });
    } catch (e: any) {
      debug(`     Could not drop relationship ${rel.name} on ${rel.schema}.${rel.table} (may not exist): ${e.message}`);
    }
  }
  
  // Drop relationships from clubs schema tables
  const clubsRelationshipsToDrop = [
    { schema: 'badma', table: 'clubs', name: 'items' },
  ];
  
  for (const rel of clubsRelationshipsToDrop) {
    debug(`  🗑️ Dropping relationship ${rel.name} for table ${rel.schema}.${rel.table}...`);
    try {
      await hasura.deleteRelationship({
        schema: rel.schema,
        table: rel.table,
        name: rel.name
      });
    } catch (e: any) {
      debug(`     Could not drop relationship ${rel.name} on ${rel.schema}.${rel.table} (may not exist): ${e.message}`);
    }
  }
  
  debug('✅ Items relationships dropped.');
}

async function untrackTablesFunc() {
  debug('🔍 Untracking items tables...');
  const tablesToUntrack = [
    { schema: badmaSchema, name: 'items' },
  ];
  
  for (const table of tablesToUntrack) {
    debug(`  📝 Untracking table ${table.schema}.${table.name}...`);
    try {
      await hasura.untrackTable({ schema: table.schema, table: table.name });
    } catch (e: any) {
      debug(`     Could not untrack table ${table.schema}.${table.name} (may not exist or already untracked): ${e.message}`);
    }
  }
  debug('✅ Items table untracking complete.');
}

async function dropTriggersFunc() {
  debug('🔧 Dropping items triggers...');
  
  const triggersToDrop = [
    { table: 'items', name: 'trigger_clear_user_id_on_club_assignment' },
    { table: 'items', name: 'trigger_set_accepted_at_on_accept' },
  ];
  
  for (const trigger of triggersToDrop) {
    debug(`  🗑️ Dropping trigger ${trigger.name} from ${badmaSchema}.${trigger.table}...`);
    try {
      await hasura.deleteTrigger({
        schema: badmaSchema,
        table: trigger.table,
        name: trigger.name
      });
    } catch (e: any) {
      debug(`     Could not drop trigger ${trigger.name} on ${trigger.table} (may not exist): ${e.message}`);
    }
  }
  
  debug('✅ Items triggers dropped.');
}

async function dropFunctionsFunc() {
  debug('🔧 Dropping items functions...');
  
  const functionsToDrop = [
    'clear_user_id_on_club_assignment',
    'set_accepted_at_on_accept',
  ];
  
  for (const funcName of functionsToDrop) {
    debug(`  🗑️ Dropping function ${funcName}...`);
    try {
      await hasura.deleteFunction({
        schema: badmaSchema,
        name: funcName
      });
    } catch (e: any) {
      debug(`     Could not drop function ${funcName} (may not exist): ${e.message}`);
    }
  }
  
  debug('✅ Items functions dropped.');
}

async function dropForeignKeysFunc() {
  debug('🔗 Dropping items foreign keys...');
  
  const foreignKeysToDrop = [
    { name: 'fk_items_user_id_users_id' },
    { name: 'fk_items_club_id_clubs_id' },
  ];
  
  for (const fk of foreignKeysToDrop) {
    debug(`  🗑️ Dropping foreign key ${fk.name}...`);
    try {
      await hasura.deleteForeignKey({
        schema: badmaSchema,
        table: 'items',
        name: fk.name
      });
    } catch (e: any) {
      debug(`     Could not drop foreign key ${fk.name} (may not exist): ${e.message}`);
    }
  }
  
  debug('✅ Items foreign keys dropped.');
}

async function dropTableFunc() {
  debug('🗑️ Dropping items table...');
  try {
    await hasura.deleteTable({
      schema: badmaSchema,
      table: 'items'
    });
    debug('✅ Items table dropped.');
  } catch (e: any) {
    debug(`     Could not drop table items (may not exist): ${e.message}`);
  }
}

async function down() {
  debug('🚀 Starting Items schema migration DOWN...');
  try {
    // Очищаем metadata в самом начале
    await clearInconsistentMetadata(hasura);
    
    await dropPermissionsFunc();
    await clearInconsistentMetadata(hasura);
    await dropRelationshipsFunc();
    await clearInconsistentMetadata(hasura);
    await untrackTablesFunc();
    await clearInconsistentMetadata(hasura);
    await dropTriggersFunc();
    await clearInconsistentMetadata(hasura);
    await dropFunctionsFunc();
    await clearInconsistentMetadata(hasura);
    await dropForeignKeysFunc();
    await clearInconsistentMetadata(hasura);
    await dropTableFunc();
    debug('✨ Items schema migration DOWN completed successfully!');
  } catch (error) {
    debug('❗ Critical error during Items DOWN migration:', error instanceof Error ? error.message : String(error), error);
    debug('❌ Items DOWN Migration failed.');
    process.exit(1);
  }
}

down(); 