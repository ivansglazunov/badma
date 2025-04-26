import dotenv from 'dotenv';
import { Hasyx, createApolloClient, Generator } from 'hasyx';
import { v4 as uuidv4 } from 'uuid';
import Debug from '../debug';
import schema from '../../public/hasura-schema.json'; // Убедитесь, что путь правильный
import { AxiosChessClient } from '../axios-chess-client'; // Corrected path
import { ChessClientRole } from '../chess-client'; // Corrected path
import bcrypt from 'bcrypt'; // Import bcrypt for password hashing
import { testAuthorize } from 'hasyx/lib/auth'; // Import testAuthorize

// Для fetch в Node.js (если не используется глобально)
// import fetch from 'node-fetch'; // Раскомментируйте, если нужно

dotenv.config();
const debug = Debug('test:http-clients');

// --- Переменные окружения (ВАЖНО!) ---
const hasuraAdminSecret = process.env.HASURA_ADMIN_SECRET;
// Define the base URL for the Next.js app itself
const BASE_URL = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'; 

// Проверка наличия секретов
if (!hasuraAdminSecret) {
  throw new Error('Missing environment variable: HASURA_ADMIN_SECRET');
}

// --- Глобальные переменные теста ---
let adminHasyx: Hasyx;
let whiteAxiosClient: AxiosChessClient;
let blackAxiosClient: AxiosChessClient;
let whiteTestUser: { userId: string; email: string };
let blackTestUser: { userId: string; email: string };
const whitePassword = 'passwordWhite123!'; // Not needed with testAuthorize, but keeping for createFakeUser
const blackPassword = 'passwordBlack456!';

const generate = Generator(schema);

// --- Настройка перед всеми тестами ---
beforeAll(async () => {
  debug('Setting up beforeAll...');

  // 1. Админский Hasyx клиент
  const adminApolloClient = createApolloClient({ secret: hasuraAdminSecret });
  adminHasyx = new Hasyx(adminApolloClient, generate);
  debug('Admin Hasyx client created.');

  // 2. Создание пользователей через helper function
  debug('Creating test users via createFakeUser...');
  whiteTestUser = await createFakeUser({ adminHasyx, password: whitePassword });
  blackTestUser = await createFakeUser({ adminHasyx, password: blackPassword });
  debug(`Created white user: ${whiteTestUser.userId}, black user: ${blackTestUser.userId}`);

  // 3. Авторизация с помощью testAuthorize
  debug('Authorizing clients via testAuthorize...');
  
  // White user auth
  const whiteAuth = await testAuthorize(whiteTestUser.userId);
  debug(`White user authorized via testAuthorize: ${whiteTestUser.userId}`);
  
  // Black user auth
  const blackAuth = await testAuthorize(blackTestUser.userId);
  debug(`Black user authorized via testAuthorize: ${blackTestUser.userId}`);

  // 4. Создание AxiosChessClient с авторизованными экземплярами Axios
  whiteAxiosClient = new AxiosChessClient(whiteAuth.axios); 
  blackAxiosClient = new AxiosChessClient(blackAuth.axios);

  // Assign user IDs AND Client IDs
  whiteAxiosClient.userId = whiteTestUser.userId;
  whiteAxiosClient.clientId = uuidv4();
  blackAxiosClient.userId = blackTestUser.userId;
  blackAxiosClient.clientId = uuidv4();

  debug(`White Axios Client configured: userId=${whiteAxiosClient.userId}, clientId=${whiteAxiosClient.clientId}`);
  debug(`Black Axios Client configured: userId=${blackAxiosClient.userId}, clientId=${blackAxiosClient.clientId}`);

}, 60000); // Keep increased timeout for setup

// --- Тесты ---
describe('HTTP API (/api/badma) Interaction', () => {
  it('should handle a full game cycle via HTTP API (Fools Mate)', async () => {
    debug(`Starting HTTP API Fool's Mate test`);

    // Ensure clients are set up from beforeAll
    expect(whiteAxiosClient).toBeDefined();
    expect(blackAxiosClient).toBeDefined();
    // Use the correct user IDs from the setup
    expect(whiteAxiosClient.userId).toBe(whiteTestUser.userId);
    expect(blackAxiosClient.userId).toBe(blackTestUser.userId);

    // 1. White Creates Game via API
    debug('White creating game via API...');
    const createResponse = await whiteAxiosClient.asyncCreate(1); // White is side 1
    debug('Create game response: ', createResponse);
    expect(createResponse.error).toBeUndefined();
    expect(createResponse.data).toBeDefined();
    const gameId = createResponse.data!.gameId!;
    expect(gameId).toBeDefined();
    debug(`Game created by White via API. Game ID: ${gameId}, Client Game ID: ${whiteAxiosClient.gameId}`);
    expect(whiteAxiosClient.gameId).toBe(gameId);

    // 2. White Joins Game via API
    debug('White joining game via API...');
    const joinWhiteResponse = await whiteAxiosClient.asyncJoin(1, ChessClientRole.Player); // White is side 1
    debug('Join white response: ', joinWhiteResponse);
    expect(joinWhiteResponse.error).toBeUndefined();
    expect(joinWhiteResponse.data).toBeDefined();
    debug(`White joined game via API. White Join ID: ${whiteAxiosClient.joinId}`);
    expect(whiteAxiosClient.side).toBe(1);
    expect(whiteAxiosClient.role).toBe(ChessClientRole.Player);
    expect(whiteAxiosClient.status).toBe('await'); // Status should be await after first player joins
    
    // 3. Black Joins Game via API
    debug('Black joining game via API...');
    blackAxiosClient.gameId = gameId; // Manually set gameId for black client based on white's creation response
    const joinBlackResponse = await blackAxiosClient.asyncJoin(2, ChessClientRole.Player); // Black is side 2
    debug('Join black response: ', joinBlackResponse);
    expect(joinBlackResponse.error).toBeUndefined();
    expect(joinBlackResponse.data).toBeDefined();
    debug(`Black joined game via API. Black Join ID: ${blackAxiosClient.joinId}`);
    expect(blackAxiosClient.side).toBe(2);
    expect(blackAxiosClient.role).toBe(ChessClientRole.Player);
    // After black joins, status might become 'ready'
    expect(['await', 'ready']).toContain(blackAxiosClient.status);

    const syncWhiteResponse1 = await whiteAxiosClient.asyncSync();
    expect(syncWhiteResponse1.error).toBeUndefined();
    expect(syncWhiteResponse1.data?.status).toBe('ready');

    const syncBlackResponse1 = await blackAxiosClient.asyncSync();
    expect(syncBlackResponse1.error).toBeUndefined();
    expect(syncBlackResponse1.data?.status).toBe('ready');

    // 4. White Makes First Move (Fool's Mate: f2-f3)
    debug('White making first move: f2-f3...');
    const whiteMove1Response = await whiteAxiosClient.asyncMove({ from: 'f2', to: 'f3' });
    debug('White move 1 response: ', whiteMove1Response);
    expect(whiteMove1Response.error).toBeUndefined();
    expect(whiteMove1Response.data?.status).toBe('continue');

    const syncBlackResponse2 = await blackAxiosClient.asyncSync();
    expect(syncBlackResponse2.error).toBeUndefined();
    expect(syncBlackResponse2.data?.status).toBe('continue');
    
    // 5. Black Makes First Move (Fool's Mate: e7-e6)
    debug('Black making first move: e7-e6...');
    const blackMove1Response = await blackAxiosClient.asyncMove({ from: 'e7', to: 'e5' });
    debug('Black move 1 response: ', blackMove1Response);
    expect(blackMove1Response.error).toBeUndefined();
    expect(blackMove1Response.data?.status).toBe('continue');

    const syncWhiteResponse2 = await whiteAxiosClient.asyncSync();
    expect(syncWhiteResponse2.error).toBeUndefined();
    expect(syncWhiteResponse2.data?.status).toBe('continue');
    
    // 6. White Makes Second Move (Fool's Mate: g2-g4)
    debug('White making second move: g2-g4...');
    const whiteMove2Response = await whiteAxiosClient.asyncMove({ from: 'g2', to: 'g4' });
    debug('White move 2 response: ', whiteMove2Response);
    expect(whiteMove2Response.error).toBeUndefined();
    expect(whiteMove2Response.data?.status).toBe('continue');
    
    const syncBlackResponse3 = await blackAxiosClient.asyncSync();
    expect(syncBlackResponse3.error).toBeUndefined();
    expect(syncBlackResponse3.data?.status).toBe('continue');
    
    // 7. Black Makes Second Move (Fool's Mate: d8-h4 - Checkmate!)
    debug('Black making second move: d8-h4 (Checkmate!)...');
    const blackMove2Response = await blackAxiosClient.asyncMove({ from: 'd8', to: 'h4' });
    debug('Black move 2 response: ', blackMove2Response);
    expect(blackMove2Response.error).toBeUndefined();
    expect(blackMove2Response.data?.status).toBe('checkmate');
    
    const syncWhiteResponse4 = await whiteAxiosClient.asyncSync();
    expect(syncWhiteResponse4.error).toBeUndefined();
    expect(syncWhiteResponse4.data?.status).toBe('checkmate');
    
    // 8. Game should be over - Verify final status
    debug('Verifying game final status...');
    const finalSyncWhite = await whiteAxiosClient.asyncSync();
    debug('Final white sync response: ', finalSyncWhite);
    expect(finalSyncWhite.error).toBeUndefined();
    expect(finalSyncWhite.data?.status).toBe('checkmate');
    
    debug('Fool\'s Mate game completed via HTTP API successfully!');
  }, 100000);
});

// --- Очистка после всех тестов (optional, now needs to delete two users) ---
// afterAll(async () => {
//     if (whiteTestUser?.userId && adminHasyx) {
//         try {
//             await adminHasyx.delete({ table: 'users', where: { id: { _eq: whiteTestUser.userId } } });
//             debug(`Cleaned up test user: ${whiteTestUser.userId}`);
//         } catch (error) {
//             debug(`Error cleaning up test user ${whiteTestUser.userId}:`, error);
//         }
//     }
//     if (blackTestUser?.userId && adminHasyx) {
//         try {
//             await adminHasyx.delete({ table: 'users', where: { id: { _eq: blackTestUser.userId } } });
//             debug(`Cleaned up test user: ${blackTestUser.userId}`);
//         } catch (error) {
//             debug(`Error cleaning up test user ${blackTestUser.userId}:`, error);
//         }
//     }
// });

// --- Helper Function: Create Fake User ---
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
