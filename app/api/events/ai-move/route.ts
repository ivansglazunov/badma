import dotenv from 'dotenv';
dotenv.config(); // Добавляем загрузку переменных окружения

import { createApolloClient, Generator, Hasyx } from 'hasyx';
import { hasyxEvent, HasuraEventPayload } from 'hasyx/lib/events';
import schema from '../../../../public/hasura-schema.json';
import Debug from '../../../../lib/debug';
import { ChessClientRole, ChessClientSide, ChessClientStatus } from '../../../../lib/chess-client';
import { v4 as uuidv4 } from 'uuid';
import { go } from '../../../../lib/go';
import { HasyxChessServer } from '../../../../lib/hasyx-chess-server';
import { LocalChessClient } from '../../../../lib/local-chess-client';
import { Badma_Games } from '@/types/hasura-types';

const debug = Debug('event:ai-move');

// Type definitions for better type safety
interface BadmaGame {
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
 * Process chess AI moves when a game state changes
 */
export const POST = hasyxEvent(async (payload: HasuraEventPayload) => {
  debug('🔔 Received AI move event trigger');
  
  // Get the event data
  const { table, event } = payload;
  const { op, data } = event;
  const gameData = data.new as BadmaGame;
  
  debug(`🔍 Game data received: id=${gameData.id}, status=${gameData.status}, fen=${gameData.fen ? 'present' : 'missing'}, side=${gameData.side}`);
  
  // Validate event is from games table with UPDATE operation
  if (table.name !== 'games' || op !== 'UPDATE') {
    debug('⚠️ Skipping: Not a games table update event');
    return { 
      success: true, 
      message: 'Skipped: Not a relevant event type'
    };
  }
  
  // Check if the game is in a state that would require an AI move
  if (gameData.status !== 'ready' && gameData.status !== 'continue') {
    debug(`⚠️ Skipping: Game not in playable state (status: ${gameData.status})`);
    return { 
      success: true, 
      message: 'No AI move needed: Game not in playable state' 
    };
  }
  
  // Create admin Hasyx client to query database
  const adminClient = createApolloClient({ 
    secret: process.env.HASURA_ADMIN_SECRET as string 
  });
  const generate = Generator(schema);
  const hasyx = new Hasyx(adminClient, generate);
  
  // Get the current turn user from the joins table
  const currentSide = gameData.side as ChessClientSide;
  debug(`🎮 Current game side/turn: ${currentSide}`);
  
  try {
    // Query to find if the user whose turn it is has an AI configuration
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
      debug('⚠️ No join record found for the current side');
      return { 
        success: true, 
        message: 'No AI move needed: No join record for current side' 
      };
    }
    
    const join = joins[0];
    const userId = join.user_id;
    debug(`👤 User ID for current turn: ${userId}`);
    
    // Check if this user has an AI configuration
    const aiConfigs = await hasyx.select<AiConfig[]>({
      table: 'badma_ais',
      where: { user_id: { _eq: userId } },
      limit: 1,
      returning: ['id', 'user_id', 'options', 'created_at', 'updated_at']
    });
    
    if (!aiConfigs || aiConfigs.length === 0) {
      debug('⚠️ No AI configuration found for user');
      return { 
        success: true, 
        message: 'No AI move needed: User has no AI configuration' 
      };
    }
    
    // Found an AI configuration - time to make a move
    const aiConfig = aiConfigs[0];
    debug(`🤖 Found AI configuration: ${JSON.stringify(aiConfig.options)}`);
    
    // Create HasyxChessServer and a direct instance для работы с данными
    const chessServer = new HasyxChessServer(hasyx);
    
    // Создаем прямой запрос к серверу для выполнения хода
    debug('🎲 Making AI move directly with HasyxChessServer');
    
    // Get AI engine and level settings
    const engine = aiConfig.options?.engine || 'js-chess-engine';
    const level = aiConfig.options?.level || 0;
    debug(`🧠 Using AI engine: ${engine}, level: ${level}`);
    
    // Получаем ход от AI
    const aiMove = go(gameData.fen, level);
    debug(`📝 AI suggested move: ${JSON.stringify(aiMove)}`);
    
    // Если aiMove не определен, возвращаем ошибку
    if (!aiMove) {
      debug(`❌ AI engine failed to generate a move`);
      return { 
        success: false, 
        message: 'AI engine failed to generate a move',
        error: 'No move returned from AI engine'
      };
    }
    
    // Выполняем ход напрямую через HasyxChessServer
    const clientId = uuidv4();
    const moveResult = await chessServer.request({
      operation: 'move',
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
    });
    
    if (moveResult.error) {
      debug(`❌ AI move failed: ${moveResult.error}`);
      return { 
        success: false, 
        message: 'AI move failed', 
        error: moveResult.error 
      };
    }
    
    debug(`✅ AI move successful!`);
    
    // Проверяем, был ли ход выполнен (для отладки)
    const movesCheck = await hasyx.select({
      table: 'badma_moves',
      where: {
        game_id: { _eq: gameData.id },
        user_id: { _eq: userId }
      },
      order_by: { created_at: 'desc' },
      limit: 5
    });
    
    debug(`✓ Recent moves for this game: ${JSON.stringify(movesCheck)}`);
    
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
    debug(`❌ Error processing AI move: ${error instanceof Error ? error.message : String(error)}`);
    return {
      success: false,
      message: 'Error processing AI move',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}); 