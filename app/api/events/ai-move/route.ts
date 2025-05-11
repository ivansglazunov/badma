import dotenv from 'dotenv';
dotenv.config(); // Добавляем загрузку переменных окружения

import { createApolloClient, Generator, Hasyx } from 'hasyx';
import { hasyxEvent, HasuraEventPayload } from 'hasyx/lib/events';
import schema from '../../../../public/hasura-schema.json';
import Debug from '../../../../lib/debug';
import { ChessClientRole, ChessClientSide, ChessClientStatus, ChessServerResponse } from '../../../../lib/chess-client';
import { v4 as uuidv4 } from 'uuid';
import { go } from '../../../../lib/go';
import { HasyxChessServer } from '../../../../lib/hasyx-chess-server';
import { Chess } from '../../../../lib/chess';
import { Badma_Games } from '@/types/hasura-types';

const debug = Debug('event:ai-move');

// Типы для данных внутри event.data, специфичные для badma_games
interface BadmaGameData {
  id: string;
  fen: string;
  status: string;
  side: number; // Whose turn it is in the game data from DB (1 for White, 2 for Black)
  user_id: string; // User who created the game
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
  user_id: string; // User ID of the player in the join record
  game_id: string;
  side: number; // Side of the player in the join record
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
  // Hasyx client for debugging purposes, available throughout the function
  const adminClientForDebug = createApolloClient({ secret: process.env.HASURA_ADMIN_SECRET as string });
  const generateForDebug = Generator(schema);
  const hasyxForDebug = new Hasyx(adminClientForDebug, generateForDebug);

  const gameIdForEarlyLog = eventPayload.event.data.new?.id || eventPayload.event.data.old?.id || 'unknown_game_id';

  hasyxForDebug.debug({
    route: '/api/events/ai-move',
    gameId: gameIdForEarlyLog,
    message: 'Raw event received by hasyxEvent wrapper',
    request: eventPayload,
    response: null
  });

  try {
    const { table, event } = eventPayload;
    const { op, data } = event;
    const gameData = data.new as BadmaGameData; // Current game state

    // Main Hasyx client for DB operations within the try block
    const adminClient = createApolloClient({
      secret: process.env.HASURA_ADMIN_SECRET as string
    });
    const generate = Generator(schema);
    const hasyx = new Hasyx(adminClient, generate);

    hasyxForDebug.debug({ route: '/api/events/ai-move', gameId: gameData?.id, message: 'Entered main try block', eventOp: op, tableName: table?.name });
    debug(`🔍 Game data received: id=${gameData.id}, status=${gameData.status}, fen=${gameData.fen ? 'present' : 'missing'}`);

    if (table.schema !== 'badma' || table.name !== 'games' || !['INSERT', 'UPDATE'].includes(op)) {
      debug(`⚠️ Skipping: Not a relevant event. Table: ${table.schema}.${table.name}, Op: ${op}`);
      return { success: true, message: 'Skipped: Not a relevant event type for AI move processing (expected INSERT/UPDATE on badma.games)' };
    }

    if (gameData.status !== 'ready' && gameData.status !== 'continue') {
      debug(`⚠️ Skipping: Game not in playable state (status: ${gameData.status})`);
      return { success: true, message: 'No AI move needed: Game not in playable state' };
    }

    if (!gameData.fen) {
      debug('⚠️ Skipping: FEN is missing in game data.');
      hasyxForDebug.debug({ route: '/api/events/ai-move', gameId: gameData.id, message: 'Skipped: FEN missing' });
      return { success: true, message: 'Skipped: FEN missing' };
    }

    const tempChessForTurn = new Chess();
    tempChessForTurn.load(gameData.fen);
    const currentSide = tempChessForTurn.turn; // Determine whose turn it is from FEN (1 for White, 2 for Black)
    debug(`🎮 Current turn determined from FEN: ${currentSide} (${currentSide === 1 ? 'White' : 'Black'})`);

    hasyxForDebug.debug({ route: '/api/events/ai-move', gameId: gameData.id, message: 'Fetching join record for current turn player', data: { game_id: gameData.id, currentSideToPlay: currentSide, role: ChessClientRole.Player } });
    const joins = await hasyx.select<JoinRecord[]>({
      table: 'badma_joins',
      where: {
        game_id: { _eq: gameData.id },
        side: { _eq: currentSide }, // Match the player whose turn it is
        role: { _eq: ChessClientRole.Player }
      },
      order_by: { created_at: 'desc' },
      limit: 1,
      returning: ['id', 'user_id', 'game_id', 'side', 'role', 'created_at']
    });

    hasyxForDebug.debug({ route: '/api/events/ai-move', gameId: gameData.id, message: 'Fetched joins result', data: joins });
    if (!joins || joins.length === 0) {
      debug(`🔴 CRITICAL: No join record found for game ${gameData.id} and side ${currentSide}. Cannot determine AI user.`);
      hasyxForDebug.debug({ route: '/api/events/ai-move', gameId: gameData.id, message: 'CRITICAL: No join record found for current player', data: { currentSideToPlay: currentSide } });
      return { success: true, message: 'No AI move needed: No join record for current side' };
    }

    const join = joins[0];
    const userId = join.user_id; // This is the User ID of the AI player
    debug(`👤 User ID for current turn (from join record ${join.id} with side ${join.side}): ${userId}`);

    hasyxForDebug.debug({ route: '/api/events/ai-move', gameId: gameData.id, userId: userId, message: 'Fetching AI config' });
    const aiConfigs = await hasyx.select<AiConfig[]>({
      table: 'badma_ais',
      where: { user_id: { _eq: userId } }, // AI config for the current player
      limit: 1,
      returning: ['id', 'user_id', 'options']
    });

    hasyxForDebug.debug({ route: '/api/events/ai-move', gameId: gameData.id, userId: userId, message: 'Fetched AI configs result', data: aiConfigs });
    if (!aiConfigs || aiConfigs.length === 0) {
      debug(`⚠️ No AI configuration found for user ${userId}. Check badma_ais table.`);
      hasyxForDebug.debug({ route: '/api/events/ai-move', gameId: gameData.id, userId: userId, message: 'No AI configuration found for this user' });
      return { success: true, message: `No AI move needed: User ${userId} has no AI configuration` };
    }

    const aiConfig = aiConfigs[0];
    debug(`🤖 Found AI configuration: ${JSON.stringify(aiConfig.options)}`);

    const chessServer = new HasyxChessServer(hasyx); // Use the main hasyx client for the server
    hasyxForDebug.debug({ route: '/api/events/ai-move', gameId: gameData.id, message: 'HasyxChessServer instantiated' });

    const engine = aiConfig.options?.engine || 'js-chess-engine';
    const level = aiConfig.options?.level || 0;
    debug(`🧠 Using AI engine: ${engine}, level: ${level}`);

    let aiMove: AiMoveResult | null = null;
    let moveResult: ChessServerResponse = { error: 'AI did not attempt a move' };
    let successfulMove = false;
    const MAX_ATTEMPTS = 3;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      hasyxForDebug.debug({
        route: '/api/events/ai-move',
        gameId: gameData.id,
        userId: userId,
        attempt: attempt,
        message: `Attempting to get AI move via go(). FEN: ${gameData.fen}, Level: ${level}`
      });
      try {
        aiMove = go(gameData.fen, level);
        hasyxForDebug.debug({ route: '/api/events/ai-move', gameId: gameData.id, userId: userId, attempt: attempt, message: 'AI move suggested by go()', data: aiMove });
      } catch (goError: any) {
        debug(`❌ Error during go() execution (attempt ${attempt}/${MAX_ATTEMPTS}): ${goError.message}`);
        hasyxForDebug.debug({
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
        aiMove = null; // Ensure aiMove is null if go() fails
      }

      debug(`📝 AI suggested move (attempt ${attempt}/${MAX_ATTEMPTS}): ${JSON.stringify(aiMove)}`);

      if (!aiMove) {
        debug(`❌ AI engine failed to generate a move (attempt ${attempt}/${MAX_ATTEMPTS})`);
        hasyxForDebug.debug({ route: '/api/events/ai-move', gameId: gameData.id, userId: userId, attempt: attempt, message: 'AI engine (go function) returned no move (null/undefined)', fen: gameData.fen, level: level });
        moveResult = { error: 'AI engine failed to generate a move' };
        if (attempt === MAX_ATTEMPTS) break;
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay before retrying go()
        continue;
      }

      const clientId = uuidv4();
      const moveRequestPayload = {
        operation: 'move' as const,
        clientId: clientId,
        userId: userId, // AI's user ID
        gameId: gameData.id,
        joinId: join.id, // AI's join ID
        side: currentSide, // The side AI is playing (which is currentSide from FEN)
        role: ChessClientRole.Player,
        move: {
          from: aiMove.from,
          to: aiMove.to,
          promotion: aiMove.promotion === null ? undefined : aiMove.promotion
        },
        updatedAt: Date.now(),
        createdAt: Date.now()
      };
      hasyxForDebug.debug({ route: '/api/events/ai-move', gameId: gameData.id, userId: userId, attempt: attempt, message: 'Attempting chessServer.request for move', data: moveRequestPayload });
      moveResult = await chessServer.request(moveRequestPayload);
      hasyxForDebug.debug({ route: '/api/events/ai-move', gameId: gameData.id, userId: userId, attempt: attempt, message: 'chessServer.request for move completed', data: moveResult });

      if (moveResult.error) {
        debug(`❌ AI move failed on chessServer (attempt ${attempt}/${MAX_ATTEMPTS}): ${moveResult.error}`);
        hasyxForDebug.debug({ route: '/api/events/ai-move', gameId: gameData.id, userId: userId, attempt: attempt, message: 'AI move failed on chessServer (moveResult.error)', error: moveResult.error, requestPayload: moveRequestPayload });
        if (attempt === MAX_ATTEMPTS) break;
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay before retrying
      } else {
        successfulMove = true;
        break;
      }
    }

    if (!successfulMove) {
      debug(`❌ AI failed to make a valid move after ${MAX_ATTEMPTS} attempts. Game ID: ${gameData.id}, User ID: ${userId}`);
      hasyxForDebug.debug({
        route: '/api/events/ai-move',
        gameId: gameData.id,
        userId: userId,
        message: `AI failed to make a valid move after ${MAX_ATTEMPTS} attempts. Last error: ${moveResult.error}`,
        lastAiMoveAttempt: aiMove,
        lastMoveResult: moveResult
      });

      // currentSide is whose turn it WAS. If White (1) couldn't move, White surrenders.
      const newStatus = currentSide === 1 ? 'white_surrender' : 'black_surrender';

      hasyxForDebug.debug({ route: '/api/events/ai-move', gameId: gameData.id, userId: userId, message: `Updating game status to ${newStatus} due to AI failure.` });
      await hasyx.update({ // Use main hasyx client
        table: 'badma_games',
        where: { id: { _eq: gameData.id } },
        _set: { status: newStatus, updated_at: new Date().toISOString() }
      });

      return {
        success: false,
        message: `AI failed to make a valid move after ${MAX_ATTEMPTS} attempts. Game ended.`,
        error: `AI failed: ${moveResult.error || 'Could not generate a valid move.'}`,
        game: {
          id: gameData.id,
          newStatus: newStatus
        }
      };
    }

    debug(`✅ AI move successful!`);

    if (!aiMove) {
      // This case should ideally not be reached if successfulMove is true,
      // as successfulMove implies aiMove was valid and processed.
      // However, keeping it for type safety and unexpected edge cases.
      debug('Error: successfulMove is true, but aiMove is null. This indicates a logic flaw.');
      hasyxForDebug.debug({
          route: '/api/events/ai-move',
          gameId: gameData.id,
          userId: userId, // userId is available here
          message: 'Error: successfulMove is true, but aiMove is null. This should not happen.',
      });
      throw new Error('Internal logic error: Successful AI move but aiMove is null.');
    }

    const successResponse = {
      success: true,
      message: 'AI move successful',
      move: { // aiMove is guaranteed to be non-null here if successfulMove is true
        from: aiMove.from,
        to: aiMove.to,
        promotion: aiMove.promotion
      },
      game: {
        id: gameData.id,
        newStatus: moveResult.data?.status, // Status from the successful moveResult
        newFen: moveResult.data?.fen     // FEN from the successful moveResult
      }
    };
    hasyxForDebug.debug({ route: '/api/events/ai-move', gameId: gameData.id, message: 'AI move process successful, returning final response.', data: successResponse });
    return successResponse;

  } catch (error) {
    debug(`❌ Error processing AI move: ${error instanceof Error ? error.message : String(error)}`);
    // Use hasyxForDebug and gameIdForEarlyLog as gameData/userId might not be available if error occurred before their definition
    hasyxForDebug.debug({
        route: '/api/events/ai-move',
        gameId: gameIdForEarlyLog,
        message: 'Error in main catch block of AI move handler',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        eventPayload: eventPayload
    });
    throw error; // Re-throw for hasyxEvent to handle
  }
}); 