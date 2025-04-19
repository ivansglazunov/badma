import { Chess } from './chess.js';
import debugFactory from './debug.js';

const debug = debugFactory('chess:debug-script');

// Create a chess instance
const chess = new Chess();

// Test pawn attacks
debug('Testing pawn attacks');
chess.load('rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2');

// Check white pawn attacks
debug('White pawn on e4 should attack d5 and f5');
debug('Is d5 attacked by white?', chess.isSquareAttacked('d5', 1));
debug('Is f5 attacked by white?', chess.isSquareAttacked('f5', 1));

// Check black pawn attacks
debug('Black pawn on d5 should attack e4 and c4');
debug('Is e4 attacked by black?', chess.isSquareAttacked('e4', 2));
debug('Is c4 attacked by black?', chess.isSquareAttacked('c4', 2));

// Debug the square details
debug('e4 details:', JSON.stringify(chess.debugSquare('e4'), null, 2));
debug('d5 details:', JSON.stringify(chess.debugSquare('d5'), null, 2));

// Test knight attacks
debug('\nTesting knight attacks');
chess.load('rnbqkbnr/pppppppp/8/8/8/2N5/PPPPPPPP/R1BQKBNR b KQkq - 0 1');

debug('White knight on c3 should attack b5, d5, a4, e4, b1, d1');
debug('Is b5 attacked by white?', chess.isSquareAttacked('b5', 1));
debug('Is d5 attacked by white?', chess.isSquareAttacked('d5', 1));
debug('Knight square details:', JSON.stringify(chess.debugSquare('c3'), null, 2));
debug('b5 details:', JSON.stringify(chess.debugSquare('b5'), null, 2));

// Test bishop attacks
debug('\nTesting bishop attacks');
chess.load('rnbqkbnr/pppppppp/8/8/3B4/8/PPPPPPPP/RN1QKBNR b KQkq - 0 1');

debug('White bishop on d4 should attack c3, e5, f6, g7, a1');
debug('Is c3 attacked by white?', chess.isSquareAttacked('c3', 1));
debug('Is e5 attacked by white?', chess.isSquareAttacked('e5', 1));
debug('Bishop square details:', JSON.stringify(chess.debugSquare('d4'), null, 2));
debug('c3 details:', JSON.stringify(chess.debugSquare('c3'), null, 2));

// Function to spot the difference between tests and implementation
function compareTestAndImpl() {
  debug('\nComparing test expectations with implementation:');
  
  // For pawns
  debug('Pawn test: White pawn on e4 attacks d5?', chess.isSquareAttacked('d5', 1));
  debug('Pawn test: Test expects d5 attacked by white? true');
  
  // For knights
  chess.load('rnbqkbnr/pppppppp/8/8/8/2N5/PPPPPPPP/R1BQKBNR b KQkq - 0 1');
  debug('Knight test: White knight on c3 attacks b5?', chess.isSquareAttacked('b5', 1));
  debug('Knight test: Test expects b5 attacked by white? true');
}

compareTestAndImpl(); 