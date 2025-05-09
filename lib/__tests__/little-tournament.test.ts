import dotenv from 'dotenv';
dotenv.config();

import { createApolloClient, Generator, Hasyx } from 'hasyx';
import schema from '@/public/hasura-schema.json'; 
import Debug from '@/lib/debug';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { TournamentRoundRobin } from '@/lib/tournament-round-robin';
import { TournamentStatus } from '@/lib/tournament';
import { Badma_Games, Badma_Tournament_Participants, Badma_Tournament_Scores, Users } from '@/types/hasura-types';

const debug = Debug('test:little-tournament');

const TEST_TIMEOUT = 5 * 60 * 1000; 
const POLLING_INTERVAL = 5000; 

let tournamentOrganizer: Users;

// Helper function to create a test user
async function createFakeUser(adminHasyx: Hasyx, namePrefix: string = 'TestUser', isOrganizer: boolean = false) {
  const userId = uuidv4();
  const email = `${namePrefix.toLowerCase().replace(/\s+/g, '-')}-${userId.substring(0, 4)}@example.com`;
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash('password123', saltRounds);
  const now = new Date().toISOString();

  const result = await adminHasyx.insert<Users>({
    table: 'users', // This is correct, as it's in public schema
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
    returning: ['id', 'name'],
  });
  return result;
}

// Helper to add AI config
async function addAiConfig(adminHasyx: Hasyx, userId: string, level: number) {
  return adminHasyx.insert({
    table: 'badma_ais', // Corrected
    object: {
      user_id: userId,
      options: { engine: 'js-chess-engine', level },
    },
  });
}

// Helper to add user to tournament
async function addUserToTournament(adminHasyx: Hasyx, userId: string, tournamentId: string) {
  return adminHasyx.insert<Badma_Tournament_Participants>({
    table: 'badma_tournament_participants', // Corrected
    object: {
      user_id: userId,
      tournament_id: tournamentId,
      role: 1, 
    },
    returning: ['id', 'user_id']
  });
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('Little Round Robin Tournament Test', () => {
  let adminHasyx: Hasyx;
  const users: Users[] = [];
  let tournamentId: string;

  beforeAll(async () => {
    debug('Setting up little tournament test environment...');
    const adminApolloClient = createApolloClient({ secret: process.env.HASURA_ADMIN_SECRET! });
    const generate = Generator(schema);
    adminHasyx = new Hasyx(adminApolloClient, generate);

    // Create Tournament Organizer user
    tournamentOrganizer = await createFakeUser(adminHasyx, 'Tournament Organizer', true);
    debug(`Created Tournament Organizer: ${tournamentOrganizer.name} (ID: ${tournamentOrganizer.id})`);

    // 1. Create 5 players
    for (let i = 0; i < 5; i++) {
      const user = await createFakeUser(adminHasyx, `TourneyPlayer${i + 1}`);
      users.push(user);
      // 2. Add AI config with random level 1-3
      const aiLevel = Math.floor(Math.random() * 3) + 1;
      await addAiConfig(adminHasyx, user.id, aiLevel);
      debug(`Created user ${user.name} (ID: ${user.id}) with AI level ${aiLevel}`);
    }
    expect(users.length).toBe(5);

    // 3. Create a tournament
    const tournament = await adminHasyx.insert<any>({
        table: 'badma_tournaments', // Corrected
        object: {
            status: 'await', // Initial status
            type: 'round-robin',
        },
        returning: ['id', 'status', 'type']
    });
    tournamentId = tournament.id;
    expect(tournamentId).toBeDefined();
    expect(tournament.type).toBe('round-robin');
    debug(`Created tournament ${tournamentId} of type ${tournament.type}`);

    // 4. Add users to the tournament
    for (const user of users) {
      await addUserToTournament(adminHasyx, user.id, tournamentId);
      debug(`Added user ${user.id} to tournament ${tournamentId}`);
    }
  }, TEST_TIMEOUT); // Generous timeout for setup

  it('should run a round-robin tournament with 5 AI players', async () => {
    // 5. Create TournamentRoundRobin instance and start it
    // Pass organizer ID to TournamentRoundRobin constructor if needed, or set it globally for the test
    // For now, we assume TournamentRoundRobin will be modified to accept/use it.
    const tournamentHandler = new TournamentRoundRobin(adminHasyx, tournamentId, tournamentOrganizer.id);
    let lastCheckTime = new Date();
    debug(`Starting tournament ${tournamentId} at ${lastCheckTime.toISOString()} by organizer ${tournamentOrganizer.id}`);
    await tournamentHandler.start();

    // Check tournament status after start
    let currentTournament = await adminHasyx.select<any>({
        table: 'badma_tournaments', // Corrected
        pk_columns: { id: tournamentId }, // pk_columns for selecting a single row by primary key
        returning: ['id', 'status']
    });
    expect(currentTournament.status).toBe('continue');
    debug(`Tournament ${tournamentId} status is 'continue'.`);

    // 6. Verify game and join creation
    const gamesInTournament = await adminHasyx.select<Badma_Games[]>({
      table: 'badma_games', // Corrected (assuming 'games' table in 'badma' schema)
      where: { tournament_games: { tournament_id: { _eq: tournamentId } } }, // Adjusted based on expected new relationship
      returning: ['id', 'user_id', { joins: ['id', 'user_id'] }], // Assuming 'joins' is the correct relationship name on games table
    });
    const expectedGames = (5 * 4) / 2; // 10 games for 5 players
    expect(gamesInTournament.length).toBe(expectedGames);
    debug(`Verified ${gamesInTournament.length} games created.`);
    gamesInTournament.forEach(game => {
        expect(game.user_id).toBe(tournamentOrganizer.id); // Verify game creator is the organizer
    });
    
    let totalJoins = 0;
    gamesInTournament.forEach(game => totalJoins += game.joins.length);
    expect(totalJoins).toBe(expectedGames * 2); // Each game has 2 joins
    debug(`Verified ${totalJoins} player joins created across all games.`);

    // 7. Monitor tournament progress
    let tournamentInProgress = true;
    while (tournamentInProgress) {
      await delay(POLLING_INTERVAL);
      const currentTime = new Date();

      currentTournament = await adminHasyx.select<any>({
        table: 'badma_tournaments', // Corrected
        pk_columns: { id: tournamentId },
        returning: ['status']
      });

      if (currentTournament.status !== 'continue') {
        tournamentInProgress = false;
        debug(`Tournament ${tournamentId} status changed to ${currentTournament.status}. Exiting monitoring loop.`);
        break;
      }
      
      const participantStats = await adminHasyx.select<any[]>({
        table: 'badma_tournament_participants', // Corrected
        where: { tournament_id: { _eq: tournamentId }, role: { _eq: 1 } }, 
        returning: [
          'user_id',
          {
            user: ['name'] 
          },
          {
            scores_aggregate: {
              aggregate: { sum: ['score'] }
            }
          },
        ],
        order_by: { user_id: 'asc'}
      });

      const logParts: string[] = [];
      participantStats.forEach(p => {
        const userName = p.user?.name || p.user_id.substring(0,8);
        const totalScore = p.scores_aggregate?.aggregate?.sum?.score || 0;
        logParts.push(`👤 ${userName} 🧮 ${totalScore.toFixed(1)}`);
      });
      
      console.log(`[${currentTime.toLocaleTimeString()}] Tournament ${tournamentId} Progress: ${logParts.join(' | ')}`);
      lastCheckTime = currentTime;
    }

    // 8. Verify all games are finished
    const finalGameStates = await adminHasyx.select<Badma_Games[]>({
      table: 'badma_games', // Corrected
      where: {
        tournament_games: { tournament_id: { _eq: tournamentId } }, // Adjusted
        status: { _nin: ['checkmate', 'stalemate', 'draw', 'white_surrender', 'black_surrender', 'finished'] }
      },
      returning: ['id', 'status']
    });
    expect(finalGameStates.length).toBe(0);
    debug('All tournament games are confirmed finished.');
    expect(currentTournament.status).toBe('finished'); 

    // 9. Get final scores and display
    const finalScores = await adminHasyx.select<any[]>({
        table: 'badma_tournament_participants', // Corrected
        where: { tournament_id: { _eq: tournamentId }, role: { _eq: 1 } },
        returning: [
            'user_id',
            {
                user: ['name']
            },
            {
                scores_aggregate: {
                    aggregate: { 
                        sum: ['score'],
                        count: [] 
                    }
                }
            }
        ],
        order_by: { scores_aggregate: { sum: { score: 'desc' } } } 
    });

    console.log(`
--- Little Tournament (${tournamentId}) Final Results ---
`);
    finalScores.forEach(p => {
        const userName = p.user?.name || p.user_id;
        const totalScore = p.scores_aggregate.aggregate.sum.score || 0;
        const gamesPlayed = p.scores_aggregate.aggregate.count || 0;
        console.log(`🏆 ${userName}: ${totalScore.toFixed(1)} points (${gamesPlayed} games)`);
    });
    console.log(
`---------------------------------------------------
`)

  }, TEST_TIMEOUT);

  afterAll(async () => {
    debug('Cleaning up after little tournament test...');
    // Clean up the organizer user as well if created
    if (tournamentOrganizer && tournamentOrganizer.id) {
      // await adminHasyx.delete({ table: 'users', pk_columns: { id: tournamentOrganizer.id } });
      debug(`Organizer user ${tournamentOrganizer.id} would be deleted here.`);
    }
    // ... existing user cleanup ...
    debug('Test cleanup finished.');
  });
}); 