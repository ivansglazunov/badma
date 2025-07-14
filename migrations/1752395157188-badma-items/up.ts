import dotenv from 'dotenv';
import { Hasura, ColumnType } from 'hasyx/lib/hasura'; 
import Debug from '../../lib/debug';

const debug = Debug('migration:badma-items:up');
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

async function createItemsTable(hasura: Hasura) {
  debug('🔧 Creating badma.items table...');
  
  await hasura.defineTable({ 
    schema: badmaSchema, 
    table: 'items',
    id: 'id',
    type: ColumnType.UUID
  });
  
  // Define columns using high-level methods
  await hasura.defineColumn({
    schema: badmaSchema,
    table: 'items',
    name: 'type',
    type: ColumnType.TEXT,
    postfix: 'NOT NULL',
    comment: 'Кодовое уникальное обозначение сущности'
  });
  
  await hasura.defineColumn({
    schema: badmaSchema,
    table: 'items',
    name: 'created_at',
    type: ColumnType.BIGINT,
    postfix: 'NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000',
    comment: 'Creation timestamp'
  });
  
  await hasura.defineColumn({
    schema: badmaSchema,
    table: 'items',
    name: 'user_id',
    type: ColumnType.UUID,
    postfix: 'NOT NULL',
    comment: 'Владелец предмета'
  });
  
  await hasura.defineColumn({
    schema: badmaSchema,
    table: 'items',
    name: 'club_id',
    type: ColumnType.UUID,
    postfix: 'NULL',
    comment: 'Владелец может передать права владения клубу'
  });
  
  await hasura.defineColumn({
    schema: badmaSchema,
    table: 'items',
    name: 'accepted',
    type: ColumnType.BOOLEAN,
    postfix: 'NOT NULL DEFAULT false',
    comment: 'Принят ли предмет пользователем'
  });
  
  await hasura.defineColumn({
    schema: badmaSchema,
    table: 'items',
    name: 'accepted_at',
    type: ColumnType.BIGINT,
    postfix: 'NULL',
    comment: 'Timestamp когда предмет был принят'
  });
  
  // Create foreign keys
  await hasura.defineForeignKey({
    from: { schema: badmaSchema, table: 'items', column: 'user_id' },
    to: { schema: publicSchema, table: 'users', column: 'id' },
    on_delete: 'CASCADE',
    on_update: 'CASCADE'
  });
  
  await hasura.defineForeignKey({
    from: { schema: badmaSchema, table: 'items', column: 'club_id' },
    to: { schema: badmaSchema, table: 'clubs', column: 'id' },
    on_delete: 'SET NULL',
    on_update: 'CASCADE'
  });
  
  debug('✅ Badma.items table created successfully.');
}

async function createItemsTriggers(hasura: Hasura) {
  debug('🔧 Creating items triggers...');
  
  // Create trigger function for clearing user_id when club_id is set
  await hasura.defineFunction({
    schema: badmaSchema,
    name: 'clear_user_id_on_club_assignment',
    definition: `()
      RETURNS TRIGGER AS $$
      BEGIN
        -- If club_id is being set and user_id is not null, clear user_id
        IF NEW.club_id IS NOT NULL AND NEW.user_id IS NOT NULL THEN
          NEW.user_id = NULL;
        END IF;
        RETURN NEW;
      END;
      $$`,
    language: 'plpgsql'
  });
  
  // Create trigger for clearing user_id when club_id is set
  await hasura.defineTrigger({
    schema: badmaSchema,
    table: 'items',
    name: 'trigger_clear_user_id_on_club_assignment',
    function_name: `${badmaSchema}.clear_user_id_on_club_assignment`,
    timing: 'BEFORE',
    event: 'UPDATE'
  });
  
  // Create trigger function for setting accepted_at when accepted becomes true
  await hasura.defineFunction({
    schema: badmaSchema,
    name: 'set_accepted_at_on_accept',
    definition: `()
      RETURNS TRIGGER AS $$
      BEGIN
        -- If accepted is being set to true and accepted_at is null, set accepted_at
        IF NEW.accepted = true AND NEW.accepted_at IS NULL THEN
          NEW.accepted_at = EXTRACT(EPOCH FROM NOW()) * 1000;
        END IF;
        RETURN NEW;
      END;
      $$`,
    language: 'plpgsql'
  });
  
  // Create trigger for setting accepted_at when accepted becomes true
  await hasura.defineTrigger({
    schema: badmaSchema,
    table: 'items',
    name: 'trigger_set_accepted_at_on_accept',
    function_name: `${badmaSchema}.set_accepted_at_on_accept`,
    timing: 'BEFORE',
    event: 'UPDATE'
  });
  
  debug('✅ Items triggers created successfully.');
}

const tablesToTrack = [
  { schema: badmaSchema, name: 'items' },
];

// Define relationships using defineRelationship method
const relationships = [
  // For items
  {
    name: 'user',
    type: 'object' as const,
    using: { foreign_key_constraint_on: 'user_id' }
  },
  {
    name: 'club',
    type: 'object' as const,
    using: { foreign_key_constraint_on: 'club_id' }
  }
];

// Define public schema relationships
const publicRelationships = [
  {
    table: 'users',
    name: 'items',
    type: 'array' as const,
    using: { 
      foreign_key_constraint_on: { 
        table: { schema: badmaSchema, name: 'items' }, 
        column: 'user_id'
      } 
    }
  }
];

// Define clubs schema relationships
const clubsRelationships = [
  {
    table: 'clubs',
    name: 'items',
    type: 'array' as const,
    using: { 
      foreign_key_constraint_on: { 
        table: { schema: badmaSchema, name: 'items' }, 
        column: 'club_id'
      } 
    }
  }
];

const permissions = [
  // items - admin
  { role: 'admin', table: 'items', type: 'select', permission: { columns: ['*'], filter: {} } },
  { role: 'admin', table: 'items', type: 'insert', permission: { columns: ['*'], check: {} } },
  { role: 'admin', table: 'items', type: 'update', permission: { columns: ['*'], filter: {}, check: {} } },
  { role: 'admin', table: 'items', type: 'delete', permission: { filter: {} } },
  // items - user
  { role: 'user', table: 'items', type: 'select', permission: { columns: ['*'], filter: {} } },
  { role: 'user', table: 'items', type: 'insert', permission: { 
    columns: ['type', 'user_id'], 
    check: { user_id: { _eq: 'X-Hasura-User-Id' } } 
  } },
  { role: 'user', table: 'items', type: 'update', permission: { 
    columns: ['accepted', 'club_id'], 
    filter: { 
      _or: [
        { user_id: { _eq: 'X-Hasura-User-Id' } },
        {
          club_id: { _is_null: false },
          user_id: { _eq: 'X-Hasura-User-Id' }
        }
      ]
    },
    check: { 
      _or: [
        { user_id: { _eq: 'X-Hasura-User-Id' } },
        {
          club_id: { _is_null: false },
          user_id: { _eq: 'X-Hasura-User-Id' }
        }
      ]
    }
  } },
  // items - anonymous
  { role: 'anonymous', table: 'items', type: 'select', permission: { columns: ['*'], filter: {} } },
];

async function trackTablesFunc() {
  debug('🔍 Tracking items tables...');
  for (const table of tablesToTrack) {
    debug(`  📝 Tracking table ${table.schema}.${table.name}...`);
    // Сначала untrack, потом track для идемпотентности
    try {
      await hasura.untrackTable({ schema: table.schema, table: table.name });
    } catch (error) {
      // Игнорируем ошибку, если таблица не tracked
    }
    await hasura.trackTable({ schema: table.schema, table: table.name });
  }
  debug('✅ Items table tracking complete.');
}

async function createRelationshipsFunc() {
  debug('🔗 Creating items relationships...');
  
  // Create relationships for badma schema tables
  for (const table of tablesToTrack) {
    const tableRelationships = relationships.filter(rel => 
      rel.name === 'user' || rel.name === 'club'
    );
    
    for (const relationship of tableRelationships) {
      debug(`  📝 Creating relationship ${relationship.name} for table ${table.schema}.${table.name}...`);
      
      // Сначала удаляем relationship, если существует
      try {
        await hasura.deleteRelationship({
          schema: table.schema,
          table: table.name,
          name: relationship.name
        });
      } catch (error) {
        // Игнорируем ошибку, если relationship не существует
      }
      
      // Создаём новый relationship
      await hasura.defineRelationship({
        schema: table.schema,
        table: table.name,
        name: relationship.name,
        type: relationship.type,
        using: relationship.using
      });
    }
  }
  
  // Create relationships for public schema tables
  for (const relationship of publicRelationships) {
    debug(`  📝 Creating relationship ${relationship.name} for table ${publicSchema}.${relationship.table}...`);
    
    // Сначала удаляем relationship, если существует
    try {
      await hasura.deleteRelationship({
        schema: publicSchema,
        table: relationship.table,
        name: relationship.name
      });
    } catch (error) {
      // Игнорируем ошибку, если relationship не существует
    }
    
    // Создаём новый relationship
    await hasura.defineRelationship({
      schema: publicSchema,
      table: relationship.table,
      name: relationship.name,
      type: relationship.type,
      using: relationship.using
    });
  }
  
  // Create relationships for clubs schema tables
  for (const relationship of clubsRelationships) {
    debug(`  📝 Creating relationship ${relationship.name} for table ${badmaSchema}.${relationship.table}...`);
    
    // Сначала удаляем relationship, если существует
    try {
      await hasura.deleteRelationship({
        schema: badmaSchema,
        table: relationship.table,
        name: relationship.name
      });
    } catch (error) {
      // Игнорируем ошибку, если relationship не существует
    }
    
    // Создаём новый relationship
    await hasura.defineRelationship({
      schema: badmaSchema,
      table: relationship.table,
      name: relationship.name,
      type: relationship.type,
      using: relationship.using
    });
  }
  
  debug('✅ Items relationships created.');
}

async function applyPermissionsFunc() {
  debug('🔧 Applying items permissions...');
  for (const p of permissions) {
    debug(`     Applying ${p.type} for ${p.role}.${p.table}...`);
    
    // Сначала удаляем permission, если существует
    try {
      await hasura.deletePermission({
        schema: badmaSchema,
        table: p.table,
        operation: p.type as 'select' | 'insert' | 'update' | 'delete',
        role: p.role
      });
    } catch (error) {
      // Игнорируем ошибку, если permission не существует
    }
    
    // Создаём новый permission
    await hasura.definePermission({
      schema: badmaSchema,
      table: p.table,
      operation: p.type as 'select' | 'insert' | 'update' | 'delete',
      role: p.role,
      filter: p.permission.filter || {},
      columns: p.permission.columns,
      aggregate: false
    });
  }
  debug('✅ Items permissions successfully applied.');
}

async function applyAggregationPermissionsFunc() {
  debug('🔧 Applying items aggregation permissions...');

  // Items tables that should have aggregation permissions
  const itemsTablesForAggregation = [
    'items'
  ];

  // Update existing select permissions to include aggregations
  for (const tableName of itemsTablesForAggregation) {
    // For user role - update existing permission to include aggregations
    try {
      await hasura.deletePermission({
        schema: badmaSchema,
        table: tableName,
        operation: 'select',
        role: 'user'
      });
    } catch (error) {
      // Permission might not exist, that's ok
    }

    await hasura.definePermission({
      schema: badmaSchema,
      table: tableName,
      operation: 'select',
      role: 'user',
      filter: {},
      columns: '*',
      aggregate: true
    });
    debug(`     Applied aggregation permission for user.${tableName}`);

    // For anonymous role - update existing permission to include aggregations
    try {
      await hasura.deletePermission({
        schema: badmaSchema,
        table: tableName,
        operation: 'select',
        role: 'anonymous'
      });
    } catch (error) {
      // Permission might not exist, that's ok
    }

    await hasura.definePermission({
      schema: badmaSchema,
      table: tableName,
      operation: 'select',
      role: 'anonymous',
      filter: {},
      columns: '*',
      aggregate: true
    });
    debug(`     Applied aggregation permission for anonymous.${tableName}`);

    // For admin role - create full permission with aggregations
    try {
      await hasura.deletePermission({
        schema: badmaSchema,
        table: tableName,
        operation: 'select',
        role: 'admin'
      });
    } catch (error) {
      // Permission might not exist, that's ok
    }

    await hasura.definePermission({
      schema: badmaSchema,
      table: tableName,
      operation: 'select',
      role: 'admin',
      filter: {},
      columns: '*',
      aggregate: true
    });
    debug(`     Applied aggregation permission for admin.${tableName}`);
  }

  debug('✅ Items aggregation permissions successfully applied.');
}

async function up() {
  debug('🚀 Starting Items schema migration UP...');
  try {
    // Очищаем metadata в самом начале
    await clearInconsistentMetadata(hasura);
    
    await createItemsTable(hasura);
    await clearInconsistentMetadata(hasura);
    await createItemsTriggers(hasura);
    await clearInconsistentMetadata(hasura);
    await trackTablesFunc();
    await clearInconsistentMetadata(hasura);
    await createRelationshipsFunc();
    await clearInconsistentMetadata(hasura);
    await applyPermissionsFunc();
    await clearInconsistentMetadata(hasura);
    await applyAggregationPermissionsFunc();
    debug('✨ Items schema migration UP completed successfully!');
  } catch (error) {
    debug('❗ Critical error during Items UP migration:', error instanceof Error ? error.message : String(error), error);
    debug('❌ Items UP Migration failed.');
    process.exit(1);
  }
}

up(); 