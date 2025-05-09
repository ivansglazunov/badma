import { Hasyx } from 'hasyx';
import { Tournament, TournamentGameRow, TournamentStatus } from './tournament';
import Debug from './debug';
import { v4 as uuidv4 } from 'uuid';
import { ChessClientStatus } from './chess-client'; // For score calculation

const debug = Debug('tournament-round-robin');

interface TournamentParticipant {
  id: string; // ID of the tournament_participants record (role=1)
  user_id: string;
  tournament_id: string;
  // Add other participant details if needed
}

export class TournamentRoundRobin extends Tournament {
  private readonly organizerId?: string; // Optional organizerId

  constructor(hasyx: Hasyx, tournamentId: string, organizerId?: string) {
    super(hasyx, tournamentId);
    this.organizerId = organizerId;
    debug(`TournamentRoundRobin initialized for tournamentId: ${tournamentId}${organizerId ? ', organizerId: ' + organizerId : ''}`);
  }

  protected async _start(): Promise<void> {
    debug(`_start called for Round Robin tournament ${this.tournamentId}`);

    const participants = await this.getActiveParticipants();
    if (participants.length < 2) {
      debug(`Not enough participants (${participants.length}) to start the tournament ${this.tournamentId}. Setting status to 'await'.`);
      await this.hasyx.update({
        table: 'badma_tournaments',
        where: { id: { _eq: this.tournamentId } },
        _set: { status: 'await' as TournamentStatus, updated_at: new Date().toISOString() },
      });
      return;
    }

    debug(`Found ${participants.length} active participants for tournament ${this.tournamentId}`);

    const gamesToCreate: any[] = [];

    for (let i = 0; i < participants.length; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        const player1 = participants[i];
        const player2 = participants[j];
        const gameId = uuidv4();

        const p1Side = Math.random() < 0.5 ? 1 : 2;
        const p2Side = p1Side === 1 ? 2 : 1;

        gamesToCreate.push({
          id: gameId,
          user_id: this.organizerId || player1.user_id, // Use organizerId or fallback to a player
          status: 'await',
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          side: 1,
          tournament_games_relation: {
            data: [
              { tournament_id: this.tournamentId },
            ],
          },
          joins_relation: {
            data: [
              {
                user_id: player1.user_id,
                side: p1Side,
                role: 1,
                client_id: uuidv4(), 
              },
              {
                user_id: player2.user_id,
                side: p2Side,
                role: 1, 
                client_id: uuidv4(), 
              },
            ],
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }

    if (gamesToCreate.length > 0) {
      debug(`Creating ${gamesToCreate.length} games for tournament ${this.tournamentId}`);
      for (const gameData of gamesToCreate) {
        try {
          const gameToInsert = {
            id: gameData.id,
            user_id: gameData.user_id,
            status: gameData.status,
            fen: gameData.fen,
            side: gameData.side,
            created_at: gameData.created_at,
            updated_at: gameData.updated_at,
          };
          
          await this.hasyx.insert({
            table: 'badma_games',
            object: gameToInsert,
          });

          await this.hasyx.insert({
            table: 'badma_tournament_games',
            object: {
              game_id: gameData.id,
              tournament_id: this.tournamentId,
            },
          });

          await this.hasyx.insert({
            table: 'badma_joins',
            objects: gameData.joins_relation.data.map((join: any) => ({ ...join, game_id: gameData.id })),
          });

          debug(`Successfully created game ${gameData.id} (status: await) and its associations for tournament ${this.tournamentId}`);
        } catch (error) {
          debug(`Error creating game ${gameData.id} for tournament ${this.tournamentId}:`, error);
        }
      }

      debug(`Updating status to 'ready' for ${gamesToCreate.length} created games in tournament ${this.tournamentId}`);
      for (const gameData of gamesToCreate) {
        try {
          await this.hasyx.update({
            table: 'badma_games',
            where: { id: { _eq: gameData.id } },
            _set: { status: 'ready', updated_at: new Date().toISOString() },
          });
          debug(`Game ${gameData.id} status updated to 'ready'.`);
        } catch (error) {
          debug(`Error updating game ${gameData.id} status to 'ready':`, error);
        }
      }

    } else {
      debug(`No games to create for tournament ${this.tournamentId}`);
    }
    if (gamesToCreate.length > 0) {
        await this.hasyx.update({
            table: 'badma_tournaments',
            where: { id: { _eq: this.tournamentId } },
            _set: { status: 'ready' as TournamentStatus, updated_at: new Date().toISOString() },
        });
        debug(`Tournament ${this.tournamentId} status set to 'ready' after game creation.`);
    }
  }

  protected async _over(gameRow: TournamentGameRow): Promise<void> {
    debug(`_over called for Round Robin tournament ${this.tournamentId}, gameId: ${gameRow.id}`);
    const gameJoins = await this.hasyx.select<any[]>({
      table: 'badma_joins',
      where: { game_id: { _eq: gameRow.id }, role: { _eq: 1 } },
      returning: ['id', 'user_id', 'side'],
    });

    if (gameJoins.length !== 2) {
      debug(`Error: Game ${gameRow.id} in tournament ${this.tournamentId} does not have exactly 2 player joins. Found: ${gameJoins.length}`);
      return;
    }

    const gameStatus = gameRow.status as ChessClientStatus;
    let p1Score = 0;
    let p2Score = 0;

    const player1Join = gameJoins[0];
    const player2Join = gameJoins[1];

    if (player1Join.side === 1) { 
      if (gameStatus === 'checkmate' && gameRow.side === 2) { 
        p1Score = 1; p2Score = 0;
      } else if (gameStatus === 'checkmate' && gameRow.side === 1) { 
        p1Score = 0; p2Score = 1;
      } else if (gameStatus === 'stalemate' || gameStatus === 'draw') {
        p1Score = 0.5; p2Score = 0.5;
      } else if (gameStatus === 'white_surrender') { 
        p1Score = 0; p2Score = 1;
      } else if (gameStatus === 'black_surrender') { 
        p1Score = 1; p2Score = 0;
      }
    } else { 
      if (gameStatus === 'checkmate' && gameRow.side === 1) { 
        p1Score = 1; p2Score = 0;
      } else if (gameStatus === 'checkmate' && gameRow.side === 2) { 
        p1Score = 0; p2Score = 1;
      } else if (gameStatus === 'stalemate' || gameStatus === 'draw') {
        p1Score = 0.5; p2Score = 0.5;
      } else if (gameStatus === 'white_surrender') { 
        p1Score = 1; p2Score = 0;
      } else if (gameStatus === 'black_surrender') { 
        p1Score = 0; p2Score = 1;
      }
    }
    
    const participantEntries = await this.getActiveParticipantsForUsers([player1Join.user_id, player2Join.user_id]);
    const scoresToInsert: any[] = [];
    const p1Entry = participantEntries.find(p => p.user_id === player1Join.user_id);
    if (p1Entry) {
      scoresToInsert.push({
        tournament_participant_id: p1Entry.id,
        game_id: gameRow.id,
        score: p1Score,
      });
    } else {
        debug(`Could not find active tournament participant entry for user ${player1Join.user_id} in tournament ${this.tournamentId}`);
    }

    const p2Entry = participantEntries.find(p => p.user_id === player2Join.user_id);
    if (p2Entry) {
      scoresToInsert.push({
        tournament_participant_id: p2Entry.id,
        game_id: gameRow.id,
        score: p2Score,
      });
    } else {
        debug(`Could not find active tournament participant entry for user ${player2Join.user_id} in tournament ${this.tournamentId}`);
    }

    if (scoresToInsert.length > 0) {
      await this.hasyx.insert({
        table: 'badma_tournament_scores',
        objects: scoresToInsert,
      });
      debug(`Inserted ${scoresToInsert.length} score entries for game ${gameRow.id} in tournament ${this.tournamentId}`);
    } else {
        debug(`No scores to insert for game ${gameRow.id}`);
    }
  }

  protected async _isFinished(): Promise<boolean> {
    debug(`_isFinished called for Round Robin tournament ${this.tournamentId}`);
    const unfinishedGames = await this.hasyx.select<any[]>({
      table: 'badma_tournament_games',
      where: {
        tournament_id: { _eq: this.tournamentId },
        game: { 
          status: { _nin: ['checkmate', 'stalemate', 'draw', 'white_surrender', 'black_surrender', 'finished'] }, 
        },
      },
      limit: 1, 
      returning: ['id'] 
    });

    const hasUnfinishedGames = unfinishedGames && unfinishedGames.length > 0;
    debug(`Tournament ${this.tournamentId} has unfinished games: ${hasUnfinishedGames}`);
    return !hasUnfinishedGames;
  }

  protected async _finish(): Promise<void> {
    debug(`_finish called for Round Robin tournament ${this.tournamentId}. No specific actions required for this type.`);
    return Promise.resolve();
  }

  private async getActiveParticipants(): Promise<TournamentParticipant[]> {
    const latestParticipantEntries = await this.hasyx.select<any[]>({
        table: 'badma_tournament_participants',
        where: { tournament_id: { _eq: this.tournamentId } },
        order_by: [{ user_id: 'asc' }, { created_at: 'desc' }], 
        returning: ['id', 'user_id', 'tournament_id', 'role', 'created_at']
    });

    const activeParticipantsMap = new Map<string, TournamentParticipant>();
    for (const entry of latestParticipantEntries) {
        if (!activeParticipantsMap.has(entry.user_id)) { 
            if (entry.role === 1) {
                activeParticipantsMap.set(entry.user_id, {
                    id: entry.id, 
                    user_id: entry.user_id,
                    tournament_id: entry.tournament_id
                });
            }
        }
    }
    return Array.from(activeParticipantsMap.values());
  }
  
  private async getActiveParticipantsForUsers(userIds: string[]): Promise<TournamentParticipant[]> {
    if (userIds.length === 0) return [];
    const latestParticipantEntries = await this.hasyx.select<any[]>({
        table: 'badma_tournament_participants',
        where: { 
            tournament_id: { _eq: this.tournamentId },
            user_id: { _in: userIds }
        },
        order_by: [{ user_id: 'asc' }, { created_at: 'desc' }],
        returning: ['id', 'user_id', 'tournament_id', 'role', 'created_at']
    });

    const activeParticipantsMap = new Map<string, TournamentParticipant>();
    for (const entry of latestParticipantEntries) {
        if (!activeParticipantsMap.has(entry.user_id)) { 
            if (entry.role === 1) {
                activeParticipantsMap.set(entry.user_id, {
                    id: entry.id, 
                    user_id: entry.user_id,
                    tournament_id: entry.tournament_id
                });
            }
        }
    }
    return Array.from(activeParticipantsMap.values());
  }
} 