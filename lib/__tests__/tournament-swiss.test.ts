import dotenv from 'dotenv';
dotenv.config();

// Убедимся, что WebSocket активирован для теста
if (process.env.NEXT_PUBLIC_WS === undefined) {
  process.env.NEXT_PUBLIC_WS = '1';
  console.log('WebSocket explicitly enabled for test: NEXT_PUBLIC_WS=1');
}

import { createApolloClient } from 'hasyx/lib/apollo/apollo';
import { Generator } from 'hasyx/lib/generator';
import { Hasyx } from 'hasyx/lib/hasyx/hasyx';
import schema from '@/public/hasura-schema.json'; 
import Debug from '@/lib/debug';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { TournamentSwiss } from '@/lib/tournament-swiss';
import { Users } from '@/types/hasura-types';

const debug = Debug('test:tournament-swiss');

const TEST_TIMEOUT = 60 * 60 * 1000; 
const INACTIVITY_TIMEOUT_MS = 60000;
const TOURNAMENT_SIZE = 4;
const SWISS_ROUNDS = 3;

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
      email_verified: now,
      is_admin: isOrganizer, 
      hasura_role: isOrganizer ? 'admin' : 'user', 
      created_at: now,
      updated_at: now,
    },
    returning: ['id']
  });
  // Link credentials in accounts table (new schema)
  await adminHasyx.insert({
    table: 'accounts',
    object: {
      user_id: userId,
      type: 'credentials',
      provider: 'credentials',
      provider_account_id: email,
      credential_hash: hashedPassword,
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

// Helper function to manually process finished games
async function processFinishedGames(adminHasyx: Hasyx, tournamentHandler: TournamentSwiss, gameIds: string[]) {
  const finishedGames = await adminHasyx.select<any[]>({
    table: 'badma_games',
    where: {
      id: { _in: gameIds },
      status: { _in: ['checkmate', 'stalemate', 'draw', 'white_surrender', 'black_surrender', 'finished'] }
    },
    returning: ['id', 'status', 'fen', 'side']
  });

  const processedGames = new Set<string>();

  for (const game of finishedGames) {
    if (!processedGames.has(game.id)) {
      debug(`Processing finished game ${game.id} with status ${game.status}`);
      
      const gameRowForOver = {
        id: game.id,
        status: game.status,
        fen: game.fen,
        side: game.side,
      };
      
      try {
        await tournamentHandler.over(gameRowForOver);
        processedGames.add(game.id);
        debug(`Successfully processed game ${game.id} for tournament`);
      } catch (error) {
        debug(`Error processing game ${game.id}:`, error);
      }
    }
  }

  return processedGames.size;
}

const isLocal = !!+process.env.JEST_LOCAL!;
(!isLocal ? describe : describe.skip)('Tournament Swiss System Test', () => {
  let adminHasyx: Hasyx;
  const users: Users[] = [];
  let tournamentId: string;

  beforeAll(async () => {
    debug('Setting up Swiss tournament test environment...');
    
    const adminApolloClient = createApolloClient({ 
      secret: process.env.HASURA_ADMIN_SECRET!,
      ws: true,
      url: process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL,
    });
    
    const generate = Generator(schema);
    adminHasyx = new Hasyx(adminApolloClient, generate);

    // Create Tournament Organizer user
    tournamentOrganizer = await createFakeUser(adminHasyx, 'Swiss Organizer', true);
    debug(`Created Tournament Organizer: ${tournamentOrganizer.name} (ID: ${tournamentOrganizer.id})`);

    // Create 4 players
    for (let i = 0; i < TOURNAMENT_SIZE; i++) {
      const user = await createFakeUser(adminHasyx, `SwissPlayer${i + 1}`);
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
            type: 'swiss',
        },
        returning: ['id', 'status', 'type', 'user_id']
    });
    tournamentId = tournament.id;
    expect(tournamentId).toBeDefined();
    expect(tournament.type).toBe('swiss');
    debug(`Created tournament ${tournamentId} of type ${tournament.type}`);

    // Add users to the tournament
    for (const user of users) {
      await addUserToTournament(adminHasyx, user.id, tournamentId);
      debug(`Added user ${user.id} to tournament ${tournamentId}`);
    }
  }, TEST_TIMEOUT);

  it('should run a complete Swiss system tournament with multiple rounds', function(done) {
    // Create TournamentSwiss instance and start it
    const tournamentHandler = new TournamentSwiss(adminHasyx, tournamentId, tournamentOrganizer.id, SWISS_ROUNDS);
    debug(`Starting Swiss tournament ${tournamentId} by organizer ${tournamentOrganizer.id}`);
    
    tournamentHandler.start().then(async () => {
      let currentTournament = await adminHasyx.select<any>({
          table: 'badma_tournaments',
          pk_columns: { id: tournamentId },
          returning: ['id', 'status']
      });
      expect(currentTournament.status).toBe('continue');
      debug(`Tournament ${tournamentId} status is 'continue'.`);

      // Get all games in tournament
      const gamesInTournament = await adminHasyx.select<any[]>({
        table: 'badma_games',
        where: { tournament_games: { tournament_id: { _eq: tournamentId } } },
        returning: ['id', 'user_id', { joins: ['id', 'user_id'] }],
      });
      
      // For 4 players, first round should have 2 games
      expect(gamesInTournament.length).toBe(2);
      debug(`Verified ${gamesInTournament.length} games created for first round.`);
      
      gamesInTournament.forEach(game => {
          expect(game.user_id).toBe(tournamentOrganizer.id);
      });
      
      let totalJoins = 0;
      gamesInTournament.forEach(game => game.joins && (totalJoins += game.joins.length));
      expect(totalJoins).toBe(4); // 2 games * 2 players each
      debug(`Verified ${totalJoins} player joins created across all games.`);

      // Setup subscription to monitor all games
      let subscription: any = null;
      let inactivityTimer: NodeJS.Timeout | null = null;
      let isTestCompleted = false;
      let allGameIds: string[] = [];

      function resetInactivityTimer() {
        if (inactivityTimer) clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(async () => {
          const timestamp = Date.now();
          console.log(`\nNo game updates for ${INACTIVITY_TIMEOUT_MS / 1000} seconds. Finalizing Swiss tournament check for ${tournamentId}. (${new Date(timestamp).toISOString()})`);
          
          // Clean up resources
          if (subscription) {
            try {
              subscription.unsubscribe();
              if (adminHasyx && adminHasyx.apolloClient) {
                adminHasyx.apolloClient.stop();
                adminHasyx.apolloClient.clearStore().catch(() => {});
              }
            } catch (unsubError) {
              debug('Error during subscription cleanup in timeout:', unsubError);
            }
            subscription = null;
          }
          inactivityTimer = null;
          
          if (!isTestCompleted) {
            isTestCompleted = true;
            
            // Process any finished games before finalizing
            try {
              const processedCount = await processFinishedGames(adminHasyx, tournamentHandler, allGameIds);
              if (processedCount > 0) {
                debug(`Processed ${processedCount} finished games during timeout`);
              }
              
              // Check final tournament state
              const finalTournament = await adminHasyx.select<any>({
                table: 'badma_tournaments',
                pk_columns: { id: tournamentId },
                returning: ['id', 'status']
              });
              
              // Get final scores
              const finalScores = await adminHasyx.select<any[]>({
                table: 'badma_tournament_participants',
                where: { tournament_id: { _eq: tournamentId }, role: { _eq: 1 } },
                returning: [
                  'user_id',
                  { user: ['name'] },
                  { scores_aggregate: { aggregate: { sum: ['score'] } } }
                ]
              });

              console.log(`\n--- Swiss Tournament ${tournamentId} Final Results ---`);
              finalScores.forEach(p => {
                const userName = p.user?.name || p.user_id;
                const totalScore = p.scores_aggregate?.aggregate?.sum?.score ?? 0;
                console.log(`🏆 ${userName}: ${totalScore.toFixed(1)} points`);
              });
              console.log("---------------------------------------------------");

              expect(finalTournament.status).toBe('finished');
              expect(finalScores.length).toBe(TOURNAMENT_SIZE);
              
              done();
            } catch (err) {
              done(err);
            }
          }
        }, INACTIVITY_TIMEOUT_MS);
      }

      try {
        // Subscribe to all tournament games
        const gameUpdatesObservable = adminHasyx.subscribe<any[]>({
          table: 'badma_games',
          where: { tournament_games: { tournament_id: { _eq: tournamentId } } },
          returning: ['id', 'status', 'fen'],
          ws: true
        });
        
        subscription = gameUpdatesObservable.subscribe({
          next: async (updatedGames: any[] | any) => {
            const timestamp = Date.now();
            resetInactivityTimer();
            
            const gamesArray = Array.isArray(updatedGames) ? updatedGames : [updatedGames];
            allGameIds = gamesArray.map(g => g.id);
            
            console.log(`\nSwiss tournament ${tournamentId} update (${new Date(timestamp).toISOString()}):`);
            gamesArray.forEach(game => {
              console.log(`  Game ${game.id} status ${game.status}`);
            });
            
            // Process finished games
            const processedCount = await processFinishedGames(adminHasyx, tournamentHandler, allGameIds);
            if (processedCount > 0) {
              debug(`Processed ${processedCount} finished games`);
            }
            
            // Check if tournament is complete
            const allCurrentGames = await adminHasyx.select<any[]>({
              table: 'badma_games',
              where: { tournament_games: { tournament_id: { _eq: tournamentId } } },
              returning: ['id', 'status']
            });
            
            const allGamesConcluded = allCurrentGames.every(g => 
              ['checkmate', 'stalemate', 'draw', 'white_surrender', 'black_surrender', 'finished'].includes(g.status)
            );

            // Check if we have expected number of games for all rounds
            const expectedTotalGames = SWISS_ROUNDS * Math.floor(TOURNAMENT_SIZE / 2);
            const hasAllGames = allCurrentGames.length >= expectedTotalGames;

            if (allGamesConcluded && hasAllGames) {
              debug(`All games in Swiss tournament ${tournamentId} have concluded. Total games: ${allCurrentGames.length}/${expectedTotalGames}`);
              
              if (inactivityTimer) {
                clearTimeout(inactivityTimer);
                inactivityTimer = null;
              }
              
              if (subscription) {
                try {
                  subscription.unsubscribe();
                  if (adminHasyx && adminHasyx.apolloClient) {
                    adminHasyx.apolloClient.stop();
                    adminHasyx.apolloClient.clearStore().catch(() => {});
                  }
                } catch (unsubError) {
                  debug('Error during subscription cleanup:', unsubError);
                }
                subscription = null;
              }
              
              if (!isTestCompleted) {
                isTestCompleted = true;
                
                // Final checks
                const finalTournament = await adminHasyx.select<any>({
                  table: 'badma_tournaments',
                  pk_columns: { id: tournamentId },
                  returning: ['id', 'status']
                });
                
                const finalScores = await adminHasyx.select<any[]>({
                  table: 'badma_tournament_participants',
                  where: { tournament_id: { _eq: tournamentId }, role: { _eq: 1 } },
                  returning: [
                    'user_id',
                    { user: ['name'] },
                    { scores_aggregate: { aggregate: { sum: ['score'] } } }
                  ]
                });

                console.log(`\n--- Swiss Tournament ${tournamentId} Final Results ---`);
                finalScores.forEach(p => {
                  const userName = p.user?.name || p.user_id;
                  const totalScore = p.scores_aggregate?.aggregate?.sum?.score ?? 0;
                  console.log(`🏆 ${userName}: ${totalScore.toFixed(1)} points`);
                });
                console.log("---------------------------------------------------");

                expect(finalTournament.status).toBe('finished');
                expect(finalScores.length).toBe(TOURNAMENT_SIZE);
                expect(allCurrentGames.length).toBe(expectedTotalGames);
                
                done();
              }
            }
          },
          error: (err) => {
            console.error(`Swiss tournament subscription error:`, err);
            
            if (inactivityTimer) {
              clearTimeout(inactivityTimer);
              inactivityTimer = null;
            }
            if (subscription) {
              try {
                subscription.unsubscribe();
                if (adminHasyx && adminHasyx.apolloClient) {
                  adminHasyx.apolloClient.stop();
                  adminHasyx.apolloClient.clearStore().catch(() => {});
                }
              } catch (unsubError) {
                debug('Error during subscription cleanup:', unsubError);
              }
              subscription = null;
            }
            
            if (!isTestCompleted) {
              isTestCompleted = true;
              done(err);
            }
          },
          complete: () => {
            debug('Swiss tournament subscription completed.');
            if (inactivityTimer) {
              clearTimeout(inactivityTimer);
              inactivityTimer = null;
            }
            
            if (!isTestCompleted) {
              isTestCompleted = true;
              done();
            }
          }
        });
        
        resetInactivityTimer();
      } catch (subscriptionError) {
        console.error(`Failed to set up Swiss tournament subscription:`, subscriptionError);
        
        if (inactivityTimer) {
          clearTimeout(inactivityTimer);
          inactivityTimer = null;
        }
        if (subscription) {
          try {
            subscription.unsubscribe();
            if (adminHasyx && adminHasyx.apolloClient) {
              adminHasyx.apolloClient.stop();
              adminHasyx.apolloClient.clearStore().catch(() => {});
            }
          } catch (unsubError) {
            debug('Error during subscription cleanup:', unsubError);
          }
          subscription = null;
        }
        
        if (!isTestCompleted) {
          isTestCompleted = true;
          done(subscriptionError);
        }
      }
    }).catch(startError => {
      console.error(`Error starting Swiss tournament: ${startError}`);
      done(startError);
    });
  }, TEST_TIMEOUT);

  afterAll(async () => {
    debug('Cleaning up after Swiss tournament test...');
    
    try {
      if (adminHasyx && adminHasyx.apolloClient) {
        debug('Closing Apollo client connections...');
        
        // Сначала останавливаем все активные подписки
        await adminHasyx.apolloClient.stop();
        
        // Очищаем кэш и закрываем соединения
        await adminHasyx.apolloClient.clearStore();
        
        // Принудительно закрываем WebSocket соединения
        const link = (adminHasyx.apolloClient as any).link;
        if (link) {
          if (link.subscriptionClient) {
            debug('Closing subscription client...');
            link.subscriptionClient.close();
          }
          
          if (link.left && link.left.subscriptionClient) {
            debug('Closing split link subscription client...');
            link.left.subscriptionClient.close();
          }
          
          let currentLink = link;
          while (currentLink) {
            if (currentLink.subscriptionClient) {
              debug('Closing chained subscription client...');
              currentLink.subscriptionClient.close();
            }
            currentLink = currentLink.request ? currentLink.request.link : null;
          }
        }
        
        debug('Apollo client stopped successfully');
      }
    } catch (err) {
      debug('Error during Apollo client cleanup:', err);
    }
    
    // Принудительно очищаем все активные таймеры
    try {
      for (let i = 1; i <= 10000; i++) {
        clearTimeout(i);
        clearInterval(i);
      }
      debug('Cleared all timers');
    } catch (err) {
      debug('Error during timer cleanup:', err);
    }
    
    debug('Swiss tournament test cleanup finished.');
  }, TEST_TIMEOUT);
}); 