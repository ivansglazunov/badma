import dotenv from 'dotenv';
dotenv.config(); // Добавляем загрузку переменных окружения

import { createApolloClient, Generator, Hasyx } from 'hasyx';
import { hasyxEvent, HasuraEventPayload } from 'hasyx/lib/events'; // <<< Возвращаем импорт hasyxEvent
import schema from '../../../../public/hasura-schema.json';
import Debug from '../../../../lib/debug';
import { ChessClientRole, ChessClientSide, ChessClientStatus } from '../../../../lib/chess-client';
import { v4 as uuidv4 } from 'uuid';
import { go } from '../../../../lib/go';
import { HasyxChessServer } from '../../../../lib/hasyx-chess-server';
import { Chess } from '../../../../lib/chess'; // <<< ДОБАВИТЬ ИМПОРТ
// import { LocalChessClient } from '../../../../lib/local-chess-client'; // LocalChessClient здесь не нужен
import { Badma_Games } from '@/types/hasura-types';

const debug = Debug('event:ai-move');

// Типы для данных внутри event.data, специфичные для badma_games
interface BadmaGameData {
  id: string;
  fen: string;
  status: string;
  side: number;
  user_id: string;
}

interface AiConfig {
  id: string;
  user_id: string;
  options: {
    engine?: string;
    level?: number;
  };
}

interface JoinRecord {
  id: string;
  user_id: string;
  game_id: string;
  side: number;
  role: number;
}

interface AiMoveResult {
  from: string;
  to: string;
  promotion?: string | null;
}

/**
 * AI Move Event Handler
 * Process chess AI moves when a game state changes (using hasyxEvent wrapper)
 */
export const POST = hasyxEvent(async (eventPayload: HasuraEventPayload) => {
  // Убираем ручную проверку секрета и парсинг body.payload, так как это делает hasyxEvent
  /*
  debug('🔔 Raw AI move event trigger received');
  let eventPayload: HasuraEventPayloadStructure;
  try {
    // 1. Проверяем секрет события Hasura
    // ... (код проверки секрета) ...
    // 2. Парсим тело запроса и извлекаем данные из ключа 'payload'
    // ... (код парсинга body.payload) ...
  } catch (error) {
    // ... (обработка ошибок парсинга) ...
  }
  */

  // --- НАЧАЛО ЛОГИКИ ОБРАБОТЧИКА (теперь внутри hasyxEvent) ---
  // Логика остается почти той же, но используем eventPayload напрямую
  try {
    const { table, event } = eventPayload;
    const { op, data } = event;
    const gameData = data.new as BadmaGameData;
    
    debug(`🔍 Game data received: id=${gameData.id}, status=${gameData.status}, fen=${gameData.fen ? 'present' : 'missing'}`);
    
    // Проверки остаются теми же
    if (table.schema !== 'badma' || table.name !== 'games' || !['INSERT', 'UPDATE'].includes(op)) {
      debug(`⚠️ Skipping: Not a relevant event. Table: ${table.schema}.${table.name}, Op: ${op}`);
      return { success: true, message: 'Skipped: Not a relevant event type for AI move processing (expected INSERT/UPDATE on badma.games)' }; 
    }
    
    if (gameData.status !== 'ready' && gameData.status !== 'continue') {
      debug(`⚠️ Skipping: Game not in playable state (status: ${gameData.status})`);
      return { success: true, message: 'No AI move needed: Game not in playable state' };
    }
    
    // <<< ОПРЕДЕЛЯЕМ ХОД НАПРЯМУЮ ИЗ FEN >>>
    if (!gameData.fen) {
        debug('⚠️ Skipping: FEN is missing in game data.');
        return { success: true, message: 'Skipped: FEN missing' };
    }
    const tempChessForTurn = new Chess(); 
    tempChessForTurn.load(gameData.fen);
    const currentSide = tempChessForTurn.turn; // Используем FEN для определения текущего хода
    debug(`🎮 Current turn determined from FEN: ${currentSide} (${currentSide === 1 ? 'White' : 'Black'})`);

    // Создание клиентов и запросы остаются теми же
    const adminClient = createApolloClient({ 
      secret: process.env.HASURA_ADMIN_SECRET as string 
    });
    const generate = Generator(schema);
    const hasyx = new Hasyx(adminClient, generate);

    hasyx.debug({ 
      route: '/api/events/ai-move', 
      request: eventPayload, 
      response: null 
    });
    
    // --- Запрос к badma_joins --- 
    const joins = await hasyx.select<JoinRecord[]>({
      table: 'badma_joins',
      where: { 
        game_id: { _eq: gameData.id }, 
        side: { _eq: currentSide },
        role: { _eq: ChessClientRole.Player }  
      },
      order_by: { created_at: 'desc' },
      limit: 1,
      returning: ['id', 'user_id', 'game_id', 'side', 'role', 'created_at']
    });
    
    if (!joins || joins.length === 0) {
      debug(`🔴 CRITICAL: No join record found for game ${gameData.id} and side ${currentSide}. Cannot determine AI user.`);
      return { success: true, message: 'No AI move needed: No join record for current side' };
    }
    
    const join = joins[0];
    const userId = join.user_id;
    debug(`👤 User ID for current turn (from join record ${join.id} with side ${join.side}): ${userId}`);
    
    // --- Запрос к badma_ais --- 
    debug(`🤖 Attempting to fetch AI config for user_id: ${userId}`);
    const aiConfigs = await hasyx.select<AiConfig[]>({
      table: 'badma_ais',
      where: { user_id: { _eq: userId } },
      limit: 1,
      returning: ['id', 'user_id', 'options']
    });
    
    if (!aiConfigs || aiConfigs.length === 0) {
      debug(`⚠️ No AI configuration found for user ${userId}. Check badma_ais table.`);
      return { success: true, message: `No AI move needed: User ${userId} has no AI configuration` };
    }
    
    const aiConfig = aiConfigs[0];
    debug(`🤖 Found AI configuration: ${JSON.stringify(aiConfig.options)}`);
    
    const chessServer = new HasyxChessServer(hasyx);
    
    debug('🎲 Making AI move directly with HasyxChessServer');
    const engine = aiConfig.options?.engine || 'js-chess-engine';
    const level = aiConfig.options?.level || 0;
    debug(`🧠 Using AI engine: ${engine}, level: ${level}`);
    
    let aiMove: AiMoveResult | null = null;
    let moveResult: ChessServerResponse = { error: 'AI did not attempt a move' }; // Initialize with an error
    let successfulMove = false;
    const MAX_ATTEMPTS = 3;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      hasyx.debug({ 
        route: '/api/events/ai-move', 
        gameId: gameData.id, 
        userId: userId,
        attempt: attempt,
        message: `Attempting to get AI move via go(). FEN: ${gameData.fen}, Level: ${level}` 
      });
      try {
          aiMove = go(gameData.fen, level);
          hasyx.debug({ route: '/api/events/ai-move', gameId: gameData.id, userId: userId, attempt: attempt, message: 'AI move suggested by go()', data: aiMove });
      } catch (goError: any) {
          debug(`❌ Error during go() execution (attempt ${attempt}/${MAX_ATTEMPTS}): ${goError.message}`);
          hasyx.debug({ 
              route: '/api/events/ai-move', 
              gameId: gameData.id, 
              userId: userId,
              attempt: attempt,
              message: 'Error during go() execution', 
              error: goError.message, 
              stack: goError.stack,
              fen: gameData.fen,
              level: level
          });
          // If go() itself throws, treat it as a failed attempt for that iteration
          aiMove = null; 
      }
      
      debug(`📝 AI suggested move (attempt ${attempt}/${MAX_ATTEMPTS}): ${JSON.stringify(aiMove)}`);
      
      if (!aiMove) {
        debug(`❌ AI engine failed to generate a move (attempt ${attempt}/${MAX_ATTEMPTS})`);
        hasyx.debug({ route: '/api/events/ai-move', gameId: gameData.id, userId: userId, attempt: attempt, message: 'AI engine (go function) returned no move (null/undefined)', fen: gameData.fen, level: level });
        moveResult = { error: 'AI engine failed to generate a move' }; // Store error for this attempt
        if (attempt === MAX_ATTEMPTS) break; // Exit loop if max attempts reached
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay before retrying go()
        continue; // Next attempt
      }
      
      // Выполняем ход напрямую через HasyxChessServer
      const clientId = uuidv4(); // Генерируем временный clientId для запроса к серверу
      const moveRequestPayload = {
        operation: 'move' as const,
        clientId: clientId, 
        userId: userId,
        gameId: gameData.id,
        joinId: join.id, 
        side: currentSide,
        role: ChessClientRole.Player,
        move: {
          from: aiMove.from,
          to: aiMove.to,
          promotion: aiMove.promotion === null ? undefined : aiMove.promotion
        },
        updatedAt: Date.now(), 
        createdAt: Date.now()
      };
      hasyx.debug({ route: '/api/events/ai-move', gameId: gameData.id, userId: userId, attempt: attempt, message: 'Attempting chessServer.request for move', data: moveRequestPayload });
      moveResult = await chessServer.request(moveRequestPayload);
      hasyx.debug({ route: '/api/events/ai-move', gameId: gameData.id, userId: userId, attempt: attempt, message: 'chessServer.request for move completed', data: moveResult });
      
      if (moveResult.error) {
        debug(`❌ AI move failed on chessServer (attempt ${attempt}/${MAX_ATTEMPTS}): ${moveResult.error}`);
        hasyx.debug({ route: '/api/events/ai-move', gameId: gameData.id, userId: userId, attempt: attempt, message: 'AI move failed on chessServer (moveResult.error)', error: moveResult.error, requestPayload: moveRequestPayload });
        if (attempt === MAX_ATTEMPTS) break; // Exit loop if max attempts reached
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay before retrying
      } else {
        successfulMove = true;
        break; // Successful move, exit loop
      }
    }
    
    if (!successfulMove) {
      debug(`❌ AI failed to make a valid move after ${MAX_ATTEMPTS} attempts. Game ID: ${gameData.id}, User ID: ${userId}`);
      hasyx.debug({ 
        route: '/api/events/ai-move', 
        gameId: gameData.id, 
        userId: userId,
        message: `AI failed to make a valid move after ${MAX_ATTEMPTS} attempts. Last error: ${moveResult.error}`,
        lastAiMoveAttempt: aiMove,
        lastMoveResult: moveResult
      });

      // Определяем статус на основе того, чей был ход
      const newStatus = currentSide === ChessClientSide.White ? ChessClientStatus.WhiteSurrender : ChessClientStatus.BlackSurrender;
      
      hasyx.debug({ route: '/api/events/ai-move', gameId: gameData.id, userId: userId, message: `Updating game status to ${newStatus} due to AI failure.` });
      await hasyx.update({
        table: 'badma_games',
        where: { id: { _eq: gameData.id } },
        _set: { status: newStatus, updated_at: new Date().toISOString() }
      });
      
      return { 
        success: false, // Indicate overall failure to make a move for the turn
        message: `AI failed to make a valid move after ${MAX_ATTEMPTS} attempts. Game ended.`,
        error: `AI failed: ${moveResult.error || 'Could not generate a valid move.'}`,
        game: {
          id: gameData.id,
          newStatus: newStatus
        }
      };
    }
    
    // Если successfulMove === true, значит вышли из цикла с успешным ходом
    debug(`✅ AI move successful!`);
    
    // Проверяем, был ли ход выполнен (для отладки)
    const movesCheck = await hasyx.select({
      table: 'badma_moves',
      where: {
        game_id: { _eq: gameData.id },
        user_id: { _eq: userId } // Ищем ходы именно этого AI
      },
      order_by: { created_at: 'desc' },
      limit: 5,
      returning: ['id', 'from', 'to', 'created_at'] // Достаточно для проверки
    });
    
    debug(`✓ Recent moves for this game by AI (${userId}): ${JSON.stringify(movesCheck)}`);
    
    // Возвращаем успешный результат
    return { 
      success: true, 
      message: 'AI move successful',
      move: {
        from: aiMove.from,
        to: aiMove.to,
        promotion: aiMove.promotion
      },
      game: {
        id: gameData.id,
        newStatus: moveResult.data?.status,
        newFen: moveResult.data?.fen
      }
    }; 
  } catch (error) {
    // hasyxEvent поймает ошибку и вернет 500
    debug(`❌ Error processing AI move: ${error instanceof Error ? error.message : String(error)}`);
    // Можно просто выбросить ошибку, чтобы hasyxEvent её обработал
    throw error; 
    /* Или вернуть объект с ошибкой, если нужно кастомное сообщение
    return {
      success: false,
      message: 'Error processing AI move',
      error: error instanceof Error ? error.message : String(error)
    };
    */
  }
}); // <<< Закрывающая скобка для hasyxEvent 