import dotenv from 'dotenv';
import { Hasura, ColumnType } from 'hasyx/lib/hasura'; 
import Debug from '../../lib/debug';

const debug = Debug('migration:badma-clubs:up');
dotenv.config();

const hasura = new Hasura({
  url: process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL!,
  secret: process.env.HASURA_ADMIN_SECRET!,
});

const badmaSchema = 'badma';
const publicSchema = 'public';

async function createClubsSchema(hasura: Hasura) {
  debug('🔧 Creating badma schema...');
  await hasura.defineSchema({ schema: badmaSchema });
  debug('✅ Badma schema created successfully.');
}

async function clearInconsistentMetadata(hasura: Hasura) {
  debug('🧹 Clearing inconsistent metadata...');
  try {
    await hasura.dropInconsistentMetadata();
    debug('✅ Inconsistent metadata cleared.');
  } catch (error) {
    debug('⚠️ Could not clear inconsistent metadata (may not exist):', error instanceof Error ? error.message : String(error));
  }
}

async function createClubsTable(hasura: Hasura) {
  debug('🔧 Creating badma.clubs table...');
  
  await hasura.defineTable({ 
    schema: badmaSchema, 
    table: 'clubs',
    id: 'id',
    type: ColumnType.UUID
  });
  
  // Define columns using high-level methods
  await hasura.defineColumn({
    schema: badmaSchema,
    table: 'clubs',
    name: 'user_id',
    type: ColumnType.UUID,
    postfix: 'NOT NULL',
    comment: 'User who created and owns the club'
  });
  
  await hasura.defineColumn({
    schema: badmaSchema,
    table: 'clubs',
    name: 'title',
    type: ColumnType.TEXT,
    postfix: "NOT NULL DEFAULT ''",
    comment: 'Club title/name'
  });
  
  await hasura.defineColumn({
    schema: badmaSchema,
    table: 'clubs',
    name: 'created_at',
    type: ColumnType.BIGINT,
    postfix: 'NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000',
    comment: 'Creation timestamp'
  });
  
  await hasura.defineColumn({
    schema: badmaSchema,
    table: 'clubs',
    name: 'updated_at',
    type: ColumnType.BIGINT,
    postfix: 'NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000',
    comment: 'Last update timestamp'
  });
  
  // Create foreign key
  await hasura.defineForeignKey({
    from: { schema: badmaSchema, table: 'clubs', column: 'user_id' },
    to: { schema: publicSchema, table: 'users', column: 'id' },
    on_delete: 'CASCADE',
    on_update: 'CASCADE'
  });
  
  debug('✅ Badma.clubs table created successfully.');
}

async function createInClubsTable(hasura: Hasura) {
  debug('🔧 Creating badma.in_clubs table...');
  
  await hasura.defineTable({ 
    schema: badmaSchema, 
    table: 'in_clubs',
    id: 'id',
    type: ColumnType.UUID
  });
  
  // Define columns using high-level methods
  await hasura.defineColumn({
    schema: badmaSchema,
    table: 'in_clubs',
    name: 'club_id',
    type: ColumnType.UUID,
    postfix: 'NOT NULL',
    comment: 'Reference to clubs table'
  });
  
  await hasura.defineColumn({
    schema: badmaSchema,
    table: 'in_clubs',
    name: 'user_id',
    type: ColumnType.UUID,
    postfix: 'NOT NULL',
    comment: 'User for whom the request was created'
  });
  
  await hasura.defineColumn({
    schema: badmaSchema,
    table: 'in_clubs',
    name: 'status',
    type: ColumnType.TEXT,
    postfix: "NOT NULL DEFAULT 'request' CHECK (status IN ('request', 'approved', 'denied'))",
    comment: 'Request status'
  });
  
  await hasura.defineColumn({
    schema: badmaSchema,
    table: 'in_clubs',
    name: 'created_by_id',
    type: ColumnType.UUID,
    postfix: 'NOT NULL',
    comment: 'User who created the request'
  });
  
  await hasura.defineColumn({
    schema: badmaSchema,
    table: 'in_clubs',
    name: 'created_at',
    type: ColumnType.BIGINT,
    postfix: 'NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000',
    comment: 'Creation timestamp'
  });
  
  await hasura.defineColumn({
    schema: badmaSchema,
    table: 'in_clubs',
    name: 'updated_at',
    type: ColumnType.BIGINT,
    postfix: 'NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000',
    comment: 'Last update timestamp'
  });
  
  // Create foreign keys
  await hasura.defineForeignKey({
    from: { schema: badmaSchema, table: 'in_clubs', column: 'club_id' },
    to: { schema: badmaSchema, table: 'clubs', column: 'id' },
    on_delete: 'CASCADE',
    on_update: 'CASCADE'
  });
  
  await hasura.defineForeignKey({
    from: { schema: badmaSchema, table: 'in_clubs', column: 'user_id' },
    to: { schema: publicSchema, table: 'users', column: 'id' },
    on_delete: 'CASCADE',
    on_update: 'CASCADE'
  });
  
  await hasura.defineForeignKey({
    from: { schema: badmaSchema, table: 'in_clubs', column: 'created_by_id' },
    to: { schema: publicSchema, table: 'users', column: 'id' },
    on_delete: 'CASCADE',
    on_update: 'CASCADE'
  });
  
  debug('✅ Badma.in_clubs table created successfully.');
}

async function createStatusValidationTrigger(hasura: Hasura) {
  debug('🔧 Creating status validation trigger...');
  
  // Create trigger function for status validation
  await hasura.defineFunction({
    schema: badmaSchema,
    name: 'validate_status_update',
    definition: `()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Only allow status changes from 'request' to 'approved' or 'denied'
        IF OLD.status = 'request' AND NEW.status IN ('approved', 'denied') THEN
          RETURN NEW;
        ELSE
          RAISE EXCEPTION 'Status can only be changed from request to approved or denied';
        END IF;
      END;
      $$`,
    language: 'plpgsql'
  });
  
  // Create trigger for in_clubs status validation
  await hasura.defineTrigger({
    schema: badmaSchema,
    table: 'in_clubs',
    name: 'validate_in_clubs_status_update',
    function_name: `${badmaSchema}.validate_status_update`,
    timing: 'BEFORE',
    event: 'UPDATE'
  });
  
  debug('✅ Status validation trigger created successfully.');
}

const tablesToTrack = [
  { schema: badmaSchema, name: 'clubs' },
  { schema: badmaSchema, name: 'in_clubs' },
];

// Define relationships using defineRelationship method
const relationships = [
  // For clubs
  {
    name: 'user',
    type: 'object' as const,
    using: { foreign_key_constraint_on: 'user_id' }
  },
  {
    name: 'in_clubs',
    type: 'array' as const,
    using: { foreign_key_constraint_on: { table: { schema: badmaSchema, name: 'in_clubs' }, column: 'club_id' } }
  },
  // For in_clubs
  {
    name: 'club',
    type: 'object' as const,
    using: { foreign_key_constraint_on: 'club_id' }
  },
  {
    name: 'user',
    type: 'object' as const,
    using: { foreign_key_constraint_on: 'user_id' }
  },
  {
    name: 'created_by',
    type: 'object' as const,
    using: { foreign_key_constraint_on: 'created_by_id' }
  }
];

// Define public schema relationships
const publicRelationships = [
  {
    table: 'users',
    name: 'in_clubs',
    type: 'array' as const,
    using: { 
      foreign_key_constraint_on: { 
        table: { schema: badmaSchema, name: 'in_clubs' }, 
        column: 'user_id'
      } 
    }
  },
  {
    table: 'users',
    name: 'owned_clubs',
    type: 'array' as const,
    using: { 
      foreign_key_constraint_on: { 
        table: { schema: badmaSchema, name: 'clubs' }, 
        column: 'user_id'
      } 
    }
  },
  {
    table: 'users',
    name: 'created_in_clubs',
    type: 'array' as const,
    using: { 
      foreign_key_constraint_on: { 
        table: { schema: badmaSchema, name: 'in_clubs' }, 
        column: 'created_by_id'
      } 
    }
  }
];

const permissions = [
  // clubs - admin
  { role: 'admin', table: 'clubs', type: 'select', permission: { columns: true, filter: {} } },
  { role: 'admin', table: 'clubs', type: 'insert', permission: { columns: true, check: {} } },
  { role: 'admin', table: 'clubs', type: 'update', permission: { columns: true, filter: {}, check: {} } },
  { role: 'admin', table: 'clubs', type: 'delete', permission: { filter: {} } },
  // clubs - user
  { role: 'user', table: 'clubs', type: 'select', permission: { columns: true, filter: {} } },
  { role: 'user', table: 'clubs', type: 'insert', permission: { 
    columns: ['user_id'], 
    check: { user_id: { _eq: 'X-Hasura-User-Id' } } 
  } },
  { role: 'user', table: 'clubs', type: 'update', permission: { 
    columns: ['title', 'updated_at'], 
    filter: { user_id: { _eq: 'X-Hasura-User-Id' } },
    check: { user_id: { _eq: 'X-Hasura-User-Id' } }
  } },
  // clubs - anonymous
  { role: 'anonymous', table: 'clubs', type: 'select', permission: { columns: true, filter: {} } },
  // in_clubs - admin
  { role: 'admin', table: 'in_clubs', type: 'select', permission: { columns: true, filter: {} } },
  { role: 'admin', table: 'in_clubs', type: 'insert', permission: { columns: true, check: {} } },
  { role: 'admin', table: 'in_clubs', type: 'update', permission: { columns: true, filter: {}, check: {} } },
  { role: 'admin', table: 'in_clubs', type: 'delete', permission: { filter: {} } },
  // in_clubs - user
  { role: 'user', table: 'in_clubs', type: 'select', permission: { columns: true, filter: {} } },
  { role: 'user', table: 'in_clubs', type: 'insert', permission: { 
    columns: ['club_id', 'user_id', 'status', 'created_by_id'], 
    check: { 
      status: { _eq: 'request' },
      created_by_id: { _eq: 'X-Hasura-User-Id' }
    } 
  } },
  { role: 'user', table: 'in_clubs', type: 'update', permission: { 
    columns: ['status'], 
    filter: {
      _or: [
        {
          club: {
            user_id: { _eq: 'X-Hasura-User-Id' }
          },
          created_by_id: { _neq: 'X-Hasura-User-Id' }
        },
        {
          created_by_id: { _eq: 'X-Hasura-User-Id' },
          club: {
            user_id: { _eq: 'X-Hasura-User-Id' }
          },
          user_id: { _neq: 'X-Hasura-User-Id' }
        }
      ]
    },
    check: { 
      status: { _in: ['approved', 'denied'] }
    }
  } },
  { role: 'user', table: 'in_clubs', type: 'delete', permission: { 
    filter: { user_id: { _eq: 'X-Hasura-User-Id' } } 
  } },
  // in_clubs - anonymous
  { role: 'anonymous', table: 'in_clubs', type: 'select', permission: { columns: true, filter: {} } },
];

async function trackTablesFunc() {
  debug('🔍 Tracking club tables...');
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
  debug('✅ Club table tracking complete.');
}

async function createRelationshipsFunc() {
  debug('🔗 Creating club relationships...');
  
  // Create relationships for badma schema tables
  for (const table of tablesToTrack) {
    const tableRelationships = relationships.filter(rel => 
      rel.name === 'user' || 
      rel.name === 'in_clubs' || 
      (table.name === 'in_clubs' && ['club', 'user', 'created_by'].includes(rel.name))
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
  
  debug('✅ Club relationships created.');
}

async function applyPermissionsFunc() {
  debug('🔧 Applying club permissions...');
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
      columns: (Array.isArray(p.permission.columns) ? p.permission.columns : true),
      aggregate: false
    });
  }
  debug('✅ Club permissions successfully applied.');
}

async function applyAggregationPermissionsFunc() {
  debug('🔧 Applying club aggregation permissions...');

  // Club tables that should have aggregation permissions
  const clubTablesForAggregation = [
    'clubs', 'in_clubs'
  ];

  // Update existing select permissions to include aggregations
  for (const tableName of clubTablesForAggregation) {
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
      columns: true,
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
      columns: true,
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
      columns: true,
      aggregate: true
    });
    debug(`     Applied aggregation permission for admin.${tableName}`);
  }

  debug('✅ Club aggregation permissions successfully applied.');
}

async function up() {
  debug('🚀 Starting Clubs schema migration UP...');
  try {
    // Очищаем metadata в самом начале
    await clearInconsistentMetadata(hasura);
    
    await createClubsSchema(hasura);
    await clearInconsistentMetadata(hasura);
    await createClubsTable(hasura);
    await clearInconsistentMetadata(hasura);
    await createInClubsTable(hasura);
    await clearInconsistentMetadata(hasura);
    await createStatusValidationTrigger(hasura);
    await clearInconsistentMetadata(hasura);
    await trackTablesFunc();
    await clearInconsistentMetadata(hasura);
    await createRelationshipsFunc();
    await clearInconsistentMetadata(hasura);
    await applyPermissionsFunc();
    await clearInconsistentMetadata(hasura);
    await applyAggregationPermissionsFunc();
    debug('✨ Clubs schema migration UP completed successfully!');
  } catch (error) {
    debug('❗ Critical error during Clubs UP migration:', error instanceof Error ? error.message : String(error), error);
    debug('❌ Clubs UP Migration failed.');
    process.exit(1);
  }
}

up(); 