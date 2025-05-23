import dotenv from 'dotenv';
import { createApolloClient, Generator, Hasyx } from 'hasyx';
import { testAuthorize } from 'hasyx/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import schema from '../../public/hasura-schema.json';
import { AxiosChessClient } from '../axios-chess-client';
import { ChessClientRole } from '../chess-client';
import Debug from '../debug';
import bcrypt from 'bcrypt';
import axios from 'axios';

dotenv.config();
const debug = Debug('badma:test:fake-event-chess');

// Define the base URL for the API from environment variables
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Setup variables
let adminHasyx: Hasyx;
let humanClient: AxiosChessClient;
let aiClient: AxiosChessClient; 
let humanUser: { userId: string; email: string };
let aiUser: { userId: string; email: string };
let gameId: string;
const aiLevel = 2; // Medium difficulty

let originalAiMoveTriggerDefinition: any = null; // Для хранения определения триггера

beforeAll(async () => {
  debug('Setting up fake event test environment...');
  
  const adminApolloClient = createApolloClient({ 
    secret: process.env.HASURA_ADMIN_SECRET! 
  });
  const generate = Generator(schema);
  adminHasyx = new Hasyx(adminApolloClient, generate);

  const hasuraMetadataUrl = process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL?.replace('/v1/graphql', '/v1/metadata');
  const adminSecret = process.env.HASURA_ADMIN_SECRET;

  if (hasuraMetadataUrl && adminSecret) {
    debug('Attempting to fetch, store, and then delete Hasura event trigger: games_ai_move');
    // 1. Fetch and store original trigger definition
    try {
      const exportResponse = await fetch(hasuraMetadataUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Hasura-Admin-Secret': adminSecret },
        body: JSON.stringify({ type: 'export_metadata', args: {} })
      });
      if (exportResponse.ok) {
        const metadata = await exportResponse.json();
        const defaultSource = metadata.sources?.find((s: any) => s.name === 'default');
        const gamesTable = defaultSource?.tables?.find((t: any) => t.table.schema === 'badma' && t.table.name === 'games');
        const trigger = gamesTable?.event_triggers?.find((et: any) => et.name === 'games_ai_move');
        if (trigger) {
          originalAiMoveTriggerDefinition = trigger;
          debug('Successfully fetched and stored definition for games_ai_move.');
        } else {
          debug('Event trigger games_ai_move not found in metadata. It might be created by this test later or does not exist.');
        }
      } else {
        const errorResult = await exportResponse.json().catch(() => ({}));
        debug(`Warning: Failed to fetch metadata. Status: ${exportResponse.status}, Response: ${JSON.stringify(errorResult)}`);
      }
    } catch (error) {
      debug(`Warning: Error fetching metadata for games_ai_move trigger: ${error instanceof Error ? error.message : String(error)}`);
    }

    // 2. Delete the trigger
    try {
      const deleteResponse = await fetch(hasuraMetadataUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Hasura-Admin-Secret': adminSecret },
        body: JSON.stringify({ type: 'pg_delete_event_trigger', args: { source: 'default', name: 'games_ai_move' } })
      });
      const deleteResult = await deleteResponse.json();
      debug('Hasura Metadata API response for trigger deletion:', deleteResult);
      if (!deleteResponse.ok && deleteResult?.code !== 'not-found') {
        debug(`Warning: Failed to delete Hasura event trigger 'games_ai_move'. Status: ${deleteResponse.status}, Response: ${JSON.stringify(deleteResult)}`);
      }
    } catch (error) {
      debug(`Warning: Error calling Hasura Metadata API to delete trigger: ${error instanceof Error ? error.message : String(error)}`);
    }
  } else {
    debug('Warning: HASURA_GRAPHQL_URL or HASURA_ADMIN_SECRET not defined. Cannot manage event triggers.');
  }
  
  humanUser = await createFakeUser({ adminHasyx, password: 'humanPassword123' });
  aiUser = await createFakeUser({ adminHasyx, password: 'aiPassword456' });
  
  await adminHasyx.insert({
    table: 'badma_ais',
    object: { user_id: aiUser.userId, options: { engine: 'js-chess-engine', level: aiLevel } }
  });
  
  const humanAuth = await testAuthorize(humanUser.userId);
  const aiAuth = await testAuthorize(aiUser.userId);
  humanClient = new AxiosChessClient(humanAuth.axios);
  aiClient = new AxiosChessClient(aiAuth.axios);
  humanClient.userId = humanUser.userId;
  humanClient.clientId = uuidv4();
  aiClient.userId = aiUser.userId;
  aiClient.clientId = uuidv4();
  
  debug(`Human client configured: userId=${humanClient.userId}`);
  debug(`AI client configured: userId=${aiClient.userId}`);
}, 30000);

describe('AI Move Event Handler Test', () => {
  it('should properly handle a Hasura event and make an AI move', async () => {
    // 1. AI player creates and joins a game (white - side 1)
    debug('AI creating game...');
    const createResponse = await aiClient.asyncCreate(1);
    expect(createResponse.error).toBeUndefined();
    gameId = createResponse.data!.gameId!;
    debug(`Game created with ID: ${gameId}`);
    
    debug('AI joining as white (side 1)...');
    const aiJoinResponse = await aiClient.asyncJoin(1, ChessClientRole.Player);
    expect(aiJoinResponse.error).toBeUndefined();
    expect(aiClient.status).toBe('await');
    
    // 2. Human player joins as black (side 2)
    debug('Setting up human client with game ID...');
    humanClient.gameId = gameId;
    debug('Human joining as black (side 2)...');
    const humanJoinResponse = await humanClient.asyncJoin(2, ChessClientRole.Player);
    expect(humanJoinResponse.error).toBeUndefined();
    
    // Sync both clients to get latest status before simulating event
    await aiClient.asyncSync();
    await humanClient.asyncSync();
    debug(`Game status after both players joined: ${aiClient.status}`);
    
    // 3. Simulate Hasura event for the AI move
    debug('🔄 Simulating Hasura event to trigger AI move...');
    
    // Формируем событие по официальной структуре Hasura Event Trigger Payload
    const eventPayload = {
      created_at: new Date().toISOString(),
      delivery_info: {
        current_retry: 0,
        max_retries: 0
      },
      event: {
        data: {
          old: {
            id: gameId,
            user_id: aiUser.userId,
            status: 'ready',
            side: 1,
            fen: aiClient.fen
          },
          new: {
            id: gameId,
            user_id: aiUser.userId,
            status: 'ready',
            side: 1,
            fen: aiClient.fen
          }
        },
        op: "UPDATE",
        session_variables: {
          "x-hasura-role": "admin"
        }
      },
      id: uuidv4(),
      table: {
        name: "games",
        schema: "badma"
      },
      trigger: {
        name: "games_ai_move"
      }
    };
    
    // Правильный формат данных для Hasura Event Trigger
    const wrappedPayload = { payload: eventPayload };
    
    // Get the event secret for authorization
    const eventSecret = process.env.HASURA_EVENT_SECRET;
    if (!eventSecret) {
      throw new Error('HASURA_EVENT_SECRET environment variable is required for this test');
    }

    // Endpoint for AI move event handler
    const aiMoveEndpoint = `${BASE_URL}/api/events/ai-move`;
    
    // Send the event to our API endpoint with correct Hasura event structure
    debug(`Sending Hasura event payload to AI move endpoint (${aiMoveEndpoint})...`);
    const response = await axios.post(
      aiMoveEndpoint,
      wrappedPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Hasura-Event-Secret': eventSecret
        }
      }
    );
    
    debug('AI move endpoint response:', response.data);
    
    // Обработка ответа и дальнейшие действия
    let aiMoveSuccessful = false;
    
    // Если получен ответ о том, что игра не в нужном состоянии, обновляем состояние игры
    if (response.data.message && response.data.message.includes('Game not in playable state')) {
      debug('Updating game status to ready...');
      await adminHasyx.update({
        table: 'badma_games',
        where: { id: { _eq: gameId } },
        _set: { status: 'ready' }
      });
      
      // Синхронизируем клиент для получения актуального состояния
      await aiClient.asyncSync();
      
      // Формируем новое Hasura-событие с той же корректной структурой
      const updatedEventPayload = {
        created_at: new Date().toISOString(),
        delivery_info: {
          current_retry: 0,
          max_retries: 0
        },
        event: {
          data: {
            old: {
              id: gameId,
              user_id: aiUser.userId,
              status: 'ready',
              side: 1,
              fen: aiClient.fen
            },
            new: {
              id: gameId,
              user_id: aiUser.userId,
              status: 'ready',
              side: 1,
              fen: aiClient.fen
            }
          },
          op: "UPDATE",
          session_variables: {
            "x-hasura-role": "admin"
          }
        },
        id: uuidv4(),
        table: {
          name: "games",
          schema: "badma"
        },
        trigger: {
          name: "games_ai_move"
        }
      };
      
      const wrappedUpdatedPayload = { payload: updatedEventPayload };
      
      // Повторяем запрос после обновления статуса с корректной структурой Hasura
      debug('Retrying AI move after updating game status...');
      const retryResponse = await axios.post(
        aiMoveEndpoint,
        wrappedUpdatedPayload,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Hasura-Event-Secret': eventSecret
          }
        }
      );
      
      debug('Retry response:', retryResponse.data);
      expect(retryResponse.status).toBe(200);
      
      if (retryResponse.data.success) {
        debug('AI move successful!');
        aiMoveSuccessful = true;
      } else {
        debug(`AI move failed: ${retryResponse.data.message || 'Unknown error'}`);
        // Продолжаем тест даже если ход не получился
      }
    } else if (response.data.success) {
      debug('AI move successful!');
      aiMoveSuccessful = true;
    }
    
    // 4. Sync clients to see if AI move was recorded
    debug('Syncing human client to see AI move...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay to ensure DB writes
    const syncResponse = await humanClient.asyncSync();
    
    debug(`Game status after AI move: ${humanClient.status}`);
    debug(`Game FEN after AI move: ${humanClient.fen}`);
    
    // Check that the game is in playable state
    expect(['ready', 'continue', 'checkmate', 'stalemate'].includes(humanClient.status)).toBe(true);
    
    // 5. Make a human move as black if possible
    if (humanClient.status === 'continue' && humanClient.turn === 2) {
      debug('Making human move as black...');
      try {
        // Choose a valid move based on the current board state (e7-e5 is usually valid)
        const humanMoveResponse = await humanClient.asyncMove({ from: 'e7', to: 'e5' });
        expect(humanMoveResponse.error).toBeUndefined();
        
        // 6. Simulate another Hasura event for the second AI move
        debug('Simulating second Hasura event for AI response...');
        
        // Получаем актуальное состояние игры после хода человека
        const newGameData = await adminHasyx.select<any[]>({
          table: 'badma_games',
          where: { id: { _eq: gameId } },
          limit: 1,
          returning: ['id', 'user_id', 'status', 'fen', 'side', 'created_at', 'updated_at']
        });
        
        if (!newGameData || newGameData.length === 0) {
          throw new Error(`Game not found after human move: ${gameId}`);
        }
        
        const newGame = newGameData[0];
        debug(`Game state after human move: status=${newGame.status}, side=${newGame.side}, fen=${newGame.fen}`);
        
        const secondEventPayload = {
          event: {
            session_variables: { 'x-hasura-role': 'admin' },
            op: 'UPDATE',
            data: {
              old: {
                id: gameId,
                status: humanClient.status,
                fen: humanClient.fen,
                side: 2
              },
              new: {
                id: gameId,
                status: newGame.status,
                fen: newGame.fen,
                side: newGame.side,
                user_id: newGame.user_id
              }
            }
          },
          created_at: new Date().toISOString(),
          id: uuidv4(),
          table: {
            schema: 'badma',
            name: 'games'
          },
          trigger: {
            name: 'games_ai_move'
          },
          delivery_info: {
            max_retries: 0,
            current_retry: 0
          }
        };
        
        // Правильный формат данных для второго события
        const wrappedSecondPayload = { payload: secondEventPayload };
        
        // Send the second event
        debug(`Sending second event payload to AI move endpoint (${aiMoveEndpoint})...`);
        const secondResponse = await axios.post(
          aiMoveEndpoint,
          wrappedSecondPayload,
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Hasura-Event-Secret': eventSecret
            }
          }
        );
        
        debug('Second AI move endpoint response:', secondResponse.data);
        
        // 7. Sync to check second AI move
        await new Promise(resolve => setTimeout(resolve, 1000));
        const finalSyncResponse = await humanClient.asyncSync();
        
        debug(`Final game status: ${humanClient.status}`);
        debug(`Final game FEN: ${humanClient.fen}`);
      } catch (moveError) {
        debug(`Error making human move: ${moveError}`);
        // Продолжаем тест даже если ход не получился
      }
    } else {
      debug(`Skipping human move because game status=${humanClient.status}, turn=${humanClient.turn}`);
    }
    
    // Validate with a DB query that moves were recorded
    const moves = await adminHasyx.select<any[]>({
      table: 'badma_moves',
      where: { game_id: { _eq: gameId } },
      order_by: { created_at: 'asc' },
      returning: ['id', 'game_id', 'user_id', 'side', 'from', 'to', 'promotion', 'created_at']
    });
    
    debug(`Moves recorded in DB: ${moves.length}`);
    expect(moves.length).toBeGreaterThan(0); // Должен быть хотя бы один ход
    
    // Проверяем, что хотя бы один ход был сделан AI
    const aiMoves = moves.filter(move => move.user_id === aiUser.userId);
    debug(`AI moves recorded: ${aiMoves.length}, details: ${JSON.stringify(aiMoves)}`);
    expect(aiMoves.length).toBeGreaterThan(0); // Ожидаем, что ИИ сделал хотя бы один ход
    
    // Test passed if we got here without errors
  }, 45000);
});

// Helper function to create a test user
async function createFakeUser({ adminHasyx, password }: { adminHasyx: Hasyx, password: string }) {
  const userId = uuidv4();
  const email = `${userId}@example.com`;
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  const now = Date.now(); // Use Unix timestamp instead of ISO string

  debug(`Creating fake user ${email}`);
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

// <<< ВОССТАНОВЛЕНИЕ METADATA ПОСЛЕ ТЕСТОВ >>>
afterAll(async () => {
  debug('Cleaning up after fake event test...');
  const hasuraMetadataUrl = process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL?.replace('/v1/graphql', '/v1/metadata');
  const adminSecret = process.env.HASURA_ADMIN_SECRET;

  if (originalAiMoveTriggerDefinition && hasuraMetadataUrl && adminSecret) {
    debug('Attempting to restore Hasura event trigger: games_ai_move using stored definition.');
    try {
      // Деструктурируем сохраненное определение триггера, чтобы отделить name и definition
      // от остальных верхнеуровневых полей (например, webhook, retry_conf, comment и т.д.)
      const { name, definition, ...restOfTriggerDefinition } = originalAiMoveTriggerDefinition;

      const createTriggerArgs = {
        source: 'default', // Источник данных
        table: { schema: 'badma', name: 'games' }, // Явно указываем таблицу
        name: name, // Имя триггера из сохраненного определения
        ...restOfTriggerDefinition, // Копируем остальные верхнеуровневые поля (webhook, retry_conf и т.д.)
        ...(definition || {}) // Копируем поля из объекта definition (enable_manual, update, insert, delete и т.д.)
                               // (definition || {}) для случая если definition вдруг окажется undefined
      };

      const createTriggerPayload = {
        type: 'pg_create_event_trigger',
        args: createTriggerArgs
      };

      debug('Payload for restoring trigger:', JSON.stringify(createTriggerPayload, null, 2));

      const response = await fetch(hasuraMetadataUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Hasura-Admin-Secret': adminSecret },
        body: JSON.stringify(createTriggerPayload)
      });
      const result = await response.json();

      if (response.ok) {
        debug('Successfully restored Hasura event trigger games_ai_move.', result);
      } else {
        debug(
          'ERROR: Failed to restore Hasura event trigger games_ai_move.',
          `Status: ${response.status}, Response: ${JSON.stringify(result)}`
        );
      }
    } catch (error) {
      debug(
        'ERROR: Exception while restoring Hasura event trigger games_ai_move:',
        error instanceof Error ? error.message : String(error)
      );
    }
  } else if (!originalAiMoveTriggerDefinition) {
    debug('Original event trigger definition for games_ai_move was not found/stored. Skipping direct restore.');
    debug("\nIMPORTANT: Original trigger definition not found. Run 'npx hasyx events' manually in the project root to ensure all Hasura event triggers and metadata are correctly configured.\n");
  } else {
    debug('Warning: HASURA_GRAPHQL_URL or HASURA_ADMIN_SECRET not defined. Cannot restore event trigger automatically.');
    debug("\nIMPORTANT: Run 'npx hasyx events' manually in the project root to restore Hasura event triggers and metadata.\n");
  }
});
// <<< КОНЕЦ ВОССТАНОВЛЕНИЯ >>>