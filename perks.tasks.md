# Perks System Implementation Tasks

## Phase 1: Core Infrastructure + Testing

- [x] Create `lib/chess-perks.ts` with base `ChessPerk` class and `ChessPerks` manager
- [x] Add `ChessPerks` integration to `ChessServer` and `ChessClient` base classes
- [x] Add perk operation support to `ChessClientRequest` type (`'perk'`)
- [x] Add zod validation schemas for perk requests and data
- [x] Add `syncPerk()` and `asyncPerk()` methods to `ChessClient`
- [x] Add `_perk()` method to `ChessClient` for server communication
- [x] Update `ChessClientRequest` and `ChessServerResponse` types for perk operations
- [x] Add perk handling to `ChessServer._perk()` method
- [x] Implement perk validation and application logic
- [x] Create `lib/__tests__/chess-perks.test.ts` test file
- [x] Setup server-client test environment with perks
- [x] Initialize concrete perk instance in test with `_logs = []` for tracking
- [x] Test perk application on client and server sides with `expect(_logs).toEqual([...])`
- [x] Test minefield perk: random mine placement (server-side only)
- [x] Test minefield perk: piece destruction on mine contact
- [x] Verify perk data synchronization between client and server

## Phase 2: Implementation + Database Integration

- [ ] Add `'perks'` category to `ItemType` interface in `lib/items.tsx`
- [ ] Create minefield perk definition in `SUPPORTED_ITEMS`
- [ ] Create `lib/items/minefield-perk.tsx` with complete perk implementation (component + logic)
- [x] Create migration for `badma_perks` table for perks application tracking
- [x] Update `HasyxChessServer` to support perks with real database operations
- [x] Implement `getApplied()` method in `HasyxChessServer` to read from database instead of memory
- [x] Override `_perk()` method in `HasyxChessServer` to save perks to database
- [x] Add axios-based chess client support for perk operations
- [x] Update API route handlers for perk operations
- [ ] Add perk support to WebSocket communication
- [x] Update database schemas and permissions for perks table
- [x] Create comprehensive integration test `hasyx-chess-perks.test.ts`
- [x] Integrate perks processing into HasyxChessServer._move() method
