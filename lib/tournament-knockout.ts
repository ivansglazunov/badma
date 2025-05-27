import { Hasyx } from 'hasyx';
import { Tournament, TournamentGameRow, TournamentStatus } from './tournament';
import Debug from './debug';
import { v4 as uuidv4 } from 'uuid';
import { ChessClientStatus } from './chess-client';

const debug = Debug('tournament-knockout');

interface TournamentParticipant {
  id: string;
  user_id: string;
  tournament_id: string;
}

interface BracketNode {
  id: string;
  round: number;
  position: number;
  player1_id?: string;
  player2_id?: string;
  winner_id?: string;
  game_id?: string;
}

/**
 * Knockout/Olympic Tournament
 * Single elimination tournament where losers are immediately eliminated
 */
export class TournamentKnockout extends Tournament {
  private readonly organizerId?: string;
  private bracket: BracketNode[] = [];
  private totalRounds: number = 0;

  constructor(hasyx: Hasyx, tournamentId: string, organizerId?: string) {
    super(hasyx, tournamentId);
    this.organizerId = organizerId;
    debug(`TournamentKnockout initialized for tournamentId: ${tournamentId}`);
  }

  protected async _start(): Promise<void> {
    debug(`_start called for Knockout tournament ${this.tournamentId}`);

    const participants = await this.getActiveParticipants();
    if (participants.length < 4) {
      debug(`Not enough participants (${participants.length}) for Knockout tournament. Minimum 4 required. Setting status to 'await'.`);
      await this.hasyx.update({
        table: 'badma_tournaments',
        where: { id: { _eq: this.tournamentId } },
        _set: { status: 'await' as TournamentStatus, updated_at: Date.now() },
      });
      return;
    }

    // Ensure we have a power of 2 participants (pad with byes if needed)
    const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(participants.length)));
    this.totalRounds = Math.log2(nextPowerOf2);
    
    debug(`Found ${participants.length} participants, creating bracket for ${nextPowerOf2} slots with ${this.totalRounds} rounds`);

    // Create bracket structure
    await this.createBracket(participants, nextPowerOf2);

    // Create first round games
    await this.createRoundGames(1);

    await this.hasyx.update({
      table: 'badma_tournaments',
      where: { id: { _eq: this.tournamentId } },
      _set: { status: 'ready' as TournamentStatus, updated_at: Date.now() },
    });
    debug(`Knockout tournament ${this.tournamentId} status set to 'ready' after creating first round.`);
  }

  protected async _over(gameRow: TournamentGameRow): Promise<void> {
    debug(`_over called for Knockout tournament ${this.tournamentId}, gameId: ${gameRow.id}`);
    
    const gameJoins = await this.hasyx.select<any[]>({
      table: 'badma_joins',
      where: { game_id: { _eq: gameRow.id }, role: { _eq: 1 } },
      returning: ['id', 'user_id', 'side'],
    });

    if (gameJoins.length !== 2) {
      debug(`Error: Game ${gameRow.id} does not have exactly 2 player joins. Found: ${gameJoins.length}`);
      return;
    }

    // Determine winner
    const winner = this.determineWinner(gameRow, gameJoins);
    if (!winner) {
      debug(`Could not determine winner for game ${gameRow.id}`);
      return;
    }

    // Update bracket with winner
    await this.updateBracketWithWinner(gameRow.id, winner.user_id);

    // Record scores (winner gets 1, loser gets 0)
    await this.recordGameScore(gameRow, gameJoins, winner.user_id);

    // Check if round is complete and advance to next round
    const currentRound = await this.getCurrentRound();
    const isRoundComplete = await this.isRoundComplete(currentRound);
    
    if (isRoundComplete) {
      debug(`Round ${currentRound} completed for tournament ${this.tournamentId}`);
      
      if (currentRound < this.totalRounds) {
        // Create next round games
        await this.createRoundGames(currentRound + 1);
      } else {
        debug(`Tournament ${this.tournamentId} completed! Winner: ${winner.user_id}`);
      }
    }
  }

  protected async _isFinished(): Promise<boolean> {
    debug(`_isFinished called for Knockout tournament ${this.tournamentId}`);
    
    // Tournament is finished when all games are complete
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
    debug(`_finish called for Knockout tournament ${this.tournamentId}. Tournament completed.`);
    return Promise.resolve();
  }

  private async createBracket(participants: TournamentParticipant[], totalSlots: number): Promise<void> {
    debug(`Creating bracket structure for ${totalSlots} slots`);

    // Shuffle participants for random seeding
    const shuffledParticipants = [...participants].sort(() => Math.random() - 0.5);

    // Create first round bracket nodes
    let nodeId = 0;
    for (let i = 0; i < totalSlots; i += 2) {
      const player1 = shuffledParticipants[i] || null;
      const player2 = shuffledParticipants[i + 1] || null;

      this.bracket.push({
        id: `node_${nodeId++}`,
        round: 1,
        position: i / 2,
        player1_id: player1?.user_id,
        player2_id: player2?.user_id,
      });
    }

    // Create subsequent round nodes
    let currentRoundNodes = totalSlots / 2;
    for (let round = 2; round <= this.totalRounds; round++) {
      currentRoundNodes = currentRoundNodes / 2;
      for (let pos = 0; pos < currentRoundNodes; pos++) {
        this.bracket.push({
          id: `node_${nodeId++}`,
          round,
          position: pos,
        });
      }
    }

    debug(`Created bracket with ${this.bracket.length} nodes`);
  }

  private async createRoundGames(round: number): Promise<void> {
    debug(`Creating games for round ${round}`);

    const roundNodes = this.bracket.filter(node => node.round === round && !node.winner_id);
    let gamesCreated = 0;

    for (const node of roundNodes) {
      if (node.player1_id && node.player2_id) {
        // Both players present, create game
        const gameId = await this.createGame(node.player1_id, node.player2_id);
        node.game_id = gameId;
        gamesCreated++;
      } else if (node.player1_id && !node.player2_id) {
        // Player 1 gets a bye
        node.winner_id = node.player1_id;
        await this.recordByeScore(node.player1_id);
        debug(`Player ${node.player1_id} gets a bye in round ${round}`);
      } else if (!node.player1_id && node.player2_id) {
        // Player 2 gets a bye
        node.winner_id = node.player2_id;
        await this.recordByeScore(node.player2_id);
        debug(`Player ${node.player2_id} gets a bye in round ${round}`);
      }
    }

    // Advance bye winners to next round
    await this.advanceByeWinners(round);

    debug(`Created ${gamesCreated} games for round ${round}`);
  }

  private async createGame(player1Id: string, player2Id: string): Promise<string> {
    const gameId = uuidv4();
    const p1Side = Math.random() < 0.5 ? 1 : 2;
    const p2Side = p1Side === 1 ? 2 : 1;

    try {
      const gameToInsert = {
        id: gameId,
        user_id: this.organizerId || player1Id,
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
            user_id: player1Id,
            side: p1Side,
            role: 1,
            client_id: uuidv4(),
          },
          {
            game_id: gameId,
            user_id: player2Id,
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

      debug(`Successfully created game ${gameId}`);
      return gameId;
    } catch (error) {
      debug(`Error creating game ${gameId}:`, error);
      throw error;
    }
  }

  private determineWinner(gameRow: TournamentGameRow, gameJoins: any[]): any | null {
    const gameStatus = gameRow.status as ChessClientStatus;
    const player1Join = gameJoins[0];
    const player2Join = gameJoins[1];

    // In knockout, draws are not allowed - we need a winner
    // For simplicity, we'll treat draws as wins for white
    if (player1Join.side === 1) { // Player 1 is white
      if (gameStatus === 'checkmate' && gameRow.side === 2) { 
        return player1Join; // White wins
      } else if (gameStatus === 'checkmate' && gameRow.side === 1) { 
        return player2Join; // Black wins
      } else if (gameStatus === 'stalemate' || gameStatus === 'draw') {
        return player1Join; // White wins on draw
      } else if (gameStatus === 'white_surrender') { 
        return player2Join; // Black wins
      } else if (gameStatus === 'black_surrender') { 
        return player1Join; // White wins
      }
    } else { // Player 1 is black
      if (gameStatus === 'checkmate' && gameRow.side === 1) { 
        return player1Join; // Black wins
      } else if (gameStatus === 'checkmate' && gameRow.side === 2) { 
        return player2Join; // White wins
      } else if (gameStatus === 'stalemate' || gameStatus === 'draw') {
        return player2Join; // White wins on draw
      } else if (gameStatus === 'white_surrender') { 
        return player1Join; // Black wins
      } else if (gameStatus === 'black_surrender') { 
        return player2Join; // White wins
      }
    }

    return null;
  }

  private async updateBracketWithWinner(gameId: string, winnerId: string): Promise<void> {
    const node = this.bracket.find(n => n.game_id === gameId);
    if (node) {
      node.winner_id = winnerId;
      debug(`Updated bracket: Round ${node.round}, Position ${node.position}, Winner: ${winnerId}`);
    }
  }

  private async advanceByeWinners(round: number): Promise<void> {
    const byeWinners = this.bracket.filter(node => 
      node.round === round && node.winner_id && !node.game_id
    );

    for (const winner of byeWinners) {
      await this.advanceWinnerToNextRound(winner.winner_id!, round);
    }
  }

  private async advanceWinnerToNextRound(winnerId: string, currentRound: number): Promise<void> {
    if (currentRound >= this.totalRounds) return; // Final round

    const nextRound = currentRound + 1;
    const nextRoundNodes = this.bracket.filter(node => node.round === nextRound);
    
    // Find an empty slot in the next round
    for (const node of nextRoundNodes) {
      if (!node.player1_id) {
        node.player1_id = winnerId;
        debug(`Advanced winner ${winnerId} to round ${nextRound}, position ${node.position} as player1`);
        return;
      } else if (!node.player2_id) {
        node.player2_id = winnerId;
        debug(`Advanced winner ${winnerId} to round ${nextRound}, position ${node.position} as player2`);
        return;
      }
    }
  }

  private async recordGameScore(gameRow: TournamentGameRow, gameJoins: any[], winnerId: string): Promise<void> {
    const participantEntries = await this.getActiveParticipantsForUsers(gameJoins.map(j => j.user_id));
    const scoresToInsert: any[] = [];
    
    for (const join of gameJoins) {
      const entry = participantEntries.find(p => p.user_id === join.user_id);
      if (entry) {
        const score = join.user_id === winnerId ? 1 : 0; // Winner gets 1, loser gets 0
        scoresToInsert.push({
          tournament_participant_id: entry.id,
          game_id: gameRow.id,
          score,
        });
      }
    }

    if (scoresToInsert.length > 0) {
      await this.hasyx.insert({
        table: 'badma_tournament_scores',
        objects: scoresToInsert,
      });
      debug(`Inserted ${scoresToInsert.length} score entries for game ${gameRow.id}`);
    }
  }

  private async recordByeScore(playerId: string): Promise<void> {
    const participantEntries = await this.getActiveParticipantsForUsers([playerId]);
    if (participantEntries.length > 0) {
      await this.hasyx.insert({
        table: 'badma_tournament_scores',
        object: {
          tournament_participant_id: participantEntries[0].id,
          game_id: null, // No game for bye
          score: 1, // Bye is a win
        },
      });
      debug(`Recorded bye score for player ${playerId}`);
    }
  }

  private async getCurrentRound(): Promise<number> {
    // Find the highest round with active games
    const activeGames = await this.hasyx.select<any[]>({
      table: 'badma_tournament_games',
      where: {
        tournament_id: { _eq: this.tournamentId },
        game: { 
          status: { _nin: ['checkmate', 'stalemate', 'draw', 'white_surrender', 'black_surrender', 'finished'] }, 
        },
      },
      returning: ['game_id']
    });

    // Find which round these games belong to
    for (let round = 1; round <= this.totalRounds; round++) {
      const roundNodes = this.bracket.filter(node => node.round === round);
      const hasActiveGame = roundNodes.some(node => 
        node.game_id && activeGames.some(game => game.game_id === node.game_id)
      );
      if (hasActiveGame) {
        return round;
      }
    }

    return this.totalRounds; // Default to final round
  }

  private async isRoundComplete(round: number): Promise<boolean> {
    const roundNodes = this.bracket.filter(node => node.round === round);
    return roundNodes.every(node => node.winner_id || (!node.player1_id && !node.player2_id));
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