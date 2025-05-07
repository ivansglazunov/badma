import { createApolloClient, Generator, Hasyx } from 'hasyx';
import { hasyxEvent, HasuraEventPayload } from 'hasyx/lib/events';
import schema from '../../../../public/hasura-schema.json';
import Debug from '../../../../lib/debug';
import { AxiosChessClient } from '../../../../lib/axios-chess-client';
import { ChessClientRole, ChessClientSide } from '../../../../lib/chess-client';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { go } from '../../../../lib/go';
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
      limit: 1
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
      limit: 1
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
    
    // Create Axios client with admin credentials to make the move
    const axiosInstance = axios.create({
      baseURL: process.env.NEXT_PUBLIC_MAIN_URL,
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET
      }
    });
    
    // Create chess client
    const chessClient = new AxiosChessClient(axiosInstance);
    chessClient.userId = userId;
    chessClient.clientId = uuidv4(); // Generate a client ID
    chessClient.gameId = gameData.id;
    chessClient.joinId = join.id;
    chessClient.side = currentSide;
    chessClient.fen = gameData.fen;
    chessClient.status = gameData.status;
    
    // Sync to ensure latest state
    await chessClient.asyncSync();
    
    // Get AI engine and level settings
    const engine = aiConfig.options?.engine || 'js-chess-engine';
    const level = aiConfig.options?.level || 0;
    debug(`🧠 Using AI engine: ${engine}, level: ${level}`);
    
    // Use the go function to get the AI move
    const aiMove = go(chessClient.fen, level);
    debug(`📝 AI suggested move: ${JSON.stringify(aiMove)}`);
    
    // Make the move
    const moveResponse = await chessClient.asyncMove({
      from: aiMove.from,
      to: aiMove.to,
      promotion: aiMove.promotion === null ? undefined : aiMove.promotion
    });
    
    if (moveResponse.error) {
      debug(`❌ AI move failed: ${moveResponse.error}`);
      return { 
        success: false, 
        message: 'AI move failed', 
        error: moveResponse.error 
      };
    }
    
    debug(`✅ AI move successful!`);
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
        newStatus: moveResponse.data?.status,
        newFen: moveResponse.data?.fen
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