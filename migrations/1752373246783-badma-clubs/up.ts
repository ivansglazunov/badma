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

const relationships = [
  // For clubs
  {
    type: 'pg_create_object_relationship',
    args: {
      source: 'default',
      table: { schema: badmaSchema, name: 'clubs' },
      name: 'user',
      using: { foreign_key_constraint_on: 'user_id' }
    }
  },
  {
    type: 'pg_create_array_relationship',
    args: {
      source: 'default',
      table: { schema: badmaSchema, name: 'clubs' },
      name: 'in_clubs',
      using: { foreign_key_constraint_on: { table: { schema: badmaSchema, name: 'in_clubs' }, column: 'club_id' } }
    }
  },
  // For in_clubs
  {
    type: 'pg_create_object_relationship',
    args: {
      source: 'default',
      table: { schema: badmaSchema, name: 'in_clubs' },
      name: 'club',
      using: { foreign_key_constraint_on: 'club_id' }
    }
  },
  {
    type: 'pg_create_object_relationship',
    args: {
      source: 'default',
      table: { schema: badmaSchema, name: 'in_clubs' },
      name: 'user',
      using: { foreign_key_constraint_on: 'user_id' }
    }
  },
  {
    type: 'pg_create_object_relationship',
    args: {
      source: 'default',
      table: { schema: badmaSchema, name: 'in_clubs' },
      name: 'created_by',
      using: { foreign_key_constraint_on: 'created_by_id' }
    }
  },
  // Relationship from public.users to badma.in_clubs
  {
    type: 'pg_create_array_relationship',
    args: {
      source: 'default',
      table: { schema: publicSchema, name: 'users' },
      name: 'in_clubs',
      using: { 
        foreign_key_constraint_on: { 
          table: { schema: badmaSchema, name: 'in_clubs' }, 
          column: 'user_id'
        } 
      }
    }
  },
  // Relationship from public.users to badma.clubs (as owner)
  {
    type: 'pg_create_array_relationship',
    args: {
      source: 'default',
      table: { schema: publicSchema, name: 'users' },
      name: 'owned_clubs',
      using: { 
        foreign_key_constraint_on: { 
          table: { schema: badmaSchema, name: 'clubs' }, 
          column: 'user_id'
        } 
      }
    }
  },
  // Relationship from public.users to badma.in_clubs (as created_by)
  {
    type: 'pg_create_array_relationship',
    args: {
      source: 'default',
      table: { schema: publicSchema, name: 'users' },
      name: 'created_in_clubs',
      using: { 
        foreign_key_constraint_on: { 
          table: { schema: badmaSchema, name: 'in_clubs' }, 
          column: 'created_by_id'
        } 
      }
    }
  }
];

const permissions = [
  // clubs - admin
  { role: 'admin', table: 'clubs', type: 'select', permission: { columns: '*', filter: {} } },
  { role: 'admin', table: 'clubs', type: 'insert', permission: { columns: '*', check: {} } },
  { role: 'admin', table: 'clubs', type: 'update', permission: { columns: '*', filter: {}, check: {} } },
  { role: 'admin', table: 'clubs', type: 'delete', permission: { filter: {} } },
  // clubs - user
  { role: 'user', table: 'clubs', type: 'select', permission: { columns: '*', filter: {} } },
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
  { role: 'anonymous', table: 'clubs', type: 'select', permission: { columns: '*', filter: {} } },
  // in_clubs - admin
  { role: 'admin', table: 'in_clubs', type: 'select', permission: { columns: '*', filter: {} } },
  { role: 'admin', table: 'in_clubs', type: 'insert', permission: { columns: '*', check: {} } },
  { role: 'admin', table: 'in_clubs', type: 'update', permission: { columns: '*', filter: {}, check: {} } },
  { role: 'admin', table: 'in_clubs', type: 'delete', permission: { filter: {} } },
  // in_clubs - user
  { role: 'user', table: 'in_clubs', type: 'select', permission: { columns: '*', filter: {} } },
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
  { role: 'anonymous', table: 'in_clubs', type: 'select', permission: { columns: '*', filter: {} } },
];

async function trackTablesFunc() {
  debug('🔍 Tracking club tables...');
  for (const table of tablesToTrack) {
    debug(`  📝 Tracking table ${table.schema}.${table.name}...`);
    await hasura.trackTable({ schema: table.schema, table: table.name });
  }
  debug('✅ Club table tracking complete.');
}

async function createRelationshipsFunc() {
  debug('🔗 Creating club relationships...');
  for (const relationship of relationships) {
     debug(`  📝 Creating relationship ${relationship.args.name} for table ${relationship.args.table.schema}.${relationship.args.table.name}...`);
     await hasura.v1(relationship);
  }
  debug('✅ Club relationships created.');
}

async function applyPermissionsFunc() {
  debug('🔧 Applying club permissions...');
  for (const p of permissions) {
    const action = `pg_create_${p.type}_permission`;
    debug(`     Applying ${p.type} for ${p.role}.${p.table}...`);
    await hasura.v1({
      type: action,
      args: {
        source: 'default',
        table: { schema: badmaSchema, name: p.table },
        role: p.role,
        permission: p.permission,
      }
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
      await hasura.v1({
        type: 'pg_drop_select_permission',
        args: {
          source: 'default',
          table: { schema: badmaSchema, name: tableName },
          role: 'user'
        }
      });
    } catch (error) {
      // Permission might not exist, that's ok
    }

    await hasura.v1({
      type: 'pg_create_select_permission',
      args: {
        source: 'default',
        table: { schema: badmaSchema, name: tableName },
        role: 'user',
        permission: {
          columns: '*',
          filter: {},
          allow_aggregations: true
        }
      }
    });
    debug(`     Applied aggregation permission for user.${tableName}`);

    // For anonymous role - update existing permission to include aggregations
    try {
      await hasura.v1({
        type: 'pg_drop_select_permission',
        args: {
          source: 'default',
          table: { schema: badmaSchema, name: tableName },
          role: 'anonymous'
        }
      });
    } catch (error) {
      // Permission might not exist, that's ok
    }

    await hasura.v1({
      type: 'pg_create_select_permission',
      args: {
        source: 'default',
        table: { schema: badmaSchema, name: tableName },
        role: 'anonymous',
        permission: {
          columns: '*',
          filter: {},
          allow_aggregations: true
        }
      }
    });
    debug(`     Applied aggregation permission for anonymous.${tableName}`);

    // For admin role - create full permission with aggregations
    try {
      await hasura.v1({
        type: 'pg_drop_select_permission',
        args: {
          source: 'default',
          table: { schema: badmaSchema, name: tableName },
          role: 'admin'
        }
      });
    } catch (error) {
      // Permission might not exist, that's ok
    }

    await hasura.v1({
      type: 'pg_create_select_permission',
      args: {
        source: 'default',
        table: { schema: badmaSchema, name: tableName },
        role: 'admin',
        permission: {
          columns: '*',
          filter: {},
          allow_aggregations: true
        }
      }
    });
    debug(`     Applied aggregation permission for admin.${tableName}`);
  }

  debug('✅ Club aggregation permissions successfully applied.');
}

async function up() {
  debug('🚀 Starting Clubs schema migration UP...');
  try {
    await createClubsSchema(hasura);
    await createClubsTable(hasura);
    await createInClubsTable(hasura);
    await createStatusValidationTrigger(hasura);
    await trackTablesFunc();
    await createRelationshipsFunc();
    await applyPermissionsFunc();
    await applyAggregationPermissionsFunc();
    debug('✨ Clubs schema migration UP completed successfully!');
  } catch (error) {
    debug('❗ Critical error during Clubs UP migration:', error instanceof Error ? error.message : String(error), error);
    debug('❌ Clubs UP Migration failed.');
    process.exit(1);
  }
}

up(); 