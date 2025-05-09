import dotenv from 'dotenv';
import { createApolloClient, Generator, Hasyx } from 'hasyx';
import { testAuthorize } from 'hasyx/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import schema from '../../public/hasura-schema.json';
import { HasyxChessClient } from '../hasyx-chess-client';
import { ChessClientRole } from '../chess-client';
import Debug from '../debug';
import bcrypt from 'bcrypt';
import axios from 'axios';

dotenv.config();
const debug = Debug('badma:test:go-event-chess');

// Setup variables
let adminHasyx: Hasyx;
let humanClient: HasyxChessClient;
let aiUser: { userId: string; email: string };
let humanUser: { userId: string; email: string };
let gameId: string;
const aiLevel = 2; // Medium difficulty

beforeAll(async () => {
  debug('Setting up integration test environment...');
  
  // Create admin Hasyx client
  const adminApolloClient = createApolloClient({ 
    secret: process.env.HASURA_ADMIN_SECRET! 
  });
  const generate = Generator(schema);
  adminHasyx = new Hasyx(adminApolloClient, generate);
  
  // Create test users
  humanUser = await createFakeUser({ adminHasyx, password: 'humanPassword123' });
  aiUser = await createFakeUser({ adminHasyx, password: 'aiPassword456' });
  
  // Create AI configuration for AI user
  await adminHasyx.insert({
    table: 'badma_ais',
    object: {
      user_id: aiUser.userId,
      options: { engine: 'js-chess-engine', level: aiLevel }
    }
  });
  
  // Setup client for human player USING ADMIN HASYX
  humanClient = new HasyxChessClient(adminHasyx);
  humanClient.userId = humanUser.userId;
  humanClient.clientId = uuidv4();
  
  debug(`Human client configured with ADMIN privileges: userId=${humanClient.userId}`);
  debug(`AI user configured: userId=${aiUser.userId}`);
  
  // Note: We assume the games_ai_move trigger is already set up in Hasura
  // Testing will determine if it works correctly
  debug('✅ Assuming games_ai_move event trigger is already set up');
}, 30000);

describe('AI Move Event Trigger Integration Test', () => {
  it('should automatically make AI moves when game state changes via Hasura event trigger', async () => {
    // 1. Create a game as human player (black)
    debug('Human creating game...');
    const createResponse = await humanClient.asyncCreate(1);
    expect(createResponse.error).toBeUndefined();
    gameId = createResponse.data!.gameId!;
    debug(`Game created with ID: ${gameId}`);
    
    // 2. Human joins as black
    debug('Human joining as black (side 2)...');
    const humanJoinResponse = await humanClient.asyncJoin(2, ChessClientRole.Player);
    expect(humanJoinResponse.error).toBeUndefined();
    expect(humanClient.status).toBe('await');
    
    // 3. Make AI join the game
    debug('Adding AI player to the game as white...');
    const aiJoinClientId = uuidv4();
    await adminHasyx.insert({
      table: 'badma_joins',
      object: {
        user_id: aiUser.userId,
        game_id: gameId,
        side: 1, // white
        role: ChessClientRole.Player,
        client_id: aiJoinClientId
      }
    });
    
    debug('Updating game status to ready to trigger AI move...');
    await adminHasyx.update({
      table: 'badma_games',
      where: { id: { _eq: gameId } },
      _set: { status: 'ready', side: 1 }
    });
    
    // 4. Wait for AI to move (event trigger should fire and AI should make a move)
    debug('Waiting 5 seconds for AI to make first move via event trigger...');
    await new Promise(resolve => setTimeout(resolve, 5000)); // Allow time for event trigger to fire
    
    // 5. Sync human client to check if AI made a move
    debug('Syncing human client to check AI\'s move...');
    const syncAfterAiMove = await humanClient.asyncSync();
    expect(syncAfterAiMove.error).toBeUndefined();
    debug(`Game status after AI move: ${humanClient.status}`);
    debug(`Game FEN after AI move: ${humanClient.fen}`);
    debug(`Current turn: ${humanClient.turn}`);
    
    // AI should have moved, and it should now be the human's turn
    expect(humanClient.status).toBe('continue');
    expect(humanClient.turn).toBe(2); // Black's turn (human)
    
    // 6. Make a human move
    debug('Making human move as black...');
    const humanMoveResponse = await humanClient.asyncMove({ from: 'e7', to: 'e5' });
    expect(humanMoveResponse.error).toBeUndefined();
    expect(humanClient.status).toBe('continue');
    expect(humanClient.turn).toBe(1); // White's turn (AI)
    
    // 7. Wait for AI to respond via event trigger
    debug('Waiting 5 seconds for AI to make second move via event trigger...');
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for event and AI move
    
    // 8. Sync human client to see AI's second move
    debug('Syncing human client to check AI\'s second move...');
    const finalSyncResponse = await humanClient.asyncSync();
    expect(finalSyncResponse.error).toBeUndefined();
    debug(`Final game status: ${humanClient.status}`);
    debug(`Final game FEN: ${humanClient.fen}`);
    debug(`Final turn: ${humanClient.turn}`);
    
    // Should be human's turn again
    expect(humanClient.status).toBe('continue');
    expect(humanClient.turn).toBe(2); // Black's turn (human)
    
    // 9. Verify moves in database
    debug('Verifying moves recorded in database...');
    const moves = await adminHasyx.select<any[]>({
      table: 'badma_moves',
      where: { game_id: { _eq: gameId } },
      order_by: { created_at: 'asc' },
      returning: ['id', 'game_id', 'user_id', 'side', 'from', 'to', 'promotion', 'created_at']
    });
    
    debug(`Total moves in game: ${moves.length}, details: ${JSON.stringify(moves)}`);
    expect(moves.length).toBe(3); // AI move + Human move + AI move
    
    // Check that AI made the expected moves
    const aiMoves = moves.filter(move => move.user_id === aiUser.userId);
    expect(aiMoves.length).toBe(2); // Two AI moves
    
    // Human should have made one move
    const humanMoves = moves.filter(move => move.user_id === humanUser.userId);
    expect(humanMoves.length).toBe(1); // One human move
    
    debug('✅ Integration test passed!');
  }, 60000);
});

// Helper function to create a test user
async function createFakeUser({ adminHasyx, password }: { adminHasyx: Hasyx, password: string }) {
  const userId = uuidv4();
  const email = `${userId}@example.com`;
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  const now = new Date().toISOString();

  // debug(`Creating fake user ${email}`); // Already uses debug
  const result = await adminHasyx.insert({
    table: 'users',
    object: {
      id: userId,
      name: `Test User ${userId.substring(0, 4)}`,
      email: email,
      password: hashedPassword,
      email_verified: now,
      is_admin: false,
      hasura_role: 'user',
      created_at: now,
      updated_at: now,
    },
    returning: ['id']
  });
  
  return { userId: result.id, email };
} 