import dotenv from 'dotenv';
import { Hasura } from 'hasyx/lib/hasura/hasura';
import Debug from '../../lib/debug';

const debug = Debug('migration:1756402545774-badma-groups:up');
dotenv.config();

const hasura = new Hasura({
  url: process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL!,
  secret: process.env.HASURA_ADMIN_SECRET!,
});

const publicSchema = 'public';

async function clearInconsistentMetadata(h: Hasura) {
  try { await h.dropInconsistentMetadata(); } catch {}
}

async function defineEnforcementFunction(h: Hasura) {
  debug('🔧 Defining memberships_enforce_one_per_kind function...');
  await h.defineFunction({
    schema: publicSchema,
    name: 'memberships_enforce_one_per_kind',
    language: 'plpgsql',
    definition: `()
RETURNS TRIGGER AS $$
DECLARE
  v_kind text;
  v_exists boolean;
BEGIN
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT kind INTO v_kind FROM public.groups WHERE id = NEW.group_id;
  IF v_kind IS NULL OR v_kind NOT IN ('club','school') THEN
    RETURN NEW;
  END IF;

  IF NEW.status IN ('approved','request') THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.memberships m
      JOIN public.groups g ON g.id = m.group_id
      WHERE m.user_id = NEW.user_id
        AND g.kind = v_kind
        AND m.status IN ('approved','request')
        AND m.id <> NEW.id
    ) INTO v_exists;

    IF v_exists THEN
      RAISE EXCEPTION 'Only one active membership per % is allowed for user %', v_kind, NEW.user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$`
  });
}

async function defineTriggers(h: Hasura) {
  debug('🔗 Defining AFTER triggers on public.memberships...');
  // After INSERT
  await h.defineTrigger({
    schema: publicSchema,
    table: 'memberships',
    name: 'memberships_after_insert_enforce_one_per_kind',
    function_name: `${publicSchema}.memberships_enforce_one_per_kind`,
    timing: 'AFTER',
    event: 'INSERT',
  });

  // After UPDATE
  await h.defineTrigger({
    schema: publicSchema,
    table: 'memberships',
    name: 'memberships_after_update_enforce_one_per_kind',
    function_name: `${publicSchema}.memberships_enforce_one_per_kind`,
    timing: 'AFTER',
    event: 'UPDATE',
  });
}

async function up() {
  debug('🚀 Starting badma-groups enforcement migration UP...');
  try {
    await clearInconsistentMetadata(hasura);
    await defineEnforcementFunction(hasura);
    await clearInconsistentMetadata(hasura);
    await defineTriggers(hasura);
    await clearInconsistentMetadata(hasura);
    debug('✨ badma-groups enforcement migration UP completed!');
  } catch (error) {
    debug('❗ Error during badma-groups UP:', error instanceof Error ? error.message : String(error), error);
    process.exit(1);
  }
}

up();
