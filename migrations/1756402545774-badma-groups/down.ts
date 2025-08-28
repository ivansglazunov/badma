import dotenv from 'dotenv';
import { Hasura } from 'hasyx';
import Debug from '../../lib/debug';

const debug = Debug('migration:1756402545774-badma-groups:down');
dotenv.config();

const hasura = new Hasura({
  url: process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL!,
  secret: process.env.HASURA_ADMIN_SECRET!,
});

const publicSchema = 'public';

async function down() {
  debug('🚀 Reverting badma-groups enforcement migration...');
  try {
    await hasura.sql(`
      DROP TRIGGER IF EXISTS memberships_after_insert_enforce_one_per_kind ON ${publicSchema}.memberships;
      DROP TRIGGER IF EXISTS memberships_after_update_enforce_one_per_kind ON ${publicSchema}.memberships;
      DROP FUNCTION IF EXISTS ${publicSchema}.memberships_enforce_one_per_kind();
    `, 'default', true);
    debug('✅ badma-groups DOWN completed.');
  } catch (error) {
    debug('❗ Error during badma-groups DOWN:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

down();
