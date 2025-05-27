import { Hasyx } from 'hasyx';
import { Tournament, TournamentGameRow, TournamentStatus } from './tournament';
import Debug from './debug';
import { v4 as uuidv4 } from 'uuid';
import { ChessClientStatus } from './chess-client';

const debug = Debug('tournament-scheveningen');

interface TournamentParticipant {
  id: string;
  user_id: string;
  tournament_id: string;
}

interface Team {
  id: string;
  name: string;
  players: TournamentParticipant[];
}

/**
 * Scheveningen System Tournament
 * Team vs team format where each player from one team plays against each player from the other team
 * Typically used for team matches between clubs or countries
 */
export class TournamentScheveningen extends Tournament {
  private readonly organizerId?: string;
  private teams: Team[] = [];

  constructor(hasyx: Hasyx, tournamentId: string, organizerId?: string) {
    super(hasyx, tournamentId);
    this.organizerId = organizerId;
    debug(`TournamentScheveningen initialized for tournamentId: ${tournamentId}`);
  }

  protected async _start(): Promise<void> {
    debug(`_start called for Scheveningen tournament ${this.tournamentId}`);

    const participants = await this.getActiveParticipants();
    if (participants.length < 4 || participants.length % 2 !== 0) {
      debug(`Invalid number of participants (${participants.length}) for Scheveningen tournament. Need even number, minimum 4. Setting status to 'await'.`);
      await this.hasyx.update({
        table: 'badma_tournaments',
        where: { id: { _eq: this.tournamentId } },
        _set: { status: 'await' as TournamentStatus, updated_at: Date.now() },
      });
      return;
    }

    debug(`Found ${participants.length} participants for Scheveningen tournament ${this.tournamentId}`);

    // Divide participants into two teams
    await this.createTeams(participants);

    // Create all games (each player from team A plays each player from team B)
    await this.createAllGames();

    await this.hasyx.update({
      table: 'badma_tournaments',
      where: { id: { _eq: this.tournamentId } },
      _set: { status: 'ready' as TournamentStatus, updated_at: Date.now() },
    });
    debug(`Scheveningen tournament ${this.tournamentId} status set to 'ready' after creating all games.`);
  }

  protected async _over(gameRow: TournamentGameRow): Promise<void> {
    debug(`_over called for Scheveningen tournament ${this.tournamentId}, gameId: ${gameRow.id}`);
    
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
  }

  protected async _isFinished(): Promise<boolean> {
    debug(`_isFinished called for Scheveningen tournament ${this.tournamentId}`);
    
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
    debug(`_finish called for Scheveningen tournament ${this.tournamentId}. Calculating team scores.`);
    
    // Calculate team scores
    const teamScores = await this.calculateTeamScores();
    debug(`Team scores: ${JSON.stringify(teamScores)}`);
    
    return Promise.resolve();
  }

  private async createTeams(participants: TournamentParticipant[]): Promise<void> {
    debug(`Creating teams from ${participants.length} participants`);

    // Shuffle participants for random team assignment
    const shuffledParticipants = [...participants].sort(() => Math.random() - 0.5);
    
    const teamSize = participants.length / 2;
    
    this.teams = [
      {
        id: 'team_a',
        name: 'Team A',
        players: shuffledParticipants.slice(0, teamSize)
      },
      {
        id: 'team_b',
        name: 'Team B',
        players: shuffledParticipants.slice(teamSize)
      }
    ];

    debug(`Created Team A with ${this.teams[0].players.length} players and Team B with ${this.teams[1].players.length} players`);
  }

  private async createAllGames(): Promise<void> {
    debug(`Creating all games for Scheveningen format`);

    const teamA = this.teams[0];
    const teamB = this.teams[1];
    let gamesCreated = 0;

    // Each player from Team A plays against each player from Team B
    for (const playerA of teamA.players) {
      for (const playerB of teamB.players) {
        await this.createGame(playerA, playerB);
        gamesCreated++;
      }
    }

    debug(`Created ${gamesCreated} games for Scheveningen tournament`);
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

      debug(`Successfully created game ${gameId} between ${player1.user_id} and ${player2.user_id}`);
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

  private async calculateTeamScores(): Promise<{ teamA: number; teamB: number }> {
    const teamAPlayerIds = this.teams[0].players.map(p => p.user_id);
    const teamBPlayerIds = this.teams[1].players.map(p => p.user_id);

    // Get all scores for team A players
    const teamAScores = await this.hasyx.select<any[]>({
      table: 'badma_tournament_participants',
      where: { 
        tournament_id: { _eq: this.tournamentId },
        user_id: { _in: teamAPlayerIds },
        role: { _eq: 1 }
      },
      returning: [
        'user_id',
        { scores_aggregate: { aggregate: { sum: ['score'] } } }
      ]
    });

    // Get all scores for team B players
    const teamBScores = await this.hasyx.select<any[]>({
      table: 'badma_tournament_participants',
      where: { 
        tournament_id: { _eq: this.tournamentId },
        user_id: { _in: teamBPlayerIds },
        role: { _eq: 1 }
      },
      returning: [
        'user_id',
        { scores_aggregate: { aggregate: { sum: ['score'] } } }
      ]
    });

    const teamATotal = teamAScores.reduce((sum, player) => 
      sum + (player.scores_aggregate?.aggregate?.sum?.score || 0), 0
    );

    const teamBTotal = teamBScores.reduce((sum, player) => 
      sum + (player.scores_aggregate?.aggregate?.sum?.score || 0), 0
    );

    return { teamA: teamATotal, teamB: teamBTotal };
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