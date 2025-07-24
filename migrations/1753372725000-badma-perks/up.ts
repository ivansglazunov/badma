import dotenv from 'dotenv';
import { Hasura, ColumnType } from 'hasyx/lib/hasura'; 
import Debug from '../../lib/debug';

const debug = Debug('migration:badma-perks:up');
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

async function createPerksTable(hasura: Hasura) {
  debug('🔧 Creating badma.perks table...');
  
  await hasura.defineTable({ 
    schema: badmaSchema, 
    table: 'perks',
    id: 'id',
    type: ColumnType.UUID
  });
  
  // Define columns using high-level methods
  await hasura.defineColumn({
    schema: badmaSchema,
    table: 'perks',
    name: 'type',
    type: ColumnType.TEXT,
    postfix: 'NOT NULL',
    comment: 'Type of perk (e.g., minefield, shield, etc.)'
  });
  
  await hasura.defineColumn({
    schema: badmaSchema,
    table: 'perks',
    name: 'game_id',
    type: ColumnType.UUID,
    postfix: 'NOT NULL',
    comment: 'ID of the game to which the perk was applied'
  });
  
  await hasura.defineColumn({
    schema: badmaSchema,
    table: 'perks',
    name: 'user_id',
    type: ColumnType.UUID,
    postfix: 'NOT NULL',
    comment: 'ID of the user who applied the perk'
  });
  
  await hasura.defineColumn({
    schema: badmaSchema,
    table: 'perks',
    name: 'data',
    type: ColumnType.JSONB,
    postfix: 'NOT NULL DEFAULT \'{}\'::jsonb',
    comment: 'Custom perk data (mine positions, settings, etc.)'
  });
  
  await hasura.defineColumn({
    schema: badmaSchema,
    table: 'perks',
    name: 'created_at',
    type: ColumnType.BIGINT,
    postfix: 'NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000',
    comment: 'Timestamp when the perk was applied'
  });
  
  await hasura.defineColumn({
    schema: badmaSchema,
    table: 'perks',
    name: 'applied_at',
    type: ColumnType.BIGINT,
    postfix: 'NULL',
    comment: 'Timestamp when the perk was activated in the game'
  });
  
  // Create foreign keys
  await hasura.defineForeignKey({
    from: { schema: badmaSchema, table: 'perks', column: 'game_id' },
    to: { schema: badmaSchema, table: 'games', column: 'id' },
    on_delete: 'CASCADE',
    on_update: 'CASCADE'
  });
  
  await hasura.defineForeignKey({
    from: { schema: badmaSchema, table: 'perks', column: 'user_id' },
    to: { schema: publicSchema, table: 'users', column: 'id' },
    on_delete: 'CASCADE',
    on_update: 'CASCADE'
  });
  
  // Create indexes for better performance
  await hasura.sql(`
    CREATE INDEX idx_badma_perks_game_id ON ${badmaSchema}.perks(game_id);
    CREATE INDEX idx_badma_perks_user_id ON ${badmaSchema}.perks(user_id);
    CREATE INDEX idx_badma_perks_type ON ${badmaSchema}.perks(type);
    CREATE INDEX idx_badma_perks_game_type ON ${badmaSchema}.perks(game_id, type);
  `);
  
  debug('✅ Badma.perks table created successfully.');
}

async function createPerksTriggers(hasura: Hasura) {
  debug('🔧 Creating perks triggers...');
  
  // Create trigger function for updating applied_at when perk is activated
  await hasura.sql(`
    CREATE OR REPLACE FUNCTION ${badmaSchema}.update_perk_applied_at()
    RETURNS TRIGGER AS $$
    BEGIN
      -- Update applied_at when data changes (indicating perk activation)
      IF OLD.data IS DISTINCT FROM NEW.data AND NEW.applied_at IS NULL THEN
        NEW.applied_at = EXTRACT(EPOCH FROM NOW()) * 1000;
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);
  
  // Create trigger
  await hasura.sql(`
    CREATE TRIGGER trigger_update_perk_applied_at
      BEFORE UPDATE ON ${badmaSchema}.perks
      FOR EACH ROW
      EXECUTE FUNCTION ${badmaSchema}.update_perk_applied_at();
  `);
  
  debug('✅ Perks triggers created successfully.');
}

const tablesToTrack = [
  { schema: badmaSchema, name: 'perks' },
];

const relationshipsToCreate = [
  {
    table: { schema: badmaSchema, name: 'perks' },
    name: 'game',
    type: 'object',
    definition: {
      manual_configuration: {
        remote_table: { schema: badmaSchema, name: 'games' },
        column_mapping: { game_id: 'id' }
      }
    }
  },
  {
    table: { schema: badmaSchema, name: 'perks' },
    name: 'user',
    type: 'object',
    definition: {
      manual_configuration: {
        remote_table: { schema: publicSchema, name: 'users' },
        column_mapping: { user_id: 'id' }
      }
    }
  },
  {
    table: { schema: badmaSchema, name: 'games' },
    name: 'perks',
    type: 'array',
    definition: {
      manual_configuration: {
        remote_table: { schema: badmaSchema, name: 'perks' },
        column_mapping: { id: 'game_id' }
      }
    }
  },
  {
    table: { schema: publicSchema, name: 'users' },
    name: 'perks',
    type: 'array',
    definition: {
      manual_configuration: {
        remote_table: { schema: badmaSchema, name: 'perks' },
        column_mapping: { id: 'user_id' }
      }
    }
  }
];

async function trackTablesFunc() {
  debug('🔧 Tracking tables...');
  
  for (const table of tablesToTrack) {
    debug(`Tracking table: ${table.schema}.${table.name}`);
    // Сначала untrack, потом track для идемпотентности
    try {
      await hasura.untrackTable({ schema: table.schema, table: table.name });
    } catch (error) {
      // Игнорируем ошибку, если таблица не tracked
    }
    await hasura.trackTable({ schema: table.schema, table: table.name });
  }
  
  debug('✅ All tables tracked successfully.');
}

async function createRelationshipsFunc() {
  debug('🔧 Creating relationships...');
  
  // Define relationships using the correct format
  const relationships = [
    {
      schema: badmaSchema,
      table: 'perks',
      name: 'game',
      type: 'object' as const,
      using: {
        foreign_key_constraint_on: 'game_id'
      }
    },
    {
      schema: badmaSchema,
      table: 'perks',
      name: 'user',
      type: 'object' as const,
      using: {
        foreign_key_constraint_on: 'user_id'
      }
    },
    {
      schema: badmaSchema,
      table: 'games',
      name: 'perks',
      type: 'array' as const,
      using: {
        foreign_key_constraint_on: {
          table: { schema: badmaSchema, name: 'perks' },
          column: 'game_id'
        }
      }
    },
    {
      schema: publicSchema,
      table: 'users',
      name: 'perks',
      type: 'array' as const,
      using: {
        foreign_key_constraint_on: {
          table: { schema: badmaSchema, name: 'perks' },
          column: 'user_id'
        }
      }
    }
  ];
  
  for (const rel of relationships) {
    debug(`Creating ${rel.type} relationship: ${rel.schema}.${rel.table}.${rel.name}`);
    
    // Сначала удаляем relationship, если существует
    try {
      await hasura.deleteRelationship({
        schema: rel.schema,
        table: rel.table,
        name: rel.name
      });
    } catch (error) {
      // Игнорируем ошибку, если relationship не существует
    }
    
    // Создаём новый relationship
    await hasura.defineRelationship({
      schema: rel.schema,
      table: rel.table,
      name: rel.name,
      type: rel.type,
      using: rel.using
    });
  }
  
  debug('✅ All relationships created successfully.');
}

async function applyPermissionsFunc() {
  debug('🔧 Applying permissions...');
  
  // Создаём новый permission
  await hasura.definePermission({
    schema: badmaSchema,
    table: 'perks',
    operation: 'select' as const,
    role: 'user',
    filter: {}, // Allow reading all perks
    columns: true,
  });

  await hasura.definePermission({
    schema: badmaSchema,
    table: 'perks',
    operation: 'select' as const,
    role: 'anonymous',
    filter: {}, // Allow reading all perks
    columns: true,
  });

  await hasura.definePermission({
    schema: badmaSchema,
    table: 'perks',
    operation: 'select' as const,
    role: 'me',
    filter: {}, // Allow reading all perks
    columns: true,
  });
  
  debug('✅ All permissions applied successfully.');
}

async function applyAggregationPermissionsFunc() {
  debug('🔧 Applying aggregation permissions...');
  
  // Allow aggregation queries for users
  const aggPermission = {
    schema: badmaSchema,
    table: 'perks',
    operation: 'select' as const,
    role: 'user',
    filter: {},
    columns: ['id', 'type', 'game_id', 'user_id', 'data', 'created_at', 'applied_at']
  };
  
  // Сначала удаляем aggregation permission, если существует
  try {
    await hasura.deletePermission({
      schema: aggPermission.schema,
      table: aggPermission.table,
      operation: aggPermission.operation,
      role: aggPermission.role
    });
  } catch (error) {
    // Игнорируем ошибку, если permission не существует
  }
  
  // Создаём новый aggregation permission
  await hasura.definePermission({
    schema: aggPermission.schema,
    table: aggPermission.table,
    operation: aggPermission.operation,
    role: aggPermission.role,
    filter: aggPermission.filter,
    columns: aggPermission.columns,
    aggregate: true // Enable aggregations
  });
  
  debug('✅ All aggregation permissions applied successfully.');
}

async function up() {
  debug('🚀 Starting badma-perks migration (up)...');
  
  await clearInconsistentMetadata(hasura);
  await createPerksTable(hasura);
  await createPerksTriggers(hasura);
  await trackTablesFunc();
  await createRelationshipsFunc();
  await applyPermissionsFunc();
  await applyAggregationPermissionsFunc();
  
  debug('✅ Migration badma-perks (up) completed successfully!');
}

up();
