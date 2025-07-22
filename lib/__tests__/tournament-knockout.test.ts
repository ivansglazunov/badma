import dotenv from 'dotenv';
dotenv.config();

// Убедимся, что WebSocket активирован для теста
if (process.env.NEXT_PUBLIC_WS === undefined) {
  process.env.NEXT_PUBLIC_WS = '1';
  console.log('WebSocket explicitly enabled for test: NEXT_PUBLIC_WS=1');
}

import { createApolloClient, Generator, Hasyx } from 'hasyx';
import schema from '@/public/hasura-schema.json'; 
import Debug from '@/lib/debug';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { TournamentKnockout } from '@/lib/tournament-knockout';
import { Users } from '@/types/hasura-types';

const debug = Debug('test:tournament-knockout');

const TEST_TIMEOUT = 60 * 60 * 1000; 
const TOURNAMENT_SIZE = 4;

let tournamentOrganizer: Users;

// Helper function to create a test user
async function createFakeUser(adminHasyx: Hasyx, namePrefix: string = 'TestUser', isOrganizer: boolean = false) {
  const userId = uuidv4();
  const email = `${namePrefix.toLowerCase().replace(/\s+/g, '-')}-${userId.substring(0, 4)}@example.com`;
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash('password123', saltRounds);
  const now = Date.now();

  const result = await adminHasyx.insert<Users>({
    table: 'users',
    object: {
      id: userId,
      name: `${namePrefix} ${userId.substring(0, 4)}`,
      email: email,
      password: hashedPassword,
      email_verified: now,
      is_admin: isOrganizer, 
      hasura_role: isOrganizer ? 'admin' : 'user', 
      created_at: now,
      updated_at: now,
    },
    returning: ['id']
  });
  return result;
}

// Helper to add AI config
async function addAiConfig(adminHasyx: Hasyx, userId: string, level: number) {
  return adminHasyx.insert({
    table: 'badma_ais',
    object: {
      user_id: userId,
      options: { engine: 'js-chess-engine', level },
    },
  });
}

// Helper to add user to tournament
async function addUserToTournament(adminHasyx: Hasyx, userId: string, tournamentId: string) {
  return adminHasyx.insert({
    table: 'badma_tournament_participants',
    object: {
      user_id: userId,
      tournament_id: tournamentId,
      role: 1, 
    },
    returning: ['id', 'user_id']
  });
}

const isLocal = !!+process.env.JEST_LOCAL!;
(!isLocal ? describe : describe.skip)('Tournament Knockout System Test', () => {
  let adminHasyx: Hasyx;
  const users: Users[] = [];
  let tournamentId: string;

  beforeAll(async () => {
    debug('Setting up Knockout tournament test environment...');
    
    const adminApolloClient = createApolloClient({ 
      secret: process.env.HASURA_ADMIN_SECRET!,
      ws: true,
      url: process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL,
    });
    
    const generate = Generator(schema);
    adminHasyx = new Hasyx(adminApolloClient, generate);

    // Create Tournament Organizer user
    tournamentOrganizer = await createFakeUser(adminHasyx, 'Knockout Organizer', true);
    debug(`Created Tournament Organizer: ${tournamentOrganizer.name} (ID: ${tournamentOrganizer.id})`);

    // Create 4 players
    for (let i = 0; i < TOURNAMENT_SIZE; i++) {
      const user = await createFakeUser(adminHasyx, `KnockoutPlayer${i + 1}`);
      users.push(user);
      // Add AI config
      const aiLevel = (i === 0) ? 3 : 1;
      await addAiConfig(adminHasyx, user.id, aiLevel);
      debug(`Created user ${user.name} (ID: ${user.id}) with AI level ${aiLevel}`);
    }
    expect(users.length).toBe(TOURNAMENT_SIZE);

    // Create a tournament
    const tournament = await adminHasyx.insert<any>({
        table: 'badma_tournaments',
        object: {
            user_id: tournamentOrganizer.id,
            status: 'await',
            type: 'knockout',
        },
        returning: ['id', 'status', 'type', 'user_id']
    });
    tournamentId = tournament.id;
    expect(tournamentId).toBeDefined();
    expect(tournament.type).toBe('knockout');
    debug(`Created tournament ${tournamentId} of type ${tournament.type}`);

    // Add users to the tournament
    for (const user of users) {
      await addUserToTournament(adminHasyx, user.id, tournamentId);
      debug(`Added user ${user.id} to tournament ${tournamentId}`);
    }
  }, TEST_TIMEOUT);

  it('should create and start a Knockout tournament', async () => {
    // Create TournamentKnockout instance and start it
    const tournamentHandler = new TournamentKnockout(adminHasyx, tournamentId, tournamentOrganizer.id);
    debug(`Starting Knockout tournament ${tournamentId} by organizer ${tournamentOrganizer.id}`);
    
    await tournamentHandler.start();

    let currentTournament = await adminHasyx.select<any>({
        table: 'badma_tournaments',
        pk_columns: { id: tournamentId },
        returning: ['id', 'status']
    });
    expect(currentTournament.status).toBe('ready');
    debug(`Tournament ${tournamentId} status is 'ready'.`);

    // Verify games were created for first round
    const gamesInTournament = await adminHasyx.select<any[]>({
      table: 'badma_games',
      where: { tournament_games: { tournament_id: { _eq: tournamentId } } },
      returning: ['id', 'user_id', { joins: ['id', 'user_id'] }],
    });
    
    // For 4 players in knockout, first round should have 2 games (semifinals)
    expect(gamesInTournament.length).toBe(2);
    debug(`Verified ${gamesInTournament.length} games created for first round.`);
    
    gamesInTournament.forEach(game => {
        expect(game.user_id).toBe(tournamentOrganizer.id);
    });
    
    let totalJoins = 0;
    gamesInTournament.forEach(game => game.joins && (totalJoins += game.joins.length));
    expect(totalJoins).toBe(4); // 2 games * 2 players each
    debug(`Verified ${totalJoins} player joins created across all games.`);

    debug('Knockout tournament test completed successfully');
  }, TEST_TIMEOUT);

  afterAll(async () => {
    debug('Cleaning up after Knockout tournament test...');
    
    try {
      if (adminHasyx && adminHasyx.apolloClient) {
        await adminHasyx.apolloClient.stop();
        await adminHasyx.apolloClient.clearStore();
      }
    } catch (err) {
      debug('Error during cleanup:', err);
    }
    
    debug('Knockout tournament test cleanup finished.');
  }, TEST_TIMEOUT);
}); 