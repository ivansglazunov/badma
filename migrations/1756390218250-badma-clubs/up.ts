import dotenv from 'dotenv';
import { Hasura, ColumnType } from 'hasyx/lib/hasura/hasura'; 
import Debug from '../../lib/debug';

const debug = Debug('migration:1756390218250-badma-clubs:up');
dotenv.config();

const hasura = new Hasura({
  url: process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL!,
  secret: process.env.HASURA_ADMIN_SECRET!,
});

const badmaSchema = 'badma';

async function clearInconsistentMetadata(hasura: Hasura) {
  debug('🧹 Clearing inconsistent metadata...');
  try {
    await hasura.dropInconsistentMetadata();
    debug('✅ Inconsistent metadata cleared.');
  } catch (error) {
    debug('⚠️ Could not clear inconsistent metadata (may not exist):', error instanceof Error ? error.message : String(error));
  }
}

async function ensureSchema(hasura: Hasura) {
  debug('🔧 Ensuring badma schema...');
  await hasura.defineSchema({ schema: badmaSchema });
  debug('✅ badma schema ensured.');
}

async function createThinClubsTable(hasura: Hasura) {
  debug('🔧 Creating thin badma.clubs table...');

  await hasura.defineTable({ 
    schema: badmaSchema, 
    table: 'clubs',
    id: 'id',
    type: ColumnType.UUID
  });

  // Optional club display title for UI (can mirror groups.title)
  await hasura.defineColumn({
    schema: badmaSchema,
    table: 'clubs',
    name: 'title',
    type: ColumnType.TEXT,
    postfix: "NOT NULL DEFAULT ''",
    comment: 'Optional display title; primary source is groups.title'
  });

  // Link to groups — this is the source of truth for ownership and memberships
  await hasura.defineColumn({
    schema: badmaSchema,
    table: 'clubs',
    name: 'group_id',
    type: ColumnType.UUID,
    postfix: 'NOT NULL',
    comment: 'Reference to groups.id'
  });

  await hasura.defineForeignKey({
    from: { schema: badmaSchema, table: 'clubs', column: 'group_id' },
    to: { schema: 'public', table: 'groups', column: 'id' },
    on_delete: 'CASCADE',
    on_update: 'CASCADE'
  });

  debug('✅ Thin badma.clubs table created.');
}

async function trackTables(hasura: Hasura) {
  debug('🔍 Tracking thin club table...');
  try {
    await hasura.untrackTable({ schema: badmaSchema, table: 'clubs' });
  } catch {}
  await hasura.trackTable({ schema: badmaSchema, table: 'clubs' });
  debug('✅ badma.clubs tracked.');
}

async function createRelationships(hasura: Hasura) {
  debug('🔗 Creating relationships for badma.clubs...');
  // clubs -> group (manual relationship via group_id)
  try {
    await hasura.deleteRelationship({ schema: badmaSchema, table: 'clubs', name: 'group' });
  } catch {}
  await hasura.defineRelationship({
    schema: badmaSchema,
    table: 'clubs',
    name: 'group',
    type: 'object',
    using: { foreign_key_constraint_on: 'group_id' }
  });
  debug('✅ Relationships created.');
}

async function applyPermissions(hasura: Hasura) {
  debug('🔧 Applying minimal permissions for badma.clubs...');
  const permissions = [
    { role: 'anonymous', table: 'clubs', type: 'select', permission: { columns: true, filter: {} } },
    { role: 'user', table: 'clubs', type: 'select', permission: { columns: true, filter: {} } },
    // Insert/update/delete can be restricted or omitted; keeping none by default.
  ];

  for (const p of permissions) {
    try {
      await hasura.deletePermission({
        schema: badmaSchema,
        table: p.table,
        operation: p.type as 'select' | 'insert' | 'update' | 'delete',
        role: p.role,
      });
    } catch {}

    await hasura.definePermission({
      schema: badmaSchema,
      table: p.table,
      operation: p.type as 'select' | 'insert' | 'update' | 'delete',
      role: p.role,
      filter: p.permission.filter || {},
      columns: p.permission.columns ?? true,
      aggregate: false,
    });
  }
  debug('✅ Minimal permissions applied.');
}

async function up() {
  debug('🚀 Starting thin badma-clubs migration UP...');
  try {
    await clearInconsistentMetadata(hasura);
    await ensureSchema(hasura);
    await clearInconsistentMetadata(hasura);
    await createThinClubsTable(hasura);
    await clearInconsistentMetadata(hasura);
    await trackTables(hasura);
    await clearInconsistentMetadata(hasura);
    await createRelationships(hasura);
    await clearInconsistentMetadata(hasura);
    await applyPermissions(hasura);
    debug('✨ Thin badma-clubs migration UP completed successfully!');
  } catch (error) {
    debug('❗ Error during thin badma-clubs UP migration:', error instanceof Error ? error.message : String(error), error);
    process.exit(1);
  }
}

up();
