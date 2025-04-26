import dotenv from 'dotenv';
import { createApolloClient, Generator, Hasyx } from 'hasyx';
import { testAuthorize } from 'hasyx/lib/auth'; // Import testAuthorize
import { v4 as uuidv4 } from 'uuid';
import schema from '../../public/hasura-schema.json'; // Adjust path if needed
import { AxiosChessClient } from '../axios-chess-client'; // Import Axios client
import { ChessClientRole, ChessClientStatus } from '../chess-client';
import Debug from '../debug';
import { go } from '../go'; // Import the go function
import { AxiosInstance } from 'axios'; // Import AxiosInstance type
import { HasyxApolloClient } from 'hasyx'; // Import HasyxApolloClient type from hasyx package
import bcrypt from 'bcrypt'; // Import bcrypt here as createFakeUser needs it


dotenv.config();
const debug = Debug('test:go-http-clients');
const goLevel = 1; // AI difficulty level for the test

// --- Test Setup --- //
const hasuraAdminSecret = process.env.HASURA_ADMIN_SECRET;
if (!hasuraAdminSecret) {
  throw new Error('Missing environment variable: HASURA_ADMIN_SECRET');
}
// Ensure TEST_TOKEN is set for testAuthorize to work
if (!process.env.TEST_TOKEN || !process.env.NEXTAUTH_SECRET) {
  throw new Error('Missing TEST_TOKEN or NEXTAUTH_SECRET for testAuthorize');
}

let adminHasyx: Hasyx;
let whiteAxiosClient: AxiosChessClient;
let blackAxiosClient: AxiosChessClient;
let whiteTestUser: { userId: string; email: string };
let blackTestUser: { userId: string; email: string };
let gameId: string;
const generate = Generator(schema);

beforeAll(async () => {
  debug('Setting up beforeAll for Go HTTP test...');

  // 1. Админский Hasyx клиент
  const adminApolloClient = createApolloClient({ secret: hasuraAdminSecret });
  adminHasyx = new Hasyx(adminApolloClient, generate);
  debug('Admin Hasyx client created.');

  // 2. Создание пользователей (using the function defined below)
  debug('Creating test users via createFakeUser...');
  whiteTestUser = await createFakeUser({ adminHasyx, password: 'dummyPassword1' });
  blackTestUser = await createFakeUser({ adminHasyx, password: 'dummyPassword2' });
  debug(`Created white user: ${whiteTestUser.userId}, black user: ${blackTestUser.userId}`);

  // 3. Авторизация с помощью testAuthorize
  debug('Authorizing clients via testAuthorize...');
  const whiteAuth = await testAuthorize(whiteTestUser.userId);
  debug(`White user authorized via testAuthorize: ${whiteTestUser.userId}`);
  const blackAuth = await testAuthorize(blackTestUser.userId);
  debug(`Black user authorized via testAuthorize: ${blackTestUser.userId}`);

  // 4. Создание AxiosChessClient
  whiteAxiosClient = new AxiosChessClient(whiteAuth.axios);
  blackAxiosClient = new AxiosChessClient(blackAuth.axios);

  // Assign user IDs AND Client IDs
  whiteAxiosClient.userId = whiteTestUser.userId;
  whiteAxiosClient.clientId = uuidv4();
  blackAxiosClient.userId = blackTestUser.userId;
  blackAxiosClient.clientId = uuidv4();

  debug(`White Axios Client configured: userId=${whiteAxiosClient.userId}, clientId=${whiteAxiosClient.clientId}`);
  debug(`Black Axios Client configured: userId=${blackAxiosClient.userId}, clientId=${blackAxiosClient.clientId}`);

}, 120000); // Increased timeout for setup


// --- Test Suite --- //
describe('Go AI vs Go AI via HTTP API', () => {
  it('should play a full game between two AI clients via HTTP until game over', async () => {
    debug(`🚀 Starting Go vs Go test via HTTP API with AI level ${goLevel}`);

    // 1. White Creates Game
    debug('White creating game via API...');
    const createResponse = await whiteAxiosClient.asyncCreate(1); // White is side 1
    expect(createResponse.error).toBeUndefined();
    expect(createResponse.data).toBeDefined();
    gameId = createResponse.data!.gameId!;
    debug(`Game created by White. Game ID: ${gameId}, White Join ID: ${whiteAxiosClient.joinId}`);
    expect(whiteAxiosClient.gameId).toBe(gameId);

    // --- Sync Black (Needs gameId first) ---
    blackAxiosClient.gameId = gameId;
    debug('Syncing Black client after game creation...');
    const syncBlackAfterCreate = await blackAxiosClient.asyncSync();
    debug('Sync Black after create response:', syncBlackAfterCreate);
    expect(syncBlackAfterCreate.error).toBeUndefined();
    expect(syncBlackAfterCreate.data?.status).toBe('await');

    // 2. White Joins Game
    debug('White joining game via API...');
    const joinWhiteResponse = await whiteAxiosClient.asyncJoin(1, ChessClientRole.Player);
    expect(joinWhiteResponse.error).toBeUndefined();
    expect(joinWhiteResponse.data).toBeDefined();
    debug(`White joined game. White Join ID: ${whiteAxiosClient.joinId}`);
    expect(whiteAxiosClient.side).toBe(1);
    expect(whiteAxiosClient.status).toBe('await');

    // --- Sync Black after White joins ---
    debug('Syncing Black client after White join...');
    const syncBlackAfterWhiteJoin = await blackAxiosClient.asyncSync();
    debug('Sync Black after White join response:', syncBlackAfterWhiteJoin);
    expect(syncBlackAfterWhiteJoin.error).toBeUndefined();
    expect(syncBlackAfterWhiteJoin.data?.status).toBe('await');

    // 3. Black Joins Game
    debug('Black joining game via API...');
    const joinBlackResponse = await blackAxiosClient.asyncJoin(2, ChessClientRole.Player);
    expect(joinBlackResponse.error).toBeUndefined();
    expect(joinBlackResponse.data).toBeDefined();
    debug(`Black joined game. Black Join ID: ${blackAxiosClient.joinId}`);
    expect(blackAxiosClient.side).toBe(2);
    // Server response determines status, could be await or ready
    expect(['await', 'ready']).toContain(joinBlackResponse.data?.status);
    blackAxiosClient.status = joinBlackResponse.data!.status; // Update status from response

    // --- Sync BOTH clients after Black joins ---
    debug('Syncing White client after Black join...');
    const syncWhiteResponse = await whiteAxiosClient.asyncSync();
    debug('Sync White after Black join response:', syncWhiteResponse);
    expect(syncWhiteResponse.error).toBeUndefined();
    expect(syncWhiteResponse.data?.status).toBe('ready'); // Should be ready now

    debug('Re-Syncing Black client after Black join (for consistency)...');
    const syncBlackResponse = await blackAxiosClient.asyncSync();
    debug('Sync Black after Black join response:', syncBlackResponse);
    expect(syncBlackResponse.error).toBeUndefined();
    expect(syncBlackResponse.data?.status).toBe('ready'); // Should be ready now

    debug(`Game ready! White FEN: ${whiteAxiosClient.fen}, Black FEN: ${blackAxiosClient.fen}`);

    // 4. Game Loop
    let moveCount = 0;
    const maxMoves = 1000; // Safety break
    let currentStatus: ChessClientStatus = whiteAxiosClient.status;
    let currentTurnRetries = 0;
    const maxRetriesPerTurn = 3;

    while (currentStatus === 'ready' || currentStatus === 'continue') {
      // Determine turn from FEN (more reliable than client state alone)
      const turn = whiteAxiosClient.turn; // Assuming client.turn gets updated by sync
      const activeClient = turn === 1 ? whiteAxiosClient : blackAxiosClient;
      const opponentClient = turn === 1 ? blackAxiosClient : whiteAxiosClient;
      const turnColor = turn === 1 ? 'White' : 'Black';

      if (currentTurnRetries >= maxRetriesPerTurn) {
        debug(`🚨 Max retries (${maxRetriesPerTurn}) reached for ${turnColor}. AI failed to make a valid move. Stopping game.`);
        break;
      }
      if (moveCount >= maxMoves) {
        debug(`🚨 Max successful moves (${maxMoves}) reached. Stopping game.`);
        break;
      }

      debug(`[Move ${moveCount + 1}, Attempt ${currentTurnRetries + 1}] Turn: ${turnColor} (${activeClient.userId})`);
      debug(`[Move ${moveCount + 1}, Attempt ${currentTurnRetries + 1}] Current FEN: ${activeClient.fen}`);

      // Get AI move
      const currentFen = activeClient.fen;
      const aiMoveRaw = go(currentFen, goLevel);
      const aiMove = { ...aiMoveRaw, promotion: aiMoveRaw.promotion ?? undefined };
      debug(`[Move ${moveCount + 1}, Attempt ${currentTurnRetries + 1}] 🤔 AI (${turnColor}) suggests move: ${JSON.stringify(aiMove)}`);

      // Make the move via API
      const moveResponse = await activeClient.asyncMove(aiMove);
      debug(`[Move ${moveCount + 1}, Attempt ${currentTurnRetries + 1}] Move Response:`, moveResponse);

      if (moveResponse.error) {
        debug(`[Move ${moveCount + 1}, Attempt ${currentTurnRetries + 1}] ❌ Move failed! Error: ${moveResponse.error}`);
        // Fetch server state to see if game actually ended
        const syncAfterError = await activeClient.asyncSync(); // Sync the active client
        currentStatus = syncAfterError.data?.status ?? 'error';
        if (currentStatus !== 'continue' && currentStatus !== 'ready') {
          debug(`[Move ${moveCount + 1}] Game ended due to move error resulting in status: ${currentStatus}`);
          // Sync opponent as well
          await opponentClient.asyncSync();
          break; // Exit loop, game ended
        } else {
          currentTurnRetries++;
          debug(`[Move ${moveCount + 1}] Illegal move by AI (${turnColor}). Retrying turn (Attempt ${currentTurnRetries}/${maxRetriesPerTurn}).`);
          continue; // Skip state updates and try the same turn again
        }
      }

      // Move successful
      moveCount++;
      currentTurnRetries = 0;

      // Update currentStatus from the successful move response
      expect(moveResponse.data).toBeDefined();
      currentStatus = moveResponse.data!.status;
      const updatedFen = moveResponse.data!.fen;
      debug(`[Move ${moveCount}] ✅ Move successful. New Status: ${currentStatus}, New FEN: ${updatedFen}`);


      // Sync the OPPONENT client
      debug(`[Move ${moveCount}] Syncing Opponent (${opponentClient.userId})...`);
      const syncResponse = await opponentClient.asyncSync();
      expect(syncResponse.error).toBeUndefined();
      // Verify opponent's state matches the state AFTER the move
      expect(opponentClient.status).toBe(currentStatus);
      expect(opponentClient.fen).toBe(updatedFen);
      debug(`[Move ${moveCount}] Opponent synced. Status: ${opponentClient.status}, FEN: ${opponentClient.fen}`);

      // Verify active client state is also correct (it should have been updated by asyncMove)
      expect(activeClient.status).toBe(currentStatus);
      expect(activeClient.fen).toBe(updatedFen);

      // Check if the game ended after the successful move + sync
      if (currentStatus !== 'ready' && currentStatus !== 'continue') {
        debug(`[Move ${moveCount}] Game ended with status: ${currentStatus}`);
        break;
      }
    }

    // 5. Verify Final State
    debug(`🏁 Game finished after ${moveCount} moves. Final Status: ${currentStatus}`);
    const finalFen = whiteAxiosClient.fen; // Get FEN from one client after final syncs

    // Check that the game ended
    expect(['checkmate', 'stalemate', 'draw', 'white_surrender', 'black_surrender']).toContain(currentStatus);

    // Check both clients are synced to the final state
    expect(blackAxiosClient.status).toBe(currentStatus);
    expect(blackAxiosClient.fen).toBe(finalFen);

    debug('🎉 Go vs Go test via HTTP API completed successfully!');
  }, 300000);
});

// --- Helper Function: Create Fake User (Copied from http test) ---
async function createFakeUser({ adminHasyx, password }: { adminHasyx: Hasyx, password: string }) {
  const userId = uuidv4();
  const email = `${userId}@example.com`;
  const saltRounds = 10; // Standard salt rounds
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  const now = new Date().toISOString();

  debug(`Creating fake user ${email} with hashed password.`);
  const result = await adminHasyx.insert({
    table: 'users',
    object: {
      id: userId,
      name: `Test User ${userId.substring(0, 4)}`,
      email: email,
      password: hashedPassword, // Store hashed password
      email_verified: now, // Set email as verified
      is_admin: false,
      hasura_role: 'user',
      created_at: now,
      updated_at: now,
    },
    returning: ['id']
  });
  const insertedUserId = result?.id;
  if (!insertedUserId) {
    throw new Error('Failed to create fake user in DB');
  }
  debug(`Fake user created with ID: ${insertedUserId}`);
  return { userId: insertedUserId, email };
} 