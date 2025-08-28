import dotenv from 'dotenv';
import { Hasura, ColumnType } from 'hasyx/lib/hasura/hasura'; 
import Debug from '../../lib/debug';

const debug = Debug('migration:1756401540426-badma-schools:up');
dotenv.config();

const hasura = new Hasura({
  url: process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL!,
  secret: process.env.HASURA_ADMIN_SECRET!,
});

const badmaSchema = 'badma';

async function clearInconsistentMetadata(hasura: Hasura) {
  try { await hasura.dropInconsistentMetadata(); } catch {}
}

async function ensureSchema(hasura: Hasura) {
  await hasura.defineSchema({ schema: badmaSchema });
}

async function createThinSchoolsTable(hasura: Hasura) {
  await hasura.defineTable({ schema: badmaSchema, table: 'schools', id: 'id', type: ColumnType.UUID });

  await hasura.defineColumn({
    schema: badmaSchema,
    table: 'schools',
    name: 'title',
    type: ColumnType.TEXT,
    postfix: "NOT NULL DEFAULT ''",
    comment: 'Optional display title; primary source is groups.title'
  });

  await hasura.defineColumn({
    schema: badmaSchema,
    table: 'schools',
    name: 'group_id',
    type: ColumnType.UUID,
    postfix: 'NOT NULL',
    comment: 'Reference to groups.id'
  });

  await hasura.defineForeignKey({
    from: { schema: badmaSchema, table: 'schools', column: 'group_id' },
    to: { schema: 'public', table: 'groups', column: 'id' },
    on_delete: 'CASCADE',
    on_update: 'CASCADE'
  });
}

async function trackAndRelate(hasura: Hasura) {
  try { await hasura.untrackTable({ schema: badmaSchema, table: 'schools' }); } catch {}
  await hasura.trackTable({ schema: badmaSchema, table: 'schools' });

  try { await hasura.deleteRelationship({ schema: badmaSchema, table: 'schools', name: 'group' }); } catch {}
  await hasura.defineRelationship({
    schema: badmaSchema,
    table: 'schools',
    name: 'group',
    type: 'object',
    using: { foreign_key_constraint_on: 'group_id' }
  });
}

async function applyPermissions(hasura: Hasura) {
  const permissions = [
    { role: 'anonymous', table: 'schools', type: 'select', permission: { columns: true, filter: {} } },
    { role: 'user', table: 'schools', type: 'select', permission: { columns: true, filter: {} } },
  ];
  for (const p of permissions) {
    try { await hasura.deletePermission({ schema: badmaSchema, table: p.table, operation: p.type as any, role: p.role }); } catch {}
    await hasura.definePermission({ schema: badmaSchema, table: p.table, operation: p.type as any, role: p.role, filter: p.permission.filter || {}, columns: p.permission.columns ?? true, aggregate: false });
  }
}

async function up() {
  try {
    await clearInconsistentMetadata(hasura);
    await ensureSchema(hasura);
    await clearInconsistentMetadata(hasura);
    await createThinSchoolsTable(hasura);
    await clearInconsistentMetadata(hasura);
    await trackAndRelate(hasura);
    await clearInconsistentMetadata(hasura);
    await applyPermissions(hasura);
  } catch (error) {
    Debug('migration:1756401540426-badma-schools:up')('Error:', error);
    process.exit(1);
  }
}

up();
