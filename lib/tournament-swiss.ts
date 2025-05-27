import { Hasyx } from 'hasyx';
import { Tournament, TournamentGameRow, TournamentStatus } from './tournament';
import Debug from './debug';
import { v4 as uuidv4 } from 'uuid';
import { ChessClientStatus } from './chess-client';

const debug = Debug('tournament-swiss');

interface TournamentParticipant {
  id: string;
  user_id: string;
  tournament_id: string;
}

interface PlayerScore {
  user_id: string;
  score: number;
  participant_id: string;
}

/**
 * Swiss System Tournament
 * Players are paired based on their current performance
 * Each round pairs players with similar scores
 */
export class TournamentSwiss extends Tournament {
  private readonly organizerId?: string;
  private readonly rounds: number;
  private currentRound: number = 0;

  constructor(hasyx: Hasyx, tournamentId: string, organizerId?: string, rounds: number = 3) {
    super(hasyx, tournamentId);
    this.organizerId = organizerId;
    this.rounds = rounds;
    debug(`TournamentSwiss initialized for tournamentId: ${tournamentId}, rounds: ${rounds}`);
  }

  protected async _start(): Promise<void> {
    debug(`_start called for Swiss tournament ${this.tournamentId}`);

    const participants = await this.getActiveParticipants();
    if (participants.length < 4) {
      debug(`Not enough participants (${participants.length}) for Swiss tournament. Minimum 4 required. Setting status to 'await'.`);
      await this.hasyx.update({
        table: 'badma_tournaments',
        where: { id: { _eq: this.tournamentId } },
        _set: { status: 'await' as TournamentStatus, updated_at: Date.now() },
      });
      return;
    }

    debug(`Found ${participants.length} participants for Swiss tournament ${this.tournamentId}`);

    // Start first round
    this.currentRound = 1;
    await this.createRoundPairings();

    await this.hasyx.update({
      table: 'badma_tournaments',
      where: { id: { _eq: this.tournamentId } },
      _set: { status: 'ready' as TournamentStatus, updated_at: Date.now() },
    });
    debug(`Swiss tournament ${this.tournamentId} status set to 'ready' after creating round 1.`);
  }

  protected async _over(gameRow: TournamentGameRow): Promise<void> {
    debug(`_over called for Swiss tournament ${this.tournamentId}, gameId: ${gameRow.id}`);
    
    const gameJoins = await this.hasyx.select<any[]>({
      table: 'badma_joins',
      where: { game_id: { _eq: gameRow.id }, role: { _eq: 1 } },
      returning: ['id', 'user_id', 'side'],
    });

    if (gameJoins.length !== 2) {
      debug(`Error: Game ${gameRow.id} does not have exactly 2 player joins. Found: ${gameJoins.length}`);
      return;
    }

    // Calculate and record scores
    await this.recordGameScore(gameRow, gameJoins);

    // Check if current round is complete
    const isRoundComplete = await this.isCurrentRoundComplete();
    if (isRoundComplete) {
      debug(`Round ${this.currentRound} completed for tournament ${this.tournamentId}`);
      
      if (this.currentRound < this.rounds) {
        // Start next round
        this.currentRound++;
        debug(`Starting round ${this.currentRound} for tournament ${this.tournamentId}`);
        await this.createRoundPairings();
      } else {
        debug(`All rounds completed for Swiss tournament ${this.tournamentId}`);
      }
    }
  }

  protected async _isFinished(): Promise<boolean> {
    debug(`_isFinished called for Swiss tournament ${this.tournamentId}`);
    
    // Tournament is finished when all rounds are complete and no games are running
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
    const allRoundsComplete = this.currentRound >= this.rounds;
    
    debug(`Tournament ${this.tournamentId} - Round: ${this.currentRound}/${this.rounds}, Unfinished games: ${hasUnfinishedGames}`);
    return allRoundsComplete && !hasUnfinishedGames;
  }

  protected async _finish(): Promise<void> {
    debug(`_finish called for Swiss tournament ${this.tournamentId}. Tournament completed after ${this.rounds} rounds.`);
    return Promise.resolve();
  }

  private async createRoundPairings(): Promise<void> {
    debug(`Creating pairings for round ${this.currentRound} in tournament ${this.tournamentId}`);

    const participants = await this.getActiveParticipants();
    const playerScores = await this.getPlayerScores();

    // Sort players by score (highest first), then randomly for equal scores
    const sortedPlayers = participants.sort((a, b) => {
      const scoreA = playerScores.find(s => s.user_id === a.user_id)?.score || 0;
      const scoreB = playerScores.find(s => s.user_id === b.user_id)?.score || 0;
      if (scoreA !== scoreB) return scoreB - scoreA; // Higher score first
      return Math.random() - 0.5; // Random for equal scores
    });

    // Create pairings (simple adjacent pairing for now)
    const pairings: [TournamentParticipant, TournamentParticipant][] = [];
    for (let i = 0; i < sortedPlayers.length - 1; i += 2) {
      pairings.push([sortedPlayers[i], sortedPlayers[i + 1]]);
    }

    // If odd number of players, last player gets a bye (automatic win)
    if (sortedPlayers.length % 2 === 1) {
      const byePlayer = sortedPlayers[sortedPlayers.length - 1];
      await this.recordByeScore(byePlayer);
      debug(`Player ${byePlayer.user_id} gets a bye in round ${this.currentRound}`);
    }

    // Create games for pairings
    for (const [player1, player2] of pairings) {
      await this.createGame(player1, player2);
    }

    debug(`Created ${pairings.length} games for round ${this.currentRound}`);
  }

  private async createGame(player1: TournamentParticipant, player2: TournamentParticipant): Promise<void> {
    const gameId = uuidv4();
    const p1Side = Math.random() < 0.5 ? 1 : 2;
    const p2Side = p1Side === 1 ? 2 : 1;

    try {
      const gameToInsert = {
        id: gameId,
        user_id: this.organizerId || player1.user_id,
        status: 'await',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        side: 1,
        created_at: Date.now(),
        updated_at: Date.now(),
      };
      
      await this.hasyx.insert({
        table: 'badma_games',
        object: gameToInsert,
      });

      await this.hasyx.insert({
        table: 'badma_tournament_games',
        object: {
          game_id: gameId,
          tournament_id: this.tournamentId,
        },
      });

      await this.hasyx.insert({
        table: 'badma_joins',
        objects: [
          {
            game_id: gameId,
            user_id: player1.user_id,
            side: p1Side,
            role: 1,
            client_id: uuidv4(),
          },
          {
            game_id: gameId,
            user_id: player2.user_id,
            side: p2Side,
            role: 1,
            client_id: uuidv4(),
          },
        ],
      });

      // Update game to ready status
      await this.hasyx.update({
        table: 'badma_games',
        where: { id: { _eq: gameId } },
        _set: { status: 'ready', updated_at: Date.now() },
      });

      debug(`Successfully created game ${gameId} for round ${this.currentRound}`);
    } catch (error) {
      debug(`Error creating game ${gameId}:`, error);
    }
  }

  private async recordGameScore(gameRow: TournamentGameRow, gameJoins: any[]): Promise<void> {
    const gameStatus = gameRow.status as ChessClientStatus;
    let p1Score = 0;
    let p2Score = 0;

    const player1Join = gameJoins[0];
    const player2Join = gameJoins[1];

    // Calculate scores based on game outcome
    if (player1Join.side === 1) { // Player 1 is white
      if (gameStatus === 'checkmate' && gameRow.side === 2) { 
        p1Score = 1; p2Score = 0; // White wins
      } else if (gameStatus === 'checkmate' && gameRow.side === 1) { 
        p1Score = 0; p2Score = 1; // Black wins
      } else if (gameStatus === 'stalemate' || gameStatus === 'draw') {
        p1Score = 0.5; p2Score = 0.5; // Draw
      } else if (gameStatus === 'white_surrender') { 
        p1Score = 0; p2Score = 1; // White surrenders
      } else if (gameStatus === 'black_surrender') { 
        p1Score = 1; p2Score = 0; // Black surrenders
      }
    } else { // Player 1 is black
      if (gameStatus === 'checkmate' && gameRow.side === 1) { 
        p1Score = 1; p2Score = 0; // Black wins
      } else if (gameStatus === 'checkmate' && gameRow.side === 2) { 
        p1Score = 0; p2Score = 1; // White wins
      } else if (gameStatus === 'stalemate' || gameStatus === 'draw') {
        p1Score = 0.5; p2Score = 0.5; // Draw
      } else if (gameStatus === 'white_surrender') { 
        p1Score = 1; p2Score = 0; // White surrenders
      } else if (gameStatus === 'black_surrender') { 
        p1Score = 0; p2Score = 1; // Black surrenders
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
    }

    const p2Entry = participantEntries.find(p => p.user_id === player2Join.user_id);
    if (p2Entry) {
      scoresToInsert.push({
        tournament_participant_id: p2Entry.id,
        game_id: gameRow.id,
        score: p2Score,
      });
    }

    if (scoresToInsert.length > 0) {
      await this.hasyx.insert({
        table: 'badma_tournament_scores',
        objects: scoresToInsert,
      });
      debug(`Inserted ${scoresToInsert.length} score entries for game ${gameRow.id}`);
    }
  }

  private async recordByeScore(player: TournamentParticipant): Promise<void> {
    // Player gets 1 point for a bye
    await this.hasyx.insert({
      table: 'badma_tournament_scores',
      object: {
        tournament_participant_id: player.id,
        game_id: null, // No game for bye
        score: 1,
      },
    });
    debug(`Recorded bye score for player ${player.user_id}`);
  }

  private async isCurrentRoundComplete(): Promise<boolean> {
    // Check if all games in current round are finished
    const unfinishedGames = await this.hasyx.select<any[]>({
      table: 'badma_tournament_games',
      where: {
        tournament_id: { _eq: this.tournamentId },
        game: { 
          status: { _nin: ['checkmate', 'stalemate', 'draw', 'white_surrender', 'black_surrender', 'finished'] }, 
        },
      },
      returning: ['id']
    });

    return unfinishedGames.length === 0;
  }

  private async getPlayerScores(): Promise<PlayerScore[]> {
    const scores = await this.hasyx.select<any[]>({
      table: 'badma_tournament_participants',
      where: { tournament_id: { _eq: this.tournamentId }, role: { _eq: 1 } },
      returning: [
        'id',
        'user_id',
        { scores_aggregate: { aggregate: { sum: ['score'] } } }
      ]
    });

    return scores.map(s => ({
      user_id: s.user_id,
      participant_id: s.id,
      score: s.scores_aggregate?.aggregate?.sum?.score || 0
    }));
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