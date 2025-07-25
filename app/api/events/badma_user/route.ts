import { NextResponse } from 'next/server';
import { hasyxEvent, HasuraEventPayload } from 'hasyx/lib/events';
import { Hasyx, createApolloClient, Generator } from 'hasyx';
import Debug from 'hasyx/lib/debug';
import { grantItem } from '@/lib/items';
import schema from '@/public/hasura-schema.json';

const debug = Debug('api:events:badma_user');

/**
 * Event handler for new user creation
 * This route is automatically called by Hasura Event Trigger when a new user is created
 * Grants basic items (badma_pieces and badma_board) to new users
 */
export const POST = hasyxEvent(async (payload: HasuraEventPayload) => {
  debug('Received badma_user event:', { 
    table: `${payload.table.schema}.${payload.table.name}`,
    operation: payload.event.op 
  });
  
  // Create Hasyx client for backend operations with admin privileges
  const hasuraAdminSecret = process.env.HASURA_ADMIN_SECRET!;
  const apolloClient = createApolloClient({ secret: hasuraAdminSecret });
  const generate = Generator(schema as any);
  const hasyx = new Hasyx(apolloClient, generate);
  
  // Process the event
  try {
    const newUser = payload.event.data.new;
    const userId = newUser.id;
    
    debug(`Processing new user creation for user ID: ${userId}`);
    
    // Grant basic items to the new user
    await grantBasicItemsToUser(hasyx, userId);
    
    debug(`Successfully processed new user creation for user ID: ${userId}`);
    return NextResponse.json({ success: true });
    
  } catch (error) {
    debug('Error processing badma_user event:', error);
    return NextResponse.json(
      { error: 'Failed to process user creation event' }, 
      { status: 500 }
    );
  }
});

/**
 * Grant basic items to a new user
 */
async function grantBasicItemsToUser(hasyx: Hasyx, userId: string) {
  debug(`🎁 [GRANT_BASIC_ITEMS] Starting to grant basic items to user ${userId}`);
  
  try {
    // Grant classic pieces
    await grantItem(hasyx, null, 'classic_pieces', userId);
    debug(`✅ [GRANT_BASIC_ITEMS] Granted classic_pieces to user ${userId}`);
    
    // Grant classic board  
    await grantItem(hasyx, null, 'classic_board', userId);
    debug(`✅ [GRANT_BASIC_ITEMS] Granted classic_board to user ${userId}`);

    // Grant badma_pieces
    await grantItem(hasyx, null, 'badma_pieces', userId);
    debug(`✅ [GRANT_BASIC_ITEMS] Granted badma_pieces to user ${userId}`);
    
    // Grant badma_board  
    await grantItem(hasyx, null, 'badma_board', userId);
    debug(`✅ [GRANT_BASIC_ITEMS] Granted badma_board to user ${userId}`);
    
    debug(`🎉 [GRANT_BASIC_ITEMS] Successfully granted all basic items to user ${userId}`);
    
  } catch (error) {
    debug(`❌ [GRANT_BASIC_ITEMS] Error granting basic items to user ${userId}:`, error);
    throw error;
  }
}
