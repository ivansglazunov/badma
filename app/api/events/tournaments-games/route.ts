import dotenv from 'dotenv';
dotenv.config();

import { createApolloClient, Generator, Hasyx } from 'hasyx';
import { hasyxEvent, HasuraEventPayload } from 'hasyx/lib/events';
import schema from '../../../../public/hasura-schema.json';
import Debug from '../../../../lib/debug';
import { TournamentGameRow } from '../../../../lib/tournament';
import { createTournament, TournamentType } from '../../../../lib/tournament-factory';

const debug = Debug('event:tournaments-games');

interface GameEventData {
  id: string;
  status: string; 
  fen: string;
  side: number;
  // other game fields if needed by TournamentGameRow
}

interface TournamentLinkData {
  id: string;
  tournament_id: string;
  tournament: {
    id: string;
    type: string; // e.g., 'round-robin', 'swiss', etc.
    status: string;
    user_id: string; // organizer ID
  };
}

export const POST = hasyxEvent(async (eventPayload: HasuraEventPayload) => {
  debug('🔔 Tournament game event trigger received');

  try {
    const { table, event } = eventPayload;
    const { op, data } = event;
    const gameData = data.new as GameEventData;

    if (table.schema !== 'badma' || table.name !== 'games' || op !== 'UPDATE') {
      debug('⚠️ Skipping: Not a badma.games table update event for tournaments.');
      return { success: true, message: 'Skipped: Not a relevant game update event.' };
    }

    // Check if the game status indicates completion
    const finishedGameStatuses = ['checkmate', 'stalemate', 'draw', 'white_surrender', 'black_surrender'];
    if (!finishedGameStatuses.includes(gameData.status)) {
      debug(`⚠️ Skipping: Game ${gameData.id} status is '${gameData.status}', not a finished state.`);
      return { success: true, message: 'Skipped: Game not finished.' };
    }

    const adminClient = createApolloClient({ secret: process.env.HASURA_ADMIN_SECRET as string });
    const generate = Generator(schema);
    const hasyx = new Hasyx(adminClient, generate);

    // Find if this game is part of any active tournament(s)
    const tournamentLinks = await hasyx.select<TournamentLinkData[]>({
      table: 'badma_tournament_games',
      where: { 
        game_id: { _eq: gameData.id },
        tournament: {
            status: { _in: ['ready', 'continue'] } // Only process for active tournaments
        }
      },
      returning: [
        'id',
        'tournament_id',
        {
          tournament: ['id', 'type', 'status', 'user_id'],
        },
      ],
    });

    if (!tournamentLinks || tournamentLinks.length === 0) {
      debug(`🔵 Game ${gameData.id} is not part of any active tournament or no link found.`);
      return { success: true, message: 'Game not part of an active tournament.' };
    }

    for (const link of tournamentLinks) {
      const tournamentInfo = link.tournament;
      debug(`Processing game ${gameData.id} for tournament ${tournamentInfo.id} (type: ${tournamentInfo.type}, status: ${tournamentInfo.status})`);

      try {
        // Use factory to create tournament handler
        const tournamentHandler = createTournament(
          hasyx, 
          tournamentInfo.id, 
          tournamentInfo.type as TournamentType,
          tournamentInfo.user_id // organizer ID
        );

        // Prepare the gameRow data for the 'over' method
        const gameRowForOver: TournamentGameRow = {
          id: gameData.id,
          status: gameData.status,
          fen: gameData.fen,
          side: gameData.side,
        };
        
        await tournamentHandler.over(gameRowForOver);
        debug(`✅ Successfully processed game over for game ${gameData.id} in tournament ${tournamentInfo.id}`);
        
      } catch (tournamentError) {
        debug(`❌ Error processing tournament ${tournamentInfo.id} of type ${tournamentInfo.type}: ${tournamentError instanceof Error ? tournamentError.message : String(tournamentError)}`);
        // Continue with other tournaments if any
        continue;
      }
    }

    return { success: true, message: 'Tournament game event processed.' };

  } catch (error) {
    debug(`❌ Error processing tournament game event: ${error instanceof Error ? error.message : String(error)}`);
    // hasyxEvent will catch this and return a 500 error
    throw error;
  }
}); 