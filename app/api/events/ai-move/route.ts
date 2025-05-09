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
    if (table.schema !== 'badma' || table.name !== 'games' || op !== 'UPDATE') {
      debug('⚠️ Skipping: Not a badma.games table update event');
      return { success: true, message: 'Skipped: Not a relevant event type' }; 
    }
    
    if (gameData.status !== 'ready' && gameData.status !== 'continue') {
      debug(`⚠️ Skipping: Game not in playable state (status: ${gameData.status})`);
      return { success: true, message: 'No AI move needed: Game not in playable state' };
    }
    
    // <<< УДАЛЯЕМ ПРОВЕРКУ СООТВЕТСТВИЯ FEN и SIDE >>>
    // if (!gameData.fen) { ... }
    // const tempChess = new Chess(); ...
    // if (currentTurnInFen !== expectedSideToMove) { ... }

    // <<< ОПРЕДЕЛЯЕМ ХОД НАПРЯМУЮ ИЗ FEN >>>
    if (!gameData.fen) {
        debug('⚠️ Skipping: FEN is missing in game data.');
        return { success: true, message: 'Skipped: FEN missing' };
    }
    const tempChessForTurn = new Chess();
    tempChessForTurn.load(gameData.fen);
    const currentSide = tempChessForTurn.turn; // Получаем 1 для 'w', 2 для 'b'
    debug(`🎮 Current turn determined from FEN: ${currentSide} (${currentSide === 1 ? 'White' : 'Black'})`);

    // Создание клиентов и запросы остаются теми же
    const adminClient = createApolloClient({ 
      secret: process.env.HASURA_ADMIN_SECRET as string 
    });
    const generate = Generator(schema);
    const hasyx = new Hasyx(adminClient, generate);
    
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
      returning: ['id', 'user_id', 'game_id', 'side', 'role']
    });
    
    if (!joins || joins.length === 0) {
      debug('⚠️ No join record found for the current side');
      return { success: true, message: 'No AI move needed: No join record for current side' };
    }
    
    const join = joins[0];
    const userId = join.user_id;
    debug(`👤 User ID for current turn: ${userId}`);
    
    // --- Запрос к badma_ais --- 
    const aiConfigs = await hasyx.select<AiConfig[]>({
      table: 'badma_ais',
      where: { user_id: { _eq: userId } },
      limit: 1,
      returning: ['id', 'user_id', 'options']
    });
    
    if (!aiConfigs || aiConfigs.length === 0) {
      debug('⚠️ No AI configuration found for user');
      return { success: true, message: 'No AI move needed: User has no AI configuration' };
    }
    
    const aiConfig = aiConfigs[0];
    debug(`🤖 Found AI configuration: ${JSON.stringify(aiConfig.options)}`);
    
    const chessServer = new HasyxChessServer(hasyx);
    
    debug('🎲 Making AI move directly with HasyxChessServer');
    const engine = aiConfig.options?.engine || 'js-chess-engine';
    const level = aiConfig.options?.level || 0;
    debug(`🧠 Using AI engine: ${engine}, level: ${level}`);
    
    const aiMove = go(gameData.fen, level);
    debug(`📝 AI suggested move: ${JSON.stringify(aiMove)}`);
    
    if (!aiMove) {
      debug(`❌ AI engine failed to generate a move`);
      // hasyxEvent обработает ошибку, если вернуть объект с полем error
      return { 
        success: false, // success: false не стандартно для hasyxEvent, лучше error
        message: 'AI engine failed to generate a move',
        error: 'No move returned from AI engine' // Возвращаем error
      };
    }
    
    // Выполняем ход напрямую через HasyxChessServer
    const clientId = uuidv4(); // Генерируем временный clientId для запроса к серверу
    const moveResult = await chessServer.request({
      operation: 'move',
      clientId: clientId, // Передаем временный ID
      userId: userId,
      gameId: gameData.id,
      joinId: join.id, // Передаем joinId пользователя ИИ
      side: currentSide,
      role: ChessClientRole.Player,
      move: {
        from: aiMove.from,
        to: aiMove.to,
        promotion: aiMove.promotion === null ? undefined : aiMove.promotion
      },
      // Передаем текущее время для createdAt/updatedAt запроса
      updatedAt: Date.now(), 
      createdAt: Date.now()
    });
    
    if (moveResult.error) {
      debug(`❌ AI move failed: ${moveResult.error}`);
      // hasyxEvent обработает ошибку, если вернуть объект с полем error
      return { 
        // success: false, // Убираем, hasyxEvent смотрит на error
        message: 'AI move failed', 
        error: moveResult.error // Возвращаем error
      }; 
    }
    
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