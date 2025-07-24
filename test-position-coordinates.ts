import { ChessClient } from './lib/chess-client';

console.log('Testing ChessClient.positionToCoordinates method:');

// Test valid positions
console.log('\n✅ Valid positions:');
console.log('a1 ->', ChessClient.positionToCoordinates('a1')); // Should be { x: 0, y: 7 }
console.log('h8 ->', ChessClient.positionToCoordinates('h8')); // Should be { x: 7, y: 0 }
console.log('f3 ->', ChessClient.positionToCoordinates('f3')); // Should be { x: 5, y: 5 }
console.log('e4 ->', ChessClient.positionToCoordinates('e4')); // Should be { x: 4, y: 4 }
console.log('d5 ->', ChessClient.positionToCoordinates('d5')); // Should be { x: 3, y: 3 }

// Test case sensitivity
console.log('F3 ->', ChessClient.positionToCoordinates('F3')); // Should work with uppercase

// Test invalid positions
console.log('\n❌ Invalid positions (should throw errors):');

const testInvalid = (position: string) => {
  try {
    ChessClient.positionToCoordinates(position);
    console.log(`${position} -> ERROR: Should have thrown!`);
  } catch (e: any) {
    console.log(`${position} -> Error: ${e.message}`);
  }
};

testInvalid('i1'); // Invalid file
testInvalid('a9'); // Invalid rank
testInvalid('a0'); // Invalid rank
testInvalid('abc'); // Too long
testInvalid('a'); // Too short
testInvalid(''); // Empty
testInvalid('11'); // No file letter
testInvalid('aa'); // No rank number

console.log('\n🎯 Test completed!');
