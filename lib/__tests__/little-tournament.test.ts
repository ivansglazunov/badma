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
import { TournamentRoundRobin } from '@/lib/tournament-round-robin';
import { Badma_Games, Badma_Tournament_Participants, Users, Badma_Tournament_Scores_Aggregate } from '@/types/hasura-types';
import { Subscription as ZenSubscription } from 'zen-observable-ts';
import { Chess } from '../chess';

const debug = Debug('test:little-tournament');

const TEST_TIMEOUT = 60 * 60 * 1000; 
const INACTIVITY_TIMEOUT_MS = 60000;
const LITTLE_TOURNAMENT_SIZE = 4;

let tournamentOrganizer: Users;

// Helper function to create a test user
async function createFakeUser(adminHasyx: Hasyx, namePrefix: string = 'TestUser', isOrganizer: boolean = false) {
  const userId = uuidv4();
  const email = `${namePrefix.toLowerCase().replace(/\s+/g, '-')}-${userId.substring(0, 4)}@example.com`;
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash('password123', saltRounds);
  const now = Date.now(); // Use Unix timestamp (number)

  const result = await adminHasyx.insert<Users>({
    table: 'users', // This is correct, as it's in public schema
    object: {
      id: userId,
      name: `${namePrefix} ${userId.substring(0, 4)}`,
      email: email,
      password: hashedPassword,
      email_verified: now, // Unix timestamp
      is_admin: isOrganizer, 
      hasura_role: isOrganizer ? 'admin' : 'user', 
      created_at: now, // Unix timestamp
      updated_at: now, // Unix timestamp
    },
    returning: ['id']
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

// Define interfaces for subscription data and reporting
interface TournamentGameSubscribedData {
  id: string;
  status: string;
  fen: string | null; // FEN is needed for the report
}

// Функция для конвертации строковой даты в unixtime (миллисекунды с 1970)
function dateToUnixtime(dateValue: string | number): number {
  if (!dateValue) return 0;
  // If it's already a number (Unix timestamp), return as is
  if (typeof dateValue === 'number') return dateValue;
  // If it's a string, convert to Unix timestamp
  return new Date(dateValue).getTime();
}

interface MoveData {
    id: string;
    user_id: string;
    from: string;   // Заменяем move на from
    to: string;     // Добавляем поле to
    promotion?: string | null; // Добавляем опциональное поле promotion
    created_at: number; // Using Unix timestamp (number) everywhere in project
}

interface JoinData {
    side: number;
}

interface ParticipantScoreData extends Omit<Badma_Tournament_Participants, 'scores_aggregate' | 'user'> {
  user?: Partial<Users>; // Make user and its properties optional for the report
  scores_aggregate?: Badma_Tournament_Scores_Aggregate; 
}

// Moved finalizeTournamentCheck outside and before the test case
// It needs access to adminHasyx, tournamentId, gameIdsInThisTournament (passed as args)
async function finalizeTournamentCheck(
  adminHasyxInstance: Hasyx, 
  currentTournamentId: string, 
  gameIds: string[],
  currentTestTournament: any // To update and check its status
): Promise<void> {
  debug(`Finalizing tournament ${currentTournamentId} check.`);
  
  // Wait for potential final updates before checking
  debug('Waiting for any final tournament updates to propagate...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  let updatedTournament = await adminHasyxInstance.select<any>({
    table: 'badma_tournaments',
    pk_columns: { id: currentTournamentId },
    returning: ['id', 'status']
  });
  debug(`Initial tournament status: ${updatedTournament.status}`);

  const allTournamentGames = await adminHasyxInstance.select<TournamentGameSubscribedData[]>({
    table: 'badma_games',
    where: { id: { _in: gameIds } },
    returning: ['id', 'status', 'fen'],
  });

  const unfinishedGames = allTournamentGames.filter(game => 
    !['checkmate', 'stalemate', 'draw', 'white_surrender', 'black_surrender', 'finished'].includes(game.status)
  );

  if (unfinishedGames.length > 0) {
    let reportMessage = `\n--- Отчет по незавершенным играм турнира ${currentTournamentId} ---\n`;
    
    for (const game of unfinishedGames) {
      reportMessage += `  Игра ${game.id} статус: ${game.status}, FEN: ${game.fen ? 'присутствует' : 'отсутствует'}\n`;
            
      if (game.fen) {
        try {
          const chess = new Chess();
          chess.load(game.fen);
          const turn = chess.turn; // Access as a getter
          reportMessage += `    Согласно FEN, ожидается ход: ${turn === 1 ? 'White (белые)' : 'Black (черные)'}\n`;
        } catch (e) {
          reportMessage += `    Ошибка анализа FEN для игры ${game.id}: ${(e as Error).message}\n`;
        }
      }

      const lastMoveData = await adminHasyxInstance.select<MoveData[]>({
        table: 'badma_moves',
        where: { game_id: { _eq: game.id } },
        order_by: { created_at: 'desc' },
        limit: 1,
        returning: ['id', 'user_id', 'from', 'to', 'promotion', 'created_at'] 
      });

      if (lastMoveData && lastMoveData.length > 0) {
        const lastMove = lastMoveData[0];
        // Конвертируем дату создания хода в unixtime для отображения
        const moveTimestamp = dateToUnixtime(lastMove.created_at);
        const joinRecord = await adminHasyxInstance.select<JoinData[]>({
            table: 'badma_joins',
            where: { game_id: { _eq: game.id }, user_id: { _eq: lastMove.user_id }},
            limit: 1,
            returning: ['side']
        });
        if (joinRecord && joinRecord.length > 0) {
             const side = joinRecord[0].side === 1 ? 'White (белые)' : joinRecord[0].side === 2 ? 'Black (черные)' : 'Неизвестная сторона';
             reportMessage += `    Согласно badma_moves, последний ход (${lastMove.from}-${lastMove.to}${lastMove.promotion ? ' promotion:'+lastMove.promotion : ''} id: ${lastMove.id}) сделал user: ${lastMove.user_id.substring(0,6)} (${side}) в ${new Date(moveTimestamp).toISOString()} (unixtime: ${moveTimestamp})\n`;
        } else {
            reportMessage += `    Не удалось определить сторону для последнего хода (user: ${lastMove.user_id.substring(0,6)})\n`;
        }
      } else {
        reportMessage += `    Нет ходов в таблице badma_moves для игры ${game.id}\n`;
      }
    }
    
    console.log(reportMessage);
  }

  const finalScoresData = await adminHasyxInstance.select<ParticipantScoreData[]>({
      table: 'badma_tournament_participants',
      where: { tournament_id: { _eq: currentTournamentId }, role: { _eq: 1 } },
      returning: [
          'user_id',
          { user: ['name'] },
          { scores_aggregate: { aggregate: { sum: ['score'], count: [] } } }
      ],
      order_by: [{ scores_aggregate: { sum: { score: 'desc_nulls_last' } } }]
  });

  let resultsMessage = `\n--- Little Tournament (${currentTournamentId}) Final Results ---\n`;
  if (finalScoresData && finalScoresData.length > 0) {
      finalScoresData.forEach(p => {
          const userName = p.user?.name || p.user_id;
          const totalScore = p.scores_aggregate?.aggregate?.sum?.score ?? 0;
          const gamesPlayed = p.scores_aggregate?.aggregate?.count ?? 0;
          resultsMessage += `🏆 ${userName}: ${totalScore.toFixed(1)} points (${gamesPlayed} games)\n`;
      });
  } else {
      resultsMessage += "Не удалось получить данные по рейтингам.\n";
  }
  resultsMessage += "---------------------------------------------------\n";
  console.log(resultsMessage);

  const gamesStillNotFinished = await adminHasyxInstance.select<Badma_Games[]>({
    table: 'badma_games',
    where: {
      id: { _in: gameIds },
      status: { _nin: ['checkmate', 'stalemate', 'draw', 'white_surrender', 'black_surrender', 'finished'] }
    },
    returning: ['id', 'status']
  });
        
  // Добавляем ещё одну задержку для уверенности, что все асинхронные операции завершились
  debug('Waiting for tournament status to settle before final check...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Повторно запрашиваем статус турнира непосредственно перед проверкой
  updatedTournament = await adminHasyxInstance.select<any>({
    table: 'badma_tournaments',
    pk_columns: { id: currentTournamentId },
    returning: ['id', 'status']
  });
  debug(`Final tournament status check: ${updatedTournament.status}`);
  
  // Повторно проверяем игры после дополнительного ожидания
  const finalGameCheck = await adminHasyxInstance.select<Badma_Games[]>({
    table: 'badma_games',
    where: {
      id: { _in: gameIds },
      status: { _nin: ['checkmate', 'stalemate', 'draw', 'white_surrender', 'black_surrender', 'finished'] }
    },
    returning: ['id', 'status']
  });
        
  if (updatedTournament.status !== 'finished' && finalGameCheck.length > 0) {
       debug(`WARNING: Tournament status is ${updatedTournament.status} and ${finalGameCheck.length} games are not finished. Test might fail based on assertions.`);
       console.log(`⚠️ Tournament may not be complete yet. Status: ${updatedTournament.status}, Unfinished games: ${finalGameCheck.length}`);
  }

  expect(updatedTournament.status).toBe('finished'); 
  expect(finalGameCheck.length).toBe(0);
  debug('All tournament games are confirmed finished (final check).');
}

describe('Little Round Robin Tournament Test', () => {
  let adminHasyx: Hasyx;
  const users: Users[] = [];
  let tournamentId: string;

  beforeAll(async () => {
    debug('Setting up little tournament test environment...');
    
    // Создаем универсальный клиент Apollo с поддержкой WebSocket
    const adminApolloClient = createApolloClient({ 
      secret: process.env.HASURA_ADMIN_SECRET!,
      ws: true, // Включаем поддержку WebSocket для универсального клиента
      url: process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL, // Явно указываем URL
    });
    
    const generate = Generator(schema);
    adminHasyx = new Hasyx(adminApolloClient, generate);

    // Create Tournament Organizer user
    tournamentOrganizer = await createFakeUser(adminHasyx, 'Tournament Organizer', true);
    debug(`Created Tournament Organizer: ${tournamentOrganizer.name} (ID: ${tournamentOrganizer.id})`);

    // 1. Create 5 players
    for (let i = 0; i < LITTLE_TOURNAMENT_SIZE; i++) {
      const user = await createFakeUser(adminHasyx, `TourneyPlayer${i + 1}`);
      users.push(user);
      // 2. Add AI config: first player level 3, others level 1
      const aiLevel = (i === 0) ? 3 : 1;
      await addAiConfig(adminHasyx, user.id, aiLevel);
      debug(`Created user ${user.name} (ID: ${user.id}) with AI level ${aiLevel}`);
    }
    expect(users.length).toBe(LITTLE_TOURNAMENT_SIZE);

    // 3. Create a tournament
    const tournament = await adminHasyx.insert<any>({
        table: 'badma_tournaments', // Corrected
        object: {
            user_id: tournamentOrganizer.id, // Add the required user_id field
            status: 'await', // Initial status
            type: 'round-robin',
        },
        returning: ['id', 'status', 'type', 'user_id']
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
  }, TEST_TIMEOUT);

  it('should run a round-robin tournament with AI players', function(done) {
    // Принимаем параметр done, чтобы сигнализировать о завершении теста
    
    // 5. Create TournamentRoundRobin instance and start it
    const tournamentHandler = new TournamentRoundRobin(adminHasyx, tournamentId, tournamentOrganizer.id);
    debug(`Starting tournament ${tournamentId} by organizer ${tournamentOrganizer.id}`);
    
    tournamentHandler.start().then(async () => {
      let currentTournament = await adminHasyx.select<any>({
          table: 'badma_tournaments',
          pk_columns: { id: tournamentId },
          returning: ['id', 'status']
      });
      expect(currentTournament.status).toBe('continue');
      debug(`Tournament ${tournamentId} status is 'continue'.`);

      // Получаем игры и связи
      const gamesInTournament = await adminHasyx.select<Badma_Games[]>({
        table: 'badma_games',
        where: { tournament_games: { tournament_id: { _eq: tournamentId } } },
        returning: ['id', 'user_id', { joins: ['id', 'user_id'] }],
      });
      
      const expectedGames = (LITTLE_TOURNAMENT_SIZE * (LITTLE_TOURNAMENT_SIZE - 1)) / 2;
      expect(gamesInTournament.length).toBe(expectedGames);
      debug(`Verified ${gamesInTournament.length} games created.`);
      
      gamesInTournament.forEach(game => {
          expect(game.user_id).toBe(tournamentOrganizer.id);
      });
      
      let totalJoins = 0;
      gamesInTournament.forEach(game => game.joins && (totalJoins += game.joins.length));
      expect(totalJoins).toBe(expectedGames * 2);
      debug(`Verified ${totalJoins} player joins created across all games.`);

      // Подготовка для мониторинга игр
      let inactivityTimer: NodeJS.Timeout | null = null;
      let subscription: ZenSubscription | null = null;
      const gameIdsInThisTournament = gamesInTournament.map(g => g.id);
      const updateTimes: number[] = []; // Временные метки обновлений
      const gameUpdates: Record<string, any[]> = {}; // Хранение обновлений по играм
      
      if (gameIdsInThisTournament.length === 0) {
        debug("No games found for this tournament. Test failed.");
        done(new Error("No games found for this tournament"));
        return;
      }
      
      function resetInactivityTimer() {
        if (inactivityTimer) clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
          const timestamp = Date.now();
          console.log(`\nNo game updates for ${INACTIVITY_TIMEOUT_MS / 1000} seconds. Finalizing tournament check for ${tournamentId}. (${new Date(timestamp).toISOString()}, unixtime: ${timestamp})`);
          if (subscription) subscription.unsubscribe();
          finalizeTournamentCheck(adminHasyx, tournamentId, gameIdsInThisTournament, currentTournament)
            .then(() => done()) // Вызываем done() при успешном завершении
            .catch(err => done(err)); // Или передаем ошибку, если есть
        }, INACTIVITY_TIMEOUT_MS);
      }
      
      debug(`Subscribing to game updates for tournament ${tournamentId} (games: ${gameIdsInThisTournament.join(', ')})`);
      
      try {
        // Диагностическая информация перед созданием подписки
        debug(`Создание подписки WebSocket: adminHasyx инициализирован с ws:true, URL: ${process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL}`);
        debug(`Подписка на игры турнира: ${gameIdsInThisTournament.join(', ').substring(0, 50)}...`);
        
        // Явно указываем параметр ws: true для запроса WebSocket подписки
        const gameUpdatesObservable = adminHasyx.subscribe<TournamentGameSubscribedData[]>({
          table: 'badma_games',
          where: { id: { _in: gameIdsInThisTournament } },
          returning: ['id', 'status', 'fen'],
          ws: true // Принудительно используем WebSocket режим
        });
        
        subscription = gameUpdatesObservable.subscribe({
          next: (updatedGames: TournamentGameSubscribedData[] | TournamentGameSubscribedData) => {
            const timestamp = Date.now(); // Текущее время в unixtime (мс)
            updateTimes.push(timestamp);
            resetInactivityTimer();
            
            const gamesArray = Array.isArray(updatedGames) ? updatedGames : [updatedGames];
  
            // Собираем все сообщения в одну строку вместо множественных console.log
            let updateMessage = `\nОбновление состояния турнира ${tournamentId} (${new Date(timestamp).toISOString()}, unixtime: ${timestamp}):\n`;
            
            gamesArray.forEach(game => {
              if (gameIdsInThisTournament.includes(game.id)) {
                // Сохраняем обновления для каждой игры с unixtime меткой
                gameUpdates[game.id] = gameUpdates[game.id] || [];
                gameUpdates[game.id].push({ ...game, timestamp });
                
                // Добавляем информацию об игре в общее сообщение
                updateMessage += `  Игра ${game.id} статус ${game.status}\n`;
              }
            });
            
            // Выводим всю информацию одним вызовом console.log
            console.log(updateMessage);
            
            // Проверяем, все ли игры завершены
            adminHasyx.select<TournamentGameSubscribedData[]>({
                table: 'badma_games',
                where: { id: { _in: gameIdsInThisTournament } },
                returning: ['id', 'status']
            }).then(allCurrentGamesInTournament => {
                const allGamesConcluded = allCurrentGamesInTournament.every(g => 
                    ['checkmate', 'stalemate', 'draw', 'white_surrender', 'black_surrender', 'finished'].includes(g.status)
                );
  
                if (allGamesConcluded) {
                    debug(`All games in tournament ${tournamentId} have concluded based on subscription update and re-fetch.`);
                    
                    // Add a short delay to ensure all database operations have completed
                    setTimeout(() => {
                        if (inactivityTimer) clearTimeout(inactivityTimer);
                        if (subscription) subscription.unsubscribe();
                        finalizeTournamentCheck(adminHasyx, tournamentId, gameIdsInThisTournament, currentTournament)
                          .then(() => done())
                          .catch(err => done(err));
                    }, 2000); // Wait 2 seconds before final check
                }
            }).catch(err => {
                console.error(`Error re-fetching game statuses during subscription update for tournament ${tournamentId}:`, err);
            });
          },
          error: (err) => {
            console.error(`Subscription error for tournament ${tournamentId}:`, err);
            // Дополнительная диагностика ошибки WebSocket
            if (err instanceof Error) {
              console.error('Error message:', err.message);
              console.error('Error stack:', err.stack);
              
              // Проверяем наличие специфичных для ApolloError полей
              if ('graphQLErrors' in err) {
                console.error('GraphQL Errors:', JSON.stringify((err as any).graphQLErrors));
              }
              if ('networkError' in err) {
                console.error('Network Error:', (err as any).networkError);
              }
            }
            if (typeof inactivityTimer !== 'undefined' && inactivityTimer) {
              clearTimeout(inactivityTimer);
            }
            done(err); // Завершаем тест с ошибкой
          },
          complete: () => {
            debug(`Subscription completed for tournament ${tournamentId}. This is usually due to server-side termination or manual unsubscribe.`);
            if (typeof inactivityTimer !== 'undefined' && inactivityTimer) {
              clearTimeout(inactivityTimer);
            }
            
            // Проверяем, не завершен ли тест уже (из другого места)
            if (currentTournament.status === 'continue') {
              finalizeTournamentCheck(adminHasyx, tournamentId, gameIdsInThisTournament, currentTournament)
                .then(() => done())
                .catch(err => done(err));
            }
          }
        });
        
        // Запускаем таймер неактивности
        resetInactivityTimer();
      } catch (subscriptionError) {
        // Расширенное логирование ошибки при создании подписки
        console.error(`Failed to set up subscription:`, subscriptionError);
        if (subscriptionError instanceof Error) {
          console.error('Error message:', subscriptionError.message);
          console.error('Error stack:', subscriptionError.stack);
        }
        
        // Очищаем таймер только если он уже был инициализирован
        if (typeof inactivityTimer !== 'undefined' && inactivityTimer) {
          clearTimeout(inactivityTimer);
        }
        
        done(subscriptionError);
      }
    }).catch(startError => {
      console.error(`Error starting tournament: ${startError}`);
      done(startError);
    });
  }, TEST_TIMEOUT); // Увеличиваем таймаут для теста

  afterAll(async () => {
    debug('Cleaning up after little tournament test...');
    
    // Закрываем все активные подписки
    debug('Closing any active subscriptions...');
    // Доступ к клиенту Apollo через внутреннее свойство Hasyx
    try {
      // Явно закрываем клиент Apollo, если существует
      if (adminHasyx && adminHasyx.apolloClient) {
        debug('Closing Apollo client connections...');
        // @ts-ignore - обращаемся напрямую к методу stop клиента Apollo
        if (adminHasyx.apolloClient.stop) {
          // @ts-ignore
          await adminHasyx.apolloClient.stop();
          debug('Apollo client stopped successfully');
        } else if (adminHasyx.apolloClient.clearStore) {
          // @ts-ignore
          await adminHasyx.apolloClient.clearStore();
          debug('Apollo client store cleared');
        }
      }
    } catch (err) {
      debug('Error during Apollo client cleanup:', err);
    }
    
    // Очищаем глобальные таймеры, если они установлены
    debug('Cleaning up any remaining timers...');
    
    // В Node.js нет стандартного способа получить список всех активных таймеров
    // Поэтому мы создаем еще один таймер с функцией, которая очистится после завершения теста
    setTimeout(() => {
      debug('Final timer cleanup executed');
    }, 1000);
    
    // Clean up the organizer user as well if created
    if (tournamentOrganizer && tournamentOrganizer.id) {
      debug(`Organizer user ${tournamentOrganizer.id} would be deleted here.`);
    }
    
    debug('Test cleanup finished.');
  }, TEST_TIMEOUT);
}); 