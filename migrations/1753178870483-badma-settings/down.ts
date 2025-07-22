import dotenv from 'dotenv';
import { Hasura } from 'hasyx/lib/hasura'; 
import Debug from '../../lib/debug';

const debug = Debug('migration:badma-settings:down');
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

async function removeReasonIdFromItems(hasura: Hasura) {
  debug('🔧 Removing reason_id column from badma.items table...');
  
  try {
    await hasura.sql(`
      ALTER TABLE ${badmaSchema}.items 
      DROP COLUMN IF EXISTS reason_id;
    `);
    debug('✅ reason_id column removed from badma.items table.');
  } catch (error) {
    debug('⚠️ Could not remove reason_id column (may not exist):', error instanceof Error ? error.message : String(error));
  }
}

async function dropSettingsTable(hasura: Hasura) {
  debug('🔧 Dropping badma.settings table...');
  
  // Untrack table first
  try {
    await hasura.untrackTable({ schema: badmaSchema, table: 'settings' });
    debug('✅ Settings table untracked.');
  } catch (error) {
    debug('⚠️ Could not untrack settings table (may not be tracked):', error instanceof Error ? error.message : String(error));
  }
  
  // Drop triggers
  try {
    await hasura.sql(`
      DROP TRIGGER IF EXISTS trigger_update_settings_updated_at ON ${badmaSchema}.settings;
    `);
    debug('✅ Settings trigger dropped.');
  } catch (error) {
    debug('⚠️ Could not drop settings trigger (may not exist):', error instanceof Error ? error.message : String(error));
  }
  
  // Drop trigger function
  try {
    await hasura.sql(`
      DROP FUNCTION IF EXISTS ${badmaSchema}.update_settings_updated_at();
    `);
    debug('✅ Settings trigger function dropped.');
  } catch (error) {
    debug('⚠️ Could not drop settings trigger function (may not exist):', error instanceof Error ? error.message : String(error));
  }
  
  // Drop table
  try {
    await hasura.sql(`
      DROP TABLE IF EXISTS ${badmaSchema}.settings;
    `);
    debug('✅ Settings table dropped.');
  } catch (error) {
    debug('⚠️ Could not drop settings table (may not exist):', error instanceof Error ? error.message : String(error));
  }
  
  debug('✅ Badma.settings table dropped successfully.');
}

async function main() {
  try {
    await clearInconsistentMetadata(hasura);
    
    // Remove reason_id from items table
    await removeReasonIdFromItems(hasura);
    
    // Drop settings table
    await dropSettingsTable(hasura);
    
    debug('🎉 Migration rollback completed successfully!');
  } catch (error) {
    debug('❌ Migration rollback failed:', error);
    throw error;
  }
}

main().catch(console.error);
