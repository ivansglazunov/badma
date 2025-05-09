import { Hasyx } from 'hasyx';
import Debug from './debug';

const debug = Debug('tournament');

export type TournamentStatus = 'await' | 'ready' | 'continue' | 'finished';

// Define a type for the game row data expected by the 'over' method.
// This should align with the actual structure of game data from your database.
export interface TournamentGameRow {
  id: string;
  status: string; // Or a more specific game status type if you have one
  // Add other relevant game properties that _over might need
  [key: string]: any; // Allow other properties
}

export abstract class Tournament {
  public readonly tournamentId: string;
  protected readonly hasyx: Hasyx;

  constructor(hasyx: Hasyx, tournamentId: string) {
    this.hasyx = hasyx;
    this.tournamentId = tournamentId;
    debug(`Tournament class initialized for tournamentId: ${tournamentId}`);
  }

  /**
   * Starts the tournament.
   * - Executes the custom _start logic.
   * - Sets the tournament status to 'continue'.
   */
  async start(): Promise<void> {
    debug(`Starting tournament ${this.tournamentId}`);
    await this._start();
    await this.hasyx.update({
      table: 'badma_tournaments',
      where: { id: { _eq: this.tournamentId } },
      _set: { status: 'continue' as TournamentStatus, updated_at: new Date().toISOString() },
    });
    debug(`Tournament ${this.tournamentId} status set to 'continue'`);
  }

  /**
   * Processes the completion of a game within the tournament.
   * - Executes custom _over logic with game data.
   * - Checks if the tournament is finished using _isFinished.
   * - If finished, calls the finish method.
   * @param gameRow - The database row of the game that just finished.
   */
  async over(gameRow: TournamentGameRow): Promise<void> {
    debug(`Processing game completion for tournament ${this.tournamentId}, gameId: ${gameRow.id}`);
    await this._over(gameRow);
    const isTournamentFinished = await this._isFinished();
    if (isTournamentFinished) {
      debug(`Tournament ${this.tournamentId} is finished, calling finish()`);
      await this.finish();
    } else {
      debug(`Tournament ${this.tournamentId} continues.`);
    }
  }

  /**
   * Finishes the tournament.
   * - Executes custom _finish logic.
   * - Sets the tournament status to 'finished'.
   */
  async finish(): Promise<void> {
    debug(`Finishing tournament ${this.tournamentId}`);
    await this._finish();
    await this.hasyx.update({
      table: 'badma_tournaments',
      where: { id: { _eq: this.tournamentId } },
      _set: { status: 'finished' as TournamentStatus, updated_at: new Date().toISOString() },
    });
    debug(`Tournament ${this.tournamentId} status set to 'finished'`);
  }

  // Abstract methods to be implemented by subclasses

  /**
   * Custom logic to be executed when the tournament starts.
   * This is where games might be created, pairings decided, etc.
   */
  protected abstract _start(): Promise<void>;

  /**
   * Custom logic to handle the completion of a game.
   * This could involve updating scores, advancing brackets, etc.
   * @param gameRow - The database row of the game that just finished.
   */
  protected abstract _over(gameRow: TournamentGameRow): Promise<void>;

  /**
   * Custom logic to determine if the tournament has concluded.
   * This would typically check if all required games have been played.
   * @returns True if the tournament is finished, false otherwise.
   */
  protected abstract _isFinished(): Promise<boolean>;

  /**
   * Custom logic to be executed when the tournament officially finishes.
   * This could involve final ranking calculations, prize distribution notifications, etc.
   */
  protected abstract _finish(): Promise<void>;
} 