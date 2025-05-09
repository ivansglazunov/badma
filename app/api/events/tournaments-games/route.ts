import dotenv from 'dotenv';
dotenv.config();

import { createApolloClient, Generator, Hasyx } from 'hasyx';
import { hasyxEvent, HasuraEventPayload } from 'hasyx/lib/events';
import schema from '../../../../public/hasura-schema.json';
import Debug from '../../../../lib/debug';
import { TournamentGameRow } from '../../../../lib/tournament'; // Assuming TournamentGameRow is exported
import { TournamentRoundRobin } from '../../../../lib/tournament-round-robin';
// Import other tournament types here as they are created, e.g.:
// import { TournamentSwiss } from '../../../../lib/tournament-swiss';

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
    type: string; // e.g., 'round-robin'
    status: string;
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
          tournament: ['id', 'type', 'status'],
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

      let tournamentHandler;
      // Instantiate the correct tournament handler based on type
      switch (tournamentInfo.type) {
        case 'round-robin':
          tournamentHandler = new TournamentRoundRobin(hasyx, tournamentInfo.id);
          break;
        // case 'swiss':
        //   tournamentHandler = new TournamentSwiss(hasyx, tournamentInfo.id);
        //   break;
        default:
          debug(`⚠️ Unknown tournament type: ${tournamentInfo.type} for tournament ${tournamentInfo.id}. Skipping.`);
          continue; // Skip to the next link if any
      }

      if (tournamentHandler) {
        // Prepare the gameRow data for the 'over' method
        // Ensure TournamentGameRow includes all fields _over might need from gameData
        const gameRowForOver: TournamentGameRow = {
          id: gameData.id,
          status: gameData.status,
          fen: gameData.fen,       // Pass FEN
          side: gameData.side,     // Pass current turn/side from game data
          // Add any other fields from gameData that TournamentGameRow and _over expect
        };
        await tournamentHandler.over(gameRowForOver);
        debug(`✅ Successfully processed game over for game ${gameData.id} in tournament ${tournamentInfo.id}`);
      }
    }

    return { success: true, message: 'Tournament game event processed.' };

  } catch (error) {
    debug(`❌ Error processing tournament game event: ${error instanceof Error ? error.message : String(error)}`);
    // hasyxEvent will catch this and return a 500 error
    throw error;
  }
}); 