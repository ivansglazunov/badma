import dotenv from 'dotenv';
dotenv.config(); // Добавляем загрузку переменных окружения

import { NextRequest, NextResponse } from 'next/server'; // Используем стандартные типы Next.js
import { createApolloClient, Generator, Hasyx } from 'hasyx';
// import { hasyxEvent, HasuraEventPayload } from 'hasyx/lib/events'; // Убираем hasyxEvent
import schema from '../../../../public/hasura-schema.json';
import Debug from '../../../../lib/debug';
import { ChessClientRole, ChessClientSide, ChessClientStatus } from '../../../../lib/chess-client';
import { v4 as uuidv4 } from 'uuid';
import { go } from '../../../../lib/go';
import { HasyxChessServer } from '../../../../lib/hasyx-chess-server';
// import { LocalChessClient } from '../../../../lib/local-chess-client'; // LocalChessClient здесь не нужен
import { Badma_Games } from '@/types/hasura-types';

const debug = Debug('event:ai-move');

// Определяем интерфейс для ожидаемого Hasura payload
interface HasuraEventPayloadStructure {
  created_at: string;
  delivery_info: {
    current_retry: number;
    max_retries: number;
  };
  event: {
    data: {
      new: any; // Используем any, так как структура зависит от таблицы
      old: any;
    };
    op: 'INSERT' | 'UPDATE' | 'DELETE' | 'MANUAL';
    session_variables: Record<string, string>;
    trace_context?: Record<string, any>;
  };
  id: string;
  table: {
    name: string;
    schema: string;
  };
  trigger: {
    name: string;
  };
}

// Типы для данных внутри event.data, специфичные для badma_games
interface BadmaGameEventData {
  id: string;
  fen: string;
  status: string;
  side: number;
  user_id: string; // Добавляем user_id, если он есть в таблице и триггере
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
 * AI Move Event Handler (Raw Request)
 * Обрабатывает POST-запросы от Hasura Event Trigger.
 */
export async function POST(request: NextRequest) {
  debug('🔔 Raw AI move event trigger received');

  let eventPayload: HasuraEventPayloadStructure;
  try {
    // 1. Проверяем секрет события Hasura
    const eventSecret = process.env.HASURA_EVENT_SECRET;
    const receivedSecret = request.headers.get('x-hasura-event-secret');

    if (!eventSecret || receivedSecret !== eventSecret) {
      debug('⚠️ Unauthorized: Invalid or missing X-Hasura-Event-Secret');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // 2. Парсим тело запроса и извлекаем данные из ключа 'payload'
    const body = await request.json();
    if (!body || !body.payload) {
      debug('⚠️ Invalid payload: Missing \'payload\' key in request body');
      return NextResponse.json({ message: 'Invalid payload structure' }, { status: 400 });
    }
    eventPayload = body.payload as HasuraEventPayloadStructure;
    debug('Parsed event payload:', JSON.stringify(eventPayload, null, 2));

  } catch (error) {
    debug('❌ Error parsing request body or validating secret:', error);
    return NextResponse.json({ message: 'Invalid request body or headers' }, { status: 400 });
  }

  // --- НАЧАЛО ЛОГИКИ ОБРАБОТЧИКА (ранее была внутри hasyxEvent) ---
  try {
    const { table, event } = eventPayload;
    const { op, data } = event;
    const gameData = data.new as BadmaGameEventData;
    
    debug(`🔍 Game data received: id=${gameData.id}, status=${gameData.status}, fen=${gameData.fen ? 'present' : 'missing'}, side=${gameData.side}`);
    
    if (table.schema !== 'badma' || table.name !== 'games' || op !== 'UPDATE') {
      debug('⚠️ Skipping: Not a badma.games table update event');
      return NextResponse.json({ success: true, message: 'Skipped: Not a relevant event type' });
    }
    
    if (gameData.status !== 'ready' && gameData.status !== 'continue') {
      debug(`⚠️ Skipping: Game not in playable state (status: ${gameData.status})`);
      return NextResponse.json({ success: true, message: 'No AI move needed: Game not in playable state' });
    }
    
    const adminClient = createApolloClient({ 
      secret: process.env.HASURA_ADMIN_SECRET as string 
    });
    const generate = Generator(schema);
    const hasyx = new Hasyx(adminClient, generate);
    
    const currentSide = gameData.side as ChessClientSide;
    debug(`🎮 Current game side/turn: ${currentSide}`);
    
    // --- Запрос к badma_joins --- 
    const joins = await hasyx.select<JoinRecord[]>({ 
      table: 'badma_joins',
      where: { 
        game_id: { _eq: gameData.id }, 
        side: { _eq: currentSide },
        role: { _eq: ChessClientRole.Player }  },
      order_by: { created_at: 'desc' },
      limit: 1,
      returning: ['id', 'user_id', 'game_id', 'side', 'role'] // Убираем created_at если не используется
    });
    
    if (!joins || joins.length === 0) {
      debug('⚠️ No join record found for the current side');
      return NextResponse.json({ success: true, message: 'No AI move needed: No join record for current side' });
    }
    
    const join = joins[0];
    const userId = join.user_id;
    debug(`👤 User ID for current turn: ${userId}`);
    
    // --- Запрос к badma_ais --- 
    const aiConfigs = await hasyx.select<AiConfig[]>({ 
      table: 'badma_ais',
      where: { user_id: { _eq: userId } },
      limit: 1,
      returning: ['id', 'user_id', 'options'] // Убираем timestamps если не используются
    });
    
    if (!aiConfigs || aiConfigs.length === 0) {
      debug('⚠️ No AI configuration found for user');
      return NextResponse.json({ success: true, message: 'No AI move needed: User has no AI configuration' });
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