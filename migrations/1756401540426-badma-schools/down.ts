import dotenv from 'dotenv';
import { Hasura } from 'hasyx';
import Debug from '../../lib/debug';

const debug = Debug('migration:1756401540426-badma-schools:down');
dotenv.config();

const hasura = new Hasura({
  url: process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL!,
  secret: process.env.HASURA_ADMIN_SECRET!,
});

const badmaSchema = 'badma';

async function down() {
  try {
    debug('🔗 Dropping relationships...');
    try { await hasura.v1({ type: 'pg_drop_relationship', args: { source: 'default', table: { schema: badmaSchema, name: 'schools' }, relationship: 'group' } }); } catch {}

    debug('🔍 Untracking table...');
    try { await hasura.v1({ type: 'pg_untrack_table', args: { source: 'default', table: { schema: badmaSchema, name: 'schools' }, cascade: true } }); } catch {}

    debug('🧱 Dropping SQL table...');
    await hasura.sql(`DROP TABLE IF EXISTS ${badmaSchema}.schools CASCADE;`, 'default', true);

    debug('✅ Schools DOWN completed.');
  } catch (error) {
    debug('❗ Error during schools DOWN:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

down();
