import { ChessClient } from '../chess-client';

describe('ChessClient.positionToCoordinates', () => {
  describe('Valid positions', () => {
    it('should convert corner positions correctly', () => {
      // Bottom-left corner (a1)
      expect(ChessClient.positionToCoordinates('a1')).toEqual({ x: 0, y: 7 });
      
      // Top-right corner (h8)
      expect(ChessClient.positionToCoordinates('h8')).toEqual({ x: 7, y: 0 });
      
      // Bottom-right corner (h1)
      expect(ChessClient.positionToCoordinates('h1')).toEqual({ x: 7, y: 7 });
      
      // Top-left corner (a8)
      expect(ChessClient.positionToCoordinates('a8')).toEqual({ x: 0, y: 0 });
    });

    it('should convert center positions correctly', () => {
      // Center squares
      expect(ChessClient.positionToCoordinates('e4')).toEqual({ x: 4, y: 4 });
      expect(ChessClient.positionToCoordinates('d5')).toEqual({ x: 3, y: 3 });
      expect(ChessClient.positionToCoordinates('e5')).toEqual({ x: 4, y: 3 });
      expect(ChessClient.positionToCoordinates('d4')).toEqual({ x: 3, y: 4 });
    });

    it('should convert various positions correctly', () => {
      // Test different files and ranks
      expect(ChessClient.positionToCoordinates('f3')).toEqual({ x: 5, y: 5 });
      expect(ChessClient.positionToCoordinates('b7')).toEqual({ x: 1, y: 1 });
      expect(ChessClient.positionToCoordinates('g2')).toEqual({ x: 6, y: 6 });
      expect(ChessClient.positionToCoordinates('c6')).toEqual({ x: 2, y: 2 });
    });

    it('should handle uppercase letters correctly', () => {
      // Case insensitive for files
      expect(ChessClient.positionToCoordinates('F3')).toEqual({ x: 5, y: 5 });
      expect(ChessClient.positionToCoordinates('E4')).toEqual({ x: 4, y: 4 });
      expect(ChessClient.positionToCoordinates('A1')).toEqual({ x: 0, y: 7 });
      expect(ChessClient.positionToCoordinates('H8')).toEqual({ x: 7, y: 0 });
    });

    it('should convert all files correctly', () => {
      // Test all files with same rank
      expect(ChessClient.positionToCoordinates('a4')).toEqual({ x: 0, y: 4 });
      expect(ChessClient.positionToCoordinates('b4')).toEqual({ x: 1, y: 4 });
      expect(ChessClient.positionToCoordinates('c4')).toEqual({ x: 2, y: 4 });
      expect(ChessClient.positionToCoordinates('d4')).toEqual({ x: 3, y: 4 });
      expect(ChessClient.positionToCoordinates('e4')).toEqual({ x: 4, y: 4 });
      expect(ChessClient.positionToCoordinates('f4')).toEqual({ x: 5, y: 4 });
      expect(ChessClient.positionToCoordinates('g4')).toEqual({ x: 6, y: 4 });
      expect(ChessClient.positionToCoordinates('h4')).toEqual({ x: 7, y: 4 });
    });

    it('should convert all ranks correctly', () => {
      // Test all ranks with same file
      expect(ChessClient.positionToCoordinates('e1')).toEqual({ x: 4, y: 7 });
      expect(ChessClient.positionToCoordinates('e2')).toEqual({ x: 4, y: 6 });
      expect(ChessClient.positionToCoordinates('e3')).toEqual({ x: 4, y: 5 });
      expect(ChessClient.positionToCoordinates('e4')).toEqual({ x: 4, y: 4 });
      expect(ChessClient.positionToCoordinates('e5')).toEqual({ x: 4, y: 3 });
      expect(ChessClient.positionToCoordinates('e6')).toEqual({ x: 4, y: 2 });
      expect(ChessClient.positionToCoordinates('e7')).toEqual({ x: 4, y: 1 });
      expect(ChessClient.positionToCoordinates('e8')).toEqual({ x: 4, y: 0 });
    });
  });

  describe('Invalid positions', () => {
    it('should throw error for invalid file letters', () => {
      expect(() => ChessClient.positionToCoordinates('i1')).toThrow('ChessClient:positionToCoordinates:invalid');
      expect(() => ChessClient.positionToCoordinates('z5')).toThrow('ChessClient:positionToCoordinates:invalid');
      expect(() => ChessClient.positionToCoordinates('j8')).toThrow('ChessClient:positionToCoordinates:invalid');
      expect(() => ChessClient.positionToCoordinates('x3')).toThrow('ChessClient:positionToCoordinates:invalid');
    });

    it('should throw error for invalid rank numbers', () => {
      expect(() => ChessClient.positionToCoordinates('a0')).toThrow('ChessClient:positionToCoordinates:invalid');
      expect(() => ChessClient.positionToCoordinates('a9')).toThrow('ChessClient:positionToCoordinates:invalid');
      expect(() => ChessClient.positionToCoordinates('e0')).toThrow('ChessClient:positionToCoordinates:invalid');
      expect(() => ChessClient.positionToCoordinates('h9')).toThrow('ChessClient:positionToCoordinates:invalid');
    });

    it('should throw error for wrong string length', () => {
      expect(() => ChessClient.positionToCoordinates('')).toThrow('ChessClient:positionToCoordinates:invalid');
      expect(() => ChessClient.positionToCoordinates('a')).toThrow('ChessClient:positionToCoordinates:invalid');
      expect(() => ChessClient.positionToCoordinates('abc')).toThrow('ChessClient:positionToCoordinates:invalid');
      expect(() => ChessClient.positionToCoordinates('a1b')).toThrow('ChessClient:positionToCoordinates:invalid');
      expect(() => ChessClient.positionToCoordinates('abcd')).toThrow('ChessClient:positionToCoordinates:invalid');
    });

    it('should throw error for non-string input', () => {
      expect(() => ChessClient.positionToCoordinates(null as any)).toThrow('ChessClient:positionToCoordinates:invalid');
      expect(() => ChessClient.positionToCoordinates(undefined as any)).toThrow('ChessClient:positionToCoordinates:invalid');
      expect(() => ChessClient.positionToCoordinates(123 as any)).toThrow('ChessClient:positionToCoordinates:invalid');
      expect(() => ChessClient.positionToCoordinates({} as any)).toThrow('ChessClient:positionToCoordinates:invalid');
      expect(() => ChessClient.positionToCoordinates([] as any)).toThrow('ChessClient:positionToCoordinates:invalid');
    });

    it('should throw error for invalid format combinations', () => {
      expect(() => ChessClient.positionToCoordinates('11')).toThrow('ChessClient:positionToCoordinates:invalid');
      expect(() => ChessClient.positionToCoordinates('aa')).toThrow('ChessClient:positionToCoordinates:invalid');
      expect(() => ChessClient.positionToCoordinates('1a')).toThrow('ChessClient:positionToCoordinates:invalid');
      expect(() => ChessClient.positionToCoordinates('a!')).toThrow('ChessClient:positionToCoordinates:invalid');
      expect(() => ChessClient.positionToCoordinates('!1')).toThrow('ChessClient:positionToCoordinates:invalid');
    });
  });

  describe('Edge cases', () => {
    it('should handle mixed case correctly', () => {
      expect(ChessClient.positionToCoordinates('A1')).toEqual({ x: 0, y: 7 });
      expect(ChessClient.positionToCoordinates('h8')).toEqual({ x: 7, y: 0 });
      expect(ChessClient.positionToCoordinates('F3')).toEqual({ x: 5, y: 5 });
      expect(ChessClient.positionToCoordinates('e4')).toEqual({ x: 4, y: 4 });
    });

    it('should validate coordinate ranges', () => {
      // Test that all valid positions produce coordinates in 0-7 range
      const validPositions = [
        'a1', 'a8', 'h1', 'h8', 'e4', 'd5', 'f3', 'b7', 'g2', 'c6'
      ];
      
      validPositions.forEach(position => {
        const coords = ChessClient.positionToCoordinates(position);
        expect(coords.x).toBeGreaterThanOrEqual(0);
        expect(coords.x).toBeLessThanOrEqual(7);
        expect(coords.y).toBeGreaterThanOrEqual(0);
        expect(coords.y).toBeLessThanOrEqual(7);
      });
    });

    it('should be consistent with chess board layout', () => {
      // Verify that the coordinate system matches chess board conventions
      // Bottom-left (a1) should be (0, 7) - bottom row in array representation
      // Top-right (h8) should be (7, 0) - top row in array representation
      
      // Test rank progression (y decreases as rank increases)
      expect(ChessClient.positionToCoordinates('a1').y).toBeGreaterThan(ChessClient.positionToCoordinates('a2').y);
      expect(ChessClient.positionToCoordinates('a2').y).toBeGreaterThan(ChessClient.positionToCoordinates('a3').y);
      
      // Test file progression (x increases as file advances)
      expect(ChessClient.positionToCoordinates('a1').x).toBeLessThan(ChessClient.positionToCoordinates('b1').x);
      expect(ChessClient.positionToCoordinates('b1').x).toBeLessThan(ChessClient.positionToCoordinates('c1').x);
    });
  });
});
