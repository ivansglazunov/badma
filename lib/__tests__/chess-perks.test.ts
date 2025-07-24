import { ChessPerk, ChessPerks } from '../chess-perks';
import { LocalChessServer } from '../local-chess-server';
import { LocalChessClient } from '../local-chess-client';
import { ChessClient, ChessClientRole } from '../chess-client';
import { v4 as uuidv4 } from 'uuid';
import { Chess } from '../chess';
import Debug from '../debug';

const debug = Debug('test:chess-perks');

// Test perk that simulates a minefield
class TestMinefieldPerk extends ChessPerk {
  private minePositions: string[] = [];
  private logs: string[] = [];

  constructor(id: string, side: 'client' | 'server', minePositions?: string[]) {
    super(id, side);
    // Use fixed positions for deterministic testing if provided
    this.minePositions = minePositions || ['e4', 'f5', 'g3'];
    debug(`TestMinefieldPerk created on ${side} with mines at:`, this.minePositions);
  }

  async handlePerk(
    gameId: string,
    clientId: string,
    data: Record<string, any>,
    chessPerks: ChessPerks
  ): Promise<void> {
    const logMessage = `Minefield perk applied on ${this.side} with data: ${JSON.stringify(data)}`;
    this.logs.push(logMessage);
    debug(logMessage);

    if (this.side === 'server') {
      // Server generates mine positions (or uses fixed ones for testing)
      debug('Server: Mine positions set to:', this.minePositions);
    } else {
      // Client just logs the application
      debug('Client: Minefield perk received');
    }
  }

  async handleMoveBefore(
    gameId: string,
    clientId: string,
    move: { from: string; to: string; promotion?: string },
    fen: string,
    chessPerks: ChessPerks
  ): Promise<Record<string, any> | null> {
    const logMessage = `[BEFORE] Checking move ${move.from}-${move.to} for mine collision`;
    this.logs.push(logMessage);
    debug(logMessage);

    if (this.minePositions.includes(move.to)) {
      const collisionMessage = `💥 [BEFORE] Mine detected at ${move.to}! Will trigger explosion after move.`;
      this.logs.push(collisionMessage);
      debug(collisionMessage);

      // Return data indicating a mine collision will happen
      return {
        mineCollision: true,
        mineSquare: move.to,
        timestamp: Date.now()
      };
    }

    // No mine collision, return empty data
    return {};
  }

  async handleMoveAfter(
    gameId: string,
    clientId: string,
    move: { from: string; to: string; promotion?: string },
    fen: string,
    beforeData: Record<string, any> | null,
    chessPerks: ChessPerks
  ): Promise<string | null> {
    const logMessage = `[AFTER] Processing move ${move.from}-${move.to} with before data: ${JSON.stringify(beforeData)}`;
    this.logs.push(logMessage);
    debug(logMessage);

    // Check if there was a mine collision detected in the BEFORE phase
    if (beforeData?.mineCollision) {
      const collisionMessage = `💥 [AFTER] Mine collision at ${beforeData.mineSquare}! Removing piece from board.`;
      this.logs.push(collisionMessage);
      debug(collisionMessage);

      debug(`FEN after move (before piece removal): ${fen}`);
      
      // Remove the piece from the target square (mine collision)
      const finalFen = this.removePieceFromFen(fen, beforeData.mineSquare);
      const finalMsg = `[AFTER] Final FEN after piece removal: ${finalFen}`;
      debug(finalMsg);
      this.logs.push(finalMsg);
      
      return finalFen;
    }

    // No mine collision, return original FEN
    return fen;
  }

  private removePieceFromFen(fen: string, square: string): string {
    const startMsg = `Removing piece from ${square} in FEN: ${fen}`;
    debug(startMsg);
    this.logs.push(startMsg);
    
    // Parse FEN components
    const fenParts = fen.split(' ');
    const boardPart = fenParts[0];
    const ranks = boardPart.split('/');
    
    // Convert square notation (e.g., 'e4') to rank/file indices
    const file = square.charCodeAt(0) - 'a'.charCodeAt(0); // 0-7
    const rank = 8 - parseInt(square[1]); // 0-7 (rank 8 = index 0)
    
    const coordMsg = `Removing piece from ${square}: rank=${rank}, file=${file}`;
    debug(coordMsg);
    this.logs.push(coordMsg);
    
    const ranksMsg = `Rank string before modification: '${ranks[rank]}'`;
    debug(ranksMsg);
    this.logs.push(ranksMsg);
    
    // Process the specific rank
    let rankStr = ranks[rank];
    let newRankStr = '';
    let fileIndex = 0;
    
    for (let i = 0; i < rankStr.length; i++) {
      const char = rankStr[i];
      
      if (char >= '1' && char <= '8') {
        // Empty squares
        const emptyCount = parseInt(char);
        if (fileIndex <= file && file < fileIndex + emptyCount) {
          // Target square is in this empty range - shouldn't happen but handle it
          newRankStr += char;
        } else {
          newRankStr += char;
        }
        fileIndex += emptyCount;
      } else {
        // Piece
        if (fileIndex === file) {
          // This is the piece we want to remove - replace with empty square
          // We need to merge with adjacent empty squares
          const foundMsg = `Found piece '${char}' at ${square}, removing it`;
          debug(foundMsg);
          this.logs.push(foundMsg);
          // For simplicity, just replace with '1' and let FEN normalization handle merging
          newRankStr += '1';
        } else {
          newRankStr += char;
        }
        fileIndex++;
      }
    }
    
    // Normalize the rank string (merge adjacent numbers)
    newRankStr = this.normalizeFenRank(newRankStr);
    ranks[rank] = newRankStr;
    
    // Reconstruct FEN
    fenParts[0] = ranks.join('/');
    
    // Clear en passant target square since the piece was destroyed
    fenParts[3] = '-';
    
    const modifiedFen = fenParts.join(' ');
    
    debug(`Modified FEN after removing piece: ${modifiedFen}`);
    return modifiedFen;
  }
  
  private normalizeFenRank(rankStr: string): string {
    // Merge adjacent numbers in FEN rank string
    let result = '';
    let emptyCount = 0;
    
    for (const char of rankStr) {
      if (char >= '1' && char <= '8') {
        emptyCount += parseInt(char);
      } else {
        if (emptyCount > 0) {
          result += emptyCount.toString();
          emptyCount = 0;
        }
        result += char;
      }
    }
    
    if (emptyCount > 0) {
      result += emptyCount.toString();
    }
    
    return result;
  }

  getLogs(): string[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }
}

describe('Chess Perks System', () => {
  it('should handle perk application and move processing', async () => {
    debug('Starting perks test');

    // 1. Setup Server and Clients
    const server = new LocalChessServer(ChessClient);

    // Add users to server before client operations
    const userId1 = await server.__addUser();
    const userId2 = await server.__addUser();

    const whiteClient = new LocalChessClient(server);
    whiteClient.clientId = uuidv4();
    whiteClient.userId = userId1;

    const blackClient = new LocalChessClient(server);
    blackClient.clientId = uuidv4();
    blackClient.userId = userId2;

    debug(`White Client ID: ${whiteClient.clientId}, User ID: ${whiteClient.userId}`);
    debug(`Black Client ID: ${blackClient.clientId}, User ID: ${blackClient.userId}`);

    // 2. Create and register test perks with fixed mine positions
    const fixedMines = ['e4', 'f5', 'g3'];
    const serverPerk = new TestMinefieldPerk('test-minefield', 'server', fixedMines);
    const whiteClientPerk = new TestMinefieldPerk('test-minefield', 'client', fixedMines);
    const blackClientPerk = new TestMinefieldPerk('test-minefield', 'client', fixedMines);

    // Register perks
    server._perks.registerPerk(serverPerk);
    whiteClient.perks.registerPerk(whiteClientPerk);
    blackClient.perks.registerPerk(blackClientPerk);

    debug('Perks registered on server and clients');

    // 3. White creates and joins the game
    debug('White creating game...');
    const createResponse = await whiteClient.asyncCreate(1);
    expect(createResponse.error).toBeUndefined();
    expect(createResponse.data).toBeDefined();
    const gameId = createResponse.data!.gameId!;
    debug(`Game created by White. Game ID: ${gameId}`);
    expect(whiteClient.gameId).toBe(gameId);
    expect(whiteClient.side).toBe(0);
    expect(whiteClient.role).toBe(ChessClientRole.Anonymous);
    expect(whiteClient.status).toBe('await');

    // 4. White joins as player
    debug('White joining as player...');
    const joinResponseWhite = await whiteClient.asyncJoin(1, ChessClientRole.Player);
    expect(joinResponseWhite.error).toBeUndefined();
    expect(joinResponseWhite.data).toBeDefined();
    debug(`White joined game. White side: ${whiteClient.side}`);
    expect(whiteClient.gameId).toBe(gameId);
    expect(whiteClient.side).toBe(1);
    expect(whiteClient.role).toBe(ChessClientRole.Player);
    expect(whiteClient.status).toBe('await');

    // 5. Black joins the game
    debug('Black joining game...');
    blackClient.gameId = gameId; // Manually set gameId for black client
    const joinResponseBlack = await blackClient.asyncJoin(2, ChessClientRole.Player);
    expect(joinResponseBlack.error).toBeUndefined();
    expect(joinResponseBlack.data).toBeDefined();
    debug(`Black joined game. Black side: ${blackClient.side}`);
    expect(blackClient.gameId).toBe(gameId);
    expect(blackClient.side).toBe(2);
    expect(blackClient.role).toBe(ChessClientRole.Player);
    expect(blackClient.status).toBe('ready');

    // Sync white client after black joins
    const syncResponseWhite = await whiteClient.asyncSync();
    expect(syncResponseWhite.error).toBeUndefined();
    expect(whiteClient.status).toBe('ready');

    // 6. Apply perk
    debug('Applying minefield perk...');
    const perkResponse = await whiteClient.asyncPerk('test-minefield', { test: 'data' });

    expect(perkResponse.error).toBeUndefined();
    expect(perkResponse.data).toBeDefined();
    debug('Perk applied successfully');

    // Sync black client to get perk application
    await blackClient.asyncSync();

    // 7. Verify perk application on server and white client (who applied it)
    const serverAppliedPerks = await server._perks.getApplied('test-minefield', gameId);
    debug('Server applied perks:', serverAppliedPerks);
    expect(serverAppliedPerks).toHaveLength(1);
    expect(serverAppliedPerks[0].type).toBe('test-minefield');

    const whiteAppliedPerks = await whiteClient.perks.getApplied('test-minefield', gameId);
    debug('White client applied perks:', whiteAppliedPerks);
    expect(whiteAppliedPerks).toHaveLength(1);
    expect(whiteAppliedPerks[0].type).toBe('test-minefield');

    // Note: Black client won't have the perk until we implement perk synchronization
    // For now, we'll skip checking black client's perks

    // 8. Check perk logs
    const serverLogs = serverPerk.getLogs();
    const whiteClientLogs = whiteClientPerk.getLogs();
    debug('Server perk logs:', serverLogs);
    debug('White client perk logs:', whiteClientLogs);

    expect(serverLogs.length).toBeGreaterThan(0);
    expect(whiteClientLogs.length).toBeGreaterThan(0);
    expect(serverLogs[0]).toContain('Minefield perk applied on server');
    expect(whiteClientLogs[0]).toContain('Minefield perk applied on client');

    // 9. Test move processing with perks
    debug('Testing move processing...');

    // Clear logs before testing moves
    serverPerk.clearLogs();
    whiteClientPerk.clearLogs();
    blackClientPerk.clearLogs();

    // Make a safe move (e2-e3)
    debug('Making safe move e2-e3...');
    const safeMoveResponse = await whiteClient.asyncMove({ from: 'e2', to: 'e3' });
    expect(safeMoveResponse.error).toBeUndefined();
    expect(safeMoveResponse.data?.status).toBe('continue');

    // Sync black client after white's move
    await blackClient.asyncSync();
    expect(blackClient.status).toBe('continue');
    expect(blackClient.fen).toBe(whiteClient.fen);

    // Check that move processing was called
    const serverLogsAfterMove = serverPerk.getLogs();
    debug('Server logs after safe move:', serverLogsAfterMove);
    expect(serverLogsAfterMove.some(log => log.includes('Checking move e2-e3'))).toBe(true);

    debug('Perks test completed successfully!');
  });

  it('should remove piece when it lands on a mine', async () => {
    debug('Starting mine collision test');

    // Setup server and clients
    const server = new LocalChessServer(ChessClient);
    const userId1 = await server.__addUser();
    const userId2 = await server.__addUser();

    const whiteClient = new LocalChessClient(server);
    whiteClient.clientId = uuidv4();
    whiteClient.userId = userId1;

    const blackClient = new LocalChessClient(server);
    blackClient.clientId = uuidv4();
    blackClient.userId = userId2;

    // Create perks with mine at e4
    const minePositions = ['e4'];
    const serverPerk = new TestMinefieldPerk('test-minefield', 'server', minePositions);
    const whiteClientPerk = new TestMinefieldPerk('test-minefield', 'client', minePositions);
    const blackClientPerk = new TestMinefieldPerk('test-minefield', 'client', minePositions);

    // Register perks
    server._perks.registerPerk(serverPerk);
    whiteClient.perks.registerPerk(whiteClientPerk);
    blackClient.perks.registerPerk(blackClientPerk);

    // Create and join game
    const createResponse = await whiteClient.asyncCreate(1);
    const gameId = createResponse.data!.gameId!;
    
    await whiteClient.asyncJoin(1, ChessClientRole.Player);
    blackClient.gameId = gameId;
    await blackClient.asyncJoin(2, ChessClientRole.Player);
    await whiteClient.asyncSync();

    // Apply minefield perk
    await whiteClient.asyncPerk('test-minefield', { mines: minePositions });
    await blackClient.asyncSync();

    // Clear logs before testing mine collision
    serverPerk.clearLogs();
    whiteClientPerk.clearLogs();
    blackClientPerk.clearLogs();

    // Record initial FEN
    const initialFen = whiteClient.fen;
    debug('Initial FEN:', initialFen);
    expect(initialFen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

    // Make a move that hits the mine (e2-e4)
    debug('Making move e2-e4 that should hit mine...');
    const mineHitResponse = await whiteClient.asyncMove({ from: 'e2', to: 'e4' });
    expect(mineHitResponse.error).toBeUndefined();
    expect(mineHitResponse.data?.status).toBe('continue');

    // Sync black client to get the updated position
    await blackClient.asyncSync();

    // Check that the move was processed and piece was removed
    const finalFen = whiteClient.fen;
    debug('Final FEN after mine hit:', finalFen);
    
    // The pawn should have been removed from e4, so e4 should be empty
    // Expected FEN: rnbqkbnr/pppppppp/8/8/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1
    // (pawn moved to e4 but was destroyed by mine)
    expect(finalFen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1');
    expect(blackClient.fen).toBe(finalFen);

    // Check that mine collision was logged
    const serverLogs = serverPerk.getLogs();
    debug('Server logs after mine hit:', serverLogs);
    

    
    // Check for two-phase processing logs
    expect(serverLogs.some(log => log.includes('[BEFORE] Checking move e2-e4'))).toBe(true);
    expect(serverLogs.some(log => log.includes('[BEFORE] Mine detected at e4!'))).toBe(true);
    expect(serverLogs.some(log => log.includes('[AFTER] Processing move e2-e4'))).toBe(true);
    expect(serverLogs.some(log => log.includes('[AFTER] Mine collision at e4!'))).toBe(true);
    expect(serverLogs.some(log => log.includes('Found piece \'P\' at e4, removing it'))).toBe(true);

    debug('Mine collision test completed successfully!');
  });

  it('should handle two-phase move processing (handleMoveBefore and handleMoveAfter)', async () => {
    debug('Starting two-phase move processing test');

    // Setup server and clients
    const server = new LocalChessServer(ChessClient);
    const userId1 = await server.__addUser();
    const userId2 = await server.__addUser();

    const whiteClient = new LocalChessClient(server);
    whiteClient.clientId = uuidv4();
    whiteClient.userId = userId1;

    const blackClient = new LocalChessClient(server);
    blackClient.clientId = uuidv4();
    blackClient.userId = userId2;

    // Create perks with mine at e4
    const minePositions = ['e4'];
    const serverPerk = new TestMinefieldPerk('test-minefield', 'server', minePositions);
    const whiteClientPerk = new TestMinefieldPerk('test-minefield', 'client', minePositions);
    const blackClientPerk = new TestMinefieldPerk('test-minefield', 'client', minePositions);

    // Register perks
    server._perks.registerPerk(serverPerk);
    whiteClient.perks.registerPerk(whiteClientPerk);
    blackClient.perks.registerPerk(blackClientPerk);

    // Create and join game
    const createResponse = await whiteClient.asyncCreate(1);
    const gameId = createResponse.data!.gameId!;
    
    await whiteClient.asyncJoin(1, ChessClientRole.Player);
    blackClient.gameId = gameId;
    await blackClient.asyncJoin(2, ChessClientRole.Player);
    await whiteClient.asyncSync();

    // Apply minefield perk
    await whiteClient.asyncPerk('test-minefield', { mines: minePositions });
    await blackClient.asyncSync();

    // Clear logs before testing
    serverPerk.clearLogs();
    whiteClientPerk.clearLogs();
    blackClientPerk.clearLogs();

    // Test the two-phase approach directly
    debug('Testing handleMoveBefore phase...');
    const move = { from: 'e2', to: 'e4' };
    const initialFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    
    // Phase 1: Before move
    const beforeData = await server._perks.handleMoveBefore(
      gameId,
      whiteClient.clientId,
      move,
      initialFen
    );
    
    expect(beforeData).not.toBeNull();
    expect(beforeData!.has('test-minefield')).toBe(true);
    const minefieldData = beforeData!.get('test-minefield');
    expect(minefieldData!.mineCollision).toBe(true);
    expect(minefieldData!.mineSquare).toBe('e4');
    
    debug('Before phase data:', Array.from(beforeData!.entries()));
    
    // Simulate move application (e2-e4)
    const fenAfterMove = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
    
    // Phase 2: After move
    debug('Testing handleMoveAfter phase...');
    const finalFen = await server._perks.handleMoveAfter(
      gameId,
      whiteClient.clientId,
      move,
      fenAfterMove,
      beforeData!
    );
    
    expect(finalFen).not.toBeNull();
    expect(finalFen).not.toBe(fenAfterMove); // Should be modified
    expect(finalFen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1'); // Piece removed from e4
    
    // Check logs for two-phase processing
    const serverLogs = serverPerk.getLogs();
    debug('Server perk logs:', serverLogs);
    
    expect(serverLogs.some(log => log.includes('[BEFORE] Checking move e2-e4'))).toBe(true);
    expect(serverLogs.some(log => log.includes('[BEFORE] Mine detected at e4!'))).toBe(true);
    expect(serverLogs.some(log => log.includes('[AFTER] Processing move e2-e4'))).toBe(true);
    expect(serverLogs.some(log => log.includes('[AFTER] Mine collision at e4!'))).toBe(true);
    expect(serverLogs.some(log => log.includes('[AFTER] Final FEN after piece removal'))).toBe(true);
    
    debug('Two-phase move processing test completed successfully!');
  });
});
