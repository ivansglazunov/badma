import { z } from 'zod';
import Debug from './debug';

const debug = Debug('chess-perks');

// Zod validation schemas
export const ChessPerkApplicationSchema = z.object({
  type: z.string(),
  game_id: z.string(),
  client_id: z.string(),
  data: z.record(z.string(), z.any()),
  created_at: z.number(),
  updated_at: z.number(),
});

export const ChessPerkRequestSchema = z.object({
  type: z.string(),
  data: z.record(z.string(), z.any()).optional(),
});

export type ChessPerkApplication = z.infer<typeof ChessPerkApplicationSchema>;
export type ChessPerkRequest = z.infer<typeof ChessPerkRequestSchema>;

// Base ChessPerk class that all perks must extend
export abstract class ChessPerk {
  public readonly type: string;
  public readonly side: 'client' | 'server';
  public _logs: string[] = [];

  constructor(type: string, side: 'client' | 'server') {
    this.type = type;
    this.side = side;
    debug(`🎯 [PERK] Created ${type} perk on ${side} side`);
  }

  /**
   * Called when a perk is applied to the game
   * @param gameId - ID of the game
   * @param clientId - ID of the client applying the perk
   * @param data - Custom data for the perk
   * @param chessPerks - Reference to the ChessPerks manager
   * @returns Promise that resolves when perk is handled
   */
  abstract handlePerk(
    gameId: string,
    clientId: string,
    data: Record<string, any>,
    chessPerks: ChessPerks
  ): Promise<void>;

  /**
   * Called when a perk is applied on the client side (UI interaction)
   * This method should handle the client-side logic for applying the perk,
   * including calling chessClient.asyncPerk() with custom data
   * @param chessClient - Chess client instance for making API calls
   * @param gameId - ID of the game
   * @param customData - Custom data provided by the client UI
   * @returns Promise that resolves when perk application is complete
   */
  abstract handleApply(
    chessClient: any,
    gameId: string,
    customData?: Record<string, any>
  ): Promise<void>;

  /**
   * Called BEFORE a move is applied, allows perk to prepare for move or trigger animations
   * This is called on both client and server before the move is processed
   * @param gameId - ID of the game
   * @param clientId - ID of the client making the move
   * @param move - The chess move being made
   * @param fen - Current board position (before move)
   * @param chessPerks - Reference to the ChessPerks manager
   * @returns Promise that resolves to data for handleMoveAfter or null to cancel move
   */
  abstract handleMoveBefore(
    gameId: string,
    clientId: string,
    move: { from: string; to: string; promotion?: string },
    fen: string,
    chessPerks: ChessPerks
  ): Promise<Record<string, any> | null>;

  /**
   * Called AFTER a move is applied, allows perk to modify the resulting position
   * This is called on both client and server after the move is processed
   * @param gameId - ID of the game
   * @param clientId - ID of the client making the move
   * @param move - The chess move that was made
   * @param fen - Board position after the move
   * @param beforeData - Data returned from handleMoveBefore
   * @param chessPerks - Reference to the ChessPerks manager
   * @returns Promise that resolves to modified FEN or null to keep original
   */
  abstract handleMoveAfter(
    gameId: string,
    clientId: string,
    move: { from: string; to: string; promotion?: string },
    fen: string,
    beforeData: Record<string, any> | null,
    chessPerks: ChessPerks
  ): Promise<string | null>;

  protected log(message: string): void {
    this._logs.push(message);
    debug(`📝 [${this.type.toUpperCase()}] ${message}`);
  }
}

// ChessPerks manager class
export class ChessPerks {
  private perks: Map<string, ChessPerk> = new Map();
  private applied: ChessPerkApplication[] = [];
  public readonly side: 'client' | 'server';

  constructor(side: 'client' | 'server') {
    this.side = side;
    debug(`🎮 [PERKS] Created ChessPerks manager on ${side} side`);
  }

  /**
   * Register a perk with the manager
   */
  registerPerk(perk: ChessPerk): void {
    this.perks.set(perk.type, perk);
    debug(`✅ [PERKS] Registered perk: ${perk.type}`);
  }

  /**
   * Get a registered perk by type
   */
  getPerk(type: string): ChessPerk | undefined {
    return this.perks.get(type);
  }

  /**
   * Get all registered perks
   */
  getAllPerks(): ChessPerk[] {
    return Array.from(this.perks.values());
  }

  /**
   * Apply a perk to the game
   */
  async applyPerk(
    type: string,
    gameId: string,
    clientId: string,
    data: Record<string, any> = {}
  ): Promise<void> {
    const perk = this.perks.get(type);
    if (!perk) {
      throw new Error(`Perk ${type} not registered`);
    }

    debug(`🚀 [PERKS] Applying perk ${type} in game ${gameId} by client ${clientId}`);

    // Create application record
    const application: ChessPerkApplication = {
      type,
      game_id: gameId,
      client_id: clientId,
      data,
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    // Add to applied list
    this.applied.push(application);

    // Call perk's handlePerk method
    await perk.handlePerk(gameId, clientId, data, this);

    debug(`✅ [PERKS] Successfully applied perk ${type}`);
  }

  /**
   * Handle move BEFORE phase through all registered perks
   */
  async handleMoveBefore(
    gameId: string,
    clientId: string,
    move: { from: string; to: string; promotion?: string },
    fen: string
  ): Promise<Map<string, Record<string, any>> | null> {
    const beforeData = new Map<string, Record<string, any>>();

    debug(`🎯 [PERKS] Processing BEFORE move ${move.from}-${move.to} through ${this.perks.size} perks`);

    for (const perk of this.perks.values()) {
      const result = await perk.handleMoveBefore(gameId, clientId, move, fen, this);
      if (result === null) {
        debug(`❌ [PERKS] Move cancelled by perk ${perk.type} in BEFORE phase`);
        return null;
      }
      if (result) {
        beforeData.set(perk.type, result);
        debug(`📝 [PERKS] Perk ${perk.type} stored before data:`, result);
      }
    }

    return beforeData;
  }

  /**
   * Handle move AFTER phase through all registered perks
   */
  async handleMoveAfter(
    gameId: string,
    clientId: string,
    move: { from: string; to: string; promotion?: string },
    fen: string,
    beforeData: Map<string, Record<string, any>>
  ): Promise<string | null> {
    let currentFen = fen;

    debug(`🎯 [PERKS] Processing AFTER move ${move.from}-${move.to} through ${this.perks.size} perks`);

    for (const perk of this.perks.values()) {
      const perkBeforeData = beforeData.get(perk.type) || null;
      const result = await perk.handleMoveAfter(gameId, clientId, move, currentFen, perkBeforeData, this);
      if (result === null) {
        debug(`❌ [PERKS] Move rejected by perk ${perk.type} in AFTER phase`);
        return null;
      }
      if (result !== currentFen) {
        debug(`🔄 [PERKS] Perk ${perk.type} modified board position in AFTER phase`);
        currentFen = result;
      }
    }

    return currentFen;
  }

  /**
   * Handle a move through all registered perks (legacy method for backward compatibility)
   * This method now uses the two-phase approach internally
   */
  async handleMove(
    gameId: string,
    clientId: string,
    move: { from: string; to: string; promotion?: string },
    fen: string
  ): Promise<string | null> {
    debug(`🎯 [PERKS] Processing move ${move.from}-${move.to} using legacy handleMove (will use two-phase internally)`);

    // Phase 1: Before move
    const beforeData = await this.handleMoveBefore(gameId, clientId, move, fen);
    if (beforeData === null) {
      return null; // Move was cancelled
    }

    // Phase 2: After move (assuming the move was applied externally)
    // For legacy compatibility, we pass the same FEN as both input and output
    return await this.handleMoveAfter(gameId, clientId, move, fen, beforeData);
  }

  /**
   * Get applied perks for a specific game and type
   */
  async getApplied(type: string, gameId: string): Promise<ChessPerkApplication[]> {
    const filtered = this.applied.filter(
      app => app.type === type && app.game_id === gameId
    );
    debug(`📊 [PERKS] Found ${filtered.length} applied ${type} perks for game ${gameId}`);
    return filtered;
  }

  /**
   * Get all applied perks for a game
   */
  async getAllApplied(gameId: string): Promise<ChessPerkApplication[]> {
    const filtered = this.applied.filter(app => app.game_id === gameId);
    debug(`📊 [PERKS] Found ${filtered.length} total applied perks for game ${gameId}`);
    return filtered;
  }

  /**
   * Clear all applied perks (for testing)
   */
  clearApplied(): void {
    this.applied = [];
    debug(`🧹 [PERKS] Cleared all applied perks`);
  }

  /**
   * Get logs from all perks (for testing)
   */
  getAllLogs(): string[] {
    const logs: string[] = [];
    for (const perk of this.perks.values()) {
      logs.push(...perk._logs);
    }
    return logs;
  }

  /**
   * Clear logs from all perks (for testing)
   */
  clearAllLogs(): void {
    for (const perk of this.perks.values()) {
      perk._logs = [];
    }
    debug(`🧹 [PERKS] Cleared all perk logs`);
  }
}
