import { LocalChessServer } from '../local-chess-server.js';
import { Chess } from '../chess.js'; // Using the actual Chess class for testing
import { ChessClient, ChessClientRequest, ChessClientRole, ChessClientSide, ChessClientStatus } from '../chess-client.js';
import { v4 as uuidv4 } from 'uuid';
import Debug from '../debug.js'; // Import the Debug function

const debug = Debug('badma:test:local-server'); // Create a debug instance for this test file

describe('LocalChessServer', () => {
    const testUserId1 = uuidv4();
    const testUserId2 = uuidv4();
    const testClientId1 = uuidv4();
    const testClientId2 = uuidv4();

    // Helper function to create a basic valid request
    const createBaseRequest = (userId: string, clientId: string): Partial<ChessClientRequest> => ({
        clientId: clientId,
        userId: userId,
        updatedAt: Date.now(),
        createdAt: Date.now() - 1000, // Slightly in the past
    });

    describe('User Handling', () => {
         it('should return !user error if user does not exist (for join)', async () => {
             const server = new LocalChessServer(ChessClient);
             // Note: No users registered for this test, so join should fail for nonExistentUserId
             const nonExistentUserId = uuidv4();
             const request: ChessClientRequest = {
                 ...createBaseRequest(nonExistentUserId, testClientId1),
                 operation: 'join', // join checks user internally
                 gameId: uuidv4(),
                 side: 1,
                 role: ChessClientRole.Player,
             } as ChessClientRequest; // Cast needed for operation and required fields
             const response = await server.join(request); // Using public API which calls private
             expect(response.error).toBe('!user');
             expect(response.data).toBeUndefined();
         });

         it('should add user during _create if not present', async () => {
             const server = new LocalChessServer(ChessClient);
             server['_users'][testUserId1] = true; // Register one user needed for create
             const newUserId = uuidv4();
              expect(server['_users'][newUserId]).toBeUndefined();
              const request: ChessClientRequest = {
                  ...createBaseRequest(newUserId, testClientId1),
                  operation: 'create',
                  side: 1, // Include side/role to trigger join logic as well
                  role: ChessClientRole.Player
              } as ChessClientRequest;
              await server.create(request);
              expect(server['_users'][newUserId]).toBe(true);
         });
    });


    describe('_create', () => {
        it('should create a new game and return its state', async () => {
            const server = new LocalChessServer(ChessClient);
            server['_users'][testUserId1] = true;
            const request: ChessClientRequest = {
                ...createBaseRequest(testUserId1, testClientId1),
                operation: 'create',
            } as ChessClientRequest;

            const response = await server.create(request);

            expect(response.error).toBeUndefined();
            expect(response.data).toBeDefined();
            expect(response.data?.gameId).toBeDefined();
            expect(response.data?.status).toBe('await');
            expect(response.data?.fen).toBe(new Chess().fen); // Initial FEN
            expect(response.data?.clientId).toBe(testClientId1);
            expect(response.data?.joinId).toBeUndefined(); // No side/role provided
            expect(server['_games'][response.data!.gameId]).toBeDefined();
             expect(server['_games'][response.data!.gameId].hostUserId).toBe(testUserId1);
        });

        it('should create a game with a specific gameId if provided', async () => {
            const server = new LocalChessServer(ChessClient);
            server['_users'][testUserId1] = true;
            const specificGameId = uuidv4();
            const request: ChessClientRequest = {
                ...createBaseRequest(testUserId1, testClientId1),
                operation: 'create',
                gameId: specificGameId,
            } as ChessClientRequest;
            const response = await server.create(request);
            expect(response.error).toBeUndefined();
            expect(response.data?.gameId).toBe(specificGameId);
            expect(server['_games'][specificGameId]).toBeDefined();
        });


        it('should create a game and a join record if side and role are provided', async () => {
            const server = new LocalChessServer(ChessClient);
            server['_users'][testUserId1] = true;
            const request: ChessClientRequest = {
                ...createBaseRequest(testUserId1, testClientId1),
                operation: 'create',
                side: 1,
                role: ChessClientRole.Player,
            } as ChessClientRequest;

            const response = await server.create(request);

            expect(response.error).toBeUndefined();
            expect(response.data?.gameId).toBeDefined();
            const gameId = response.data!.gameId;
            expect(response.data?.joinId).toBeDefined();
            expect(response.data?.side).toBe(1);
            expect(response.data?.role).toBe(ChessClientRole.Player);
            expect(server.getGameJoins(gameId).length).toBe(1);
            expect(server.getGameJoins(gameId)[0].userId).toBe(testUserId1);
             expect(server.getGameJoins(gameId)[0].side).toBe(1);
             expect(server.getGameJoins(gameId)[0].role).toBe(ChessClientRole.Player);
             expect(server.getGameState(gameId)?.status).toBe('await'); // Still awaiting 2nd player
        });

        it('should return error if creating a game with an existing gameId', async () => {
            const server = new LocalChessServer(ChessClient);
            server['_users'][testUserId1] = true;
            server['_users'][testUserId2] = true;
            const gameId = uuidv4();
            // Create first game
            await server.create({
                ...createBaseRequest(testUserId1, testClientId1),
                operation: 'create',
                gameId: gameId,
            } as ChessClientRequest);

            // Attempt to create again
            const request: ChessClientRequest = {
                ...createBaseRequest(testUserId2, testClientId2),
                operation: 'create',
                gameId: gameId,
            } as ChessClientRequest;
            const response = await server.create(request);

            expect(response.data).toBeUndefined();
            expect(response.error).toBe(`gameId=${gameId} already exists`);
        });
    });

    describe('_join', () => {
         it('should allow a user to join an existing game', async () => {
            const server = new LocalChessServer(ChessClient);
            server['_users'][testUserId1] = true;
            server['_users'][testUserId2] = true;
            // Create a game first by User1
            const createResponse = await server.create({
                 ...createBaseRequest(testUserId1, testClientId1),
                 operation: 'create',
            } as ChessClientRequest);
            // Define gameId IMMEDIATELY after creation
            const gameId = createResponse.data!.gameId;

            // Now User2 joins the game using the defined gameId
            const request: ChessClientRequest = {
                ...createBaseRequest(testUserId2, testClientId2),
                operation: 'join',
                gameId: gameId, // Use the gameId defined above
                side: 2, // Black player
                role: ChessClientRole.Player,
            } as ChessClientRequest;
            const response = await server.join(request);

            expect(response.error).toBeUndefined();
            expect(response.data).toBeDefined();
            expect(response.data?.gameId).toBe(gameId);
            expect(response.data?.joinId).toBeDefined();
            expect(response.data?.side).toBe(2);
            expect(response.data?.role).toBe(ChessClientRole.Player);
            // Note: The previous join implementation (_addJoinRecord) was flawed.
            // The test logic here might need adjustment based on the CORRECTED server behavior.
            // Let's assume the new implementation correctly handles joins.
            // This join only adds User2. User1 (creator) is not a player yet unless they also join.
            expect(server.getGameJoins(gameId).length).toBe(1);
            expect(server.getGameJoins(gameId)[0].userId).toBe(testUserId2);
            expect(server.getGameState(gameId)?.status).toBe('await'); // Still awaiting User1 to explicitly join as player or a second player
        });

        it('should change game status to ready when the second player joins', async () => {
            const server = new LocalChessServer(ChessClient);
            server['_users'][testUserId1] = true;
            server['_users'][testUserId2] = true;
            // User1 creates AND joins as White
            const createJoinResponse = await server.create({
                 ...createBaseRequest(testUserId1, testClientId1),
                 operation: 'create',
                 side: 1,
                 role: ChessClientRole.Player,
            } as ChessClientRequest);
            // Assign gameId AFTER the response is received
            const gameId = createJoinResponse.data!.gameId;
             expect(server.getGameState(gameId)?.status).toBe('await');
             debug('[Test Log] After User1 create/join:', createJoinResponse); // <<< Added Debug Log

             // User2 joins as Black
             const joinRequest: ChessClientRequest = {
                 ...createBaseRequest(testUserId2, testClientId2),
                 operation: 'join',
                 gameId: gameId,
                 side: 2, // Black player
                 role: ChessClientRole.Player,
             } as ChessClientRequest;
             debug('[Test Log] Before User2 join - Request:', joinRequest); // <<< Added Debug Log
             const joinResponse = await server.join(joinRequest);
             debug('[Test Log] After User2 join - Response:', joinResponse);
             debug('[Test Log] After User2 join - Server Game State:', server.getGameState(gameId));
             
             expect(joinResponse.error).toBeUndefined();
             expect(joinResponse.data?.status).toBe('ready');
             expect(server.getGameState(gameId)?.status).toBe('ready');
             expect(server.getGameJoins(gameId).length).toBe(2);
        });


        it('should return error if joining a non-existent game', async () => {
            const server = new LocalChessServer(ChessClient);
            server['_users'][testUserId2] = true; // Need user 2 registered
            const nonExistentGameId = uuidv4();
            const request: ChessClientRequest = {
                ...createBaseRequest(testUserId2, testClientId2),
                operation: 'join',
                gameId: nonExistentGameId,
                side: 1,
                role: ChessClientRole.Player,
            } as ChessClientRequest;
            const response = await server.join(request);
            expect(response.data).toBeUndefined();
            expect(response.error).toBe('!game');
        });

        it('should return error if trying to join a side that is already taken', async () => {
            const server = new LocalChessServer(ChessClient);
            server['_users'][testUserId1] = true;
            server['_users'][testUserId2] = true;
            // Create a game first by User1
            const createResponse = await server.create({
                 ...createBaseRequest(testUserId1, testClientId1),
                 operation: 'create',
            } as ChessClientRequest);
            const gameId = createResponse.data!.gameId;

            // User1 joins as White
             await server.join({
                 ...createBaseRequest(testUserId1, testClientId1),
                 operation: 'join',
                 gameId: gameId,
                 side: 1,
                 role: ChessClientRole.Player,
             } as ChessClientRequest);

             // User2 tries to join as White too
             const request: ChessClientRequest = {
                 ...createBaseRequest(testUserId2, testClientId2),
                 operation: 'join',
                 gameId: gameId,
                 side: 1, // Trying to take White again
                 role: ChessClientRole.Player,
             } as ChessClientRequest;
             const response = await server.join(request);
             expect(response.data).toBeUndefined();
             expect(response.error).toBe('Side 1 already taken by an active player (based on latest record)');
         });

        it('should return error if user tries to join as player when already joined as player', async () => {
            const server = new LocalChessServer(ChessClient);
            server['_users'][testUserId1] = true;
            // Create a game first by User1
            const createResponse = await server.create({
                 ...createBaseRequest(testUserId1, testClientId1),
                 operation: 'create',
            } as ChessClientRequest);
            const gameId = createResponse.data!.gameId;

            // User1 joins as White
             await server.join({
                 ...createBaseRequest(testUserId1, testClientId1),
                 operation: 'join',
                 gameId: gameId,
                 side: 1,
                 role: ChessClientRole.Player,
             } as ChessClientRequest);

              // User1 tries to join as Black player now
             const request: ChessClientRequest = {
                  ...createBaseRequest(testUserId1, testClientId1), // Same user
                  operation: 'join',
                  gameId: gameId,
                  side: 2,
                  role: ChessClientRole.Player,
             } as ChessClientRequest;
             const response = await server.join(request);
             expect(response.data).toBeUndefined();
             expect(response.error).toBe('User already active as player (based on latest record)');
        });
    });

    describe('_leave', () => {
         it('should allow a user to leave a game, adding a leave event record', async () => {
            const server = new LocalChessServer(ChessClient);
            server['_users'][testUserId1] = true;
            server['_users'][testUserId2] = true;
            // User1 creates & joins White
             const res1 = await server.create({
                 ...createBaseRequest(testUserId1, testClientId1),
                 operation: 'create',
                 side: 1, role: ChessClientRole.Player
             } as ChessClientRequest);
             const gameId = res1.data!.gameId;
             const joinId1 = res1.data!.joinId!;

             // User2 joins Black -> status becomes 'ready'
             const res2 = await server.join({
                 ...createBaseRequest(testUserId2, testClientId2),
                 operation: 'join', gameId: gameId,
                 side: 2, role: ChessClientRole.Player
             } as ChessClientRequest);
             const joinId2 = res2.data!.joinId!;
             expect(server.getGameState(gameId)?.status).toBe('ready');
              expect(server.getGameJoins(gameId).length).toBe(2);

             const request: ChessClientRequest = {
                 ...createBaseRequest(testUserId1, testClientId1),
                 operation: 'leave',
                 gameId: gameId,
                 joinId: joinId1, // ID of the connection being left
                 side: 0, // State after leaving
                 role: ChessClientRole.Anonymous,
             } as ChessClientRequest;

             const response = await server.leave(request);

             expect(response.error).toBeUndefined();
             expect(response.data).toBeDefined();
             // Expect the NEW joinId of the leave event
             expect(response.data?.joinId).toBeDefined();
             expect(response.data?.joinId).not.toBe(joinId1); // Ensure it's a new ID
             const leaveEventJoinId = response.data!.joinId!;

             expect(response.data?.side).toBe(0);
             expect(response.data?.role).toBe(ChessClientRole.Anonymous);

             // Check server state: Find the specific leave event record
             const leaveRecord = server.getGameJoins(gameId).find(j => j.joinId === leaveEventJoinId);
             expect(leaveRecord).toBeDefined();
             expect(leaveRecord?.userId).toBe(testUserId1);
             expect(leaveRecord?.side).toBe(0);
             expect(leaveRecord?.role).toBe(ChessClientRole.Anonymous);

             // Game status should revert to 'await' as a player left before starting
             expect(server.getGameState(gameId)?.status).toBe('await');
             // Total joins increase due to append-only
             expect(server.getGameJoins(gameId).length).toBe(3); // Initial P1, Initial P2, Leave P1
         });

         it('should set game status to surrender if a player leaves mid-game', async () => {
            const server = new LocalChessServer(ChessClient);
            server['_users'][testUserId1] = true;
            server['_users'][testUserId2] = true;
            // User1 creates & joins White
             const res1 = await server.create({
                 ...createBaseRequest(testUserId1, testClientId1),
                 operation: 'create',
                 side: 1, role: ChessClientRole.Player
             } as ChessClientRequest);
             const gameId = res1.data!.gameId;
             const joinId1 = res1.data!.joinId!;

             // User2 joins Black -> status becomes 'ready'
             const res2 = await server.join({
                 ...createBaseRequest(testUserId2, testClientId2),
                 operation: 'join', gameId: gameId,
                 side: 2, role: ChessClientRole.Player
             } as ChessClientRequest);
             const joinId2 = res2.data!.joinId!;
             expect(server.getGameState(gameId)?.status).toBe('ready');
             expect(server.getGameJoins(gameId).length).toBe(2);

             // Make one move to change status from 'ready' to 'continue'
             const moveRequest: ChessClientRequest = {
                  ...createBaseRequest(testUserId1, testClientId1), // White's turn
                  operation: 'move', gameId: gameId, joinId: joinId1,
                  side: 1, role: ChessClientRole.Player,
                  move: { from: 'e2', to: 'e4' }
             } as ChessClientRequest;
             await server.move(moveRequest);
             expect(server.getGameState(gameId)?.status).toBe('continue');

             // Now User 2 (Black) leaves
             const leaveRequest: ChessClientRequest = {
                 ...createBaseRequest(testUserId2, testClientId2),
                 operation: 'leave',
                 gameId: gameId,
                 joinId: joinId2, // User 2's original joinId
                 side: 0, // State after leaving
                 role: ChessClientRole.Anonymous,
             } as ChessClientRequest;

             const response = await server.leave(leaveRequest);
             expect(response.error).toBeUndefined();
             expect(response.data?.joinId).toBeDefined(); // New leave event ID
             expect(response.data?.joinId).not.toBe(joinId2);
             const leaveEventJoinId = response.data!.joinId!;

             // Add a small delay before asserting
             await new Promise(resolve => setTimeout(resolve, 10)); // e.g., 10ms delay

             // Check game status updated correctly
             expect(response.data?.status).toBe('black_surrender'); // White wins as Black left
             expect(server.getGameState(gameId)?.status).toBe('black_surrender');

             // Verify the leave event record exists for User 2
             const leaveRecord = server.getGameJoins(gameId).find(j => j.joinId === leaveEventJoinId);
             expect(leaveRecord).toBeDefined();
             expect(leaveRecord?.userId).toBe(testUserId2);
             expect(leaveRecord?.side).toBe(0);
             expect(leaveRecord?.role).toBe(ChessClientRole.Anonymous);

             // Total joins increase: P1 join, P2 join, P2 leave
             expect(server.getGameJoins(gameId).length).toBe(3);
         });


        it('should return error if leaving a non-existent game', async () => {
            const server = new LocalChessServer(ChessClient);
            server['_users'][testUserId1] = true;
            const dummyJoinId = uuidv4(); // Need a joinId even if game doesn't exist
            const nonExistentGameId = uuidv4();
            const request: ChessClientRequest = {
                  ...createBaseRequest(testUserId1, testClientId1),
                  operation: 'leave', gameId: nonExistentGameId, joinId: dummyJoinId,
                  side: 0, role: ChessClientRole.Anonymous
             } as ChessClientRequest;
              const response = await server.leave(request);
              expect(response.data).toBeUndefined();
              expect(response.error).toBe('!game');
         });

          it('should return error if leaving with incorrect joinId', async () => {
               const server = new LocalChessServer(ChessClient);
               server['_users'][testUserId1] = true;
               server['_users'][testUserId2] = true;
               // User1 creates & joins White
               const res1 = await server.create({
                   ...createBaseRequest(testUserId1, testClientId1),
                   operation: 'create',
                   side: 1, role: ChessClientRole.Player
               } as ChessClientRequest);
               const gameId = res1.data!.gameId;
               const joinId1 = res1.data!.joinId!;

               // User2 joins Black -> status becomes 'ready'
               const res2 = await server.join({
                   ...createBaseRequest(testUserId2, testClientId2),
                   operation: 'join', gameId: gameId,
                   side: 2, role: ChessClientRole.Player
               } as ChessClientRequest);
               // const joinId2 = res2.data!.joinId!; // Not needed for this test
               expect(server.getGameState(gameId)?.status).toBe('ready');

                const incorrectJoinId = uuidv4();
                const request: ChessClientRequest = {
                    ...createBaseRequest(testUserId1, testClientId1),
                    operation: 'leave', gameId: gameId, joinId: incorrectJoinId, // Wrong joinId
                    side: 0, role: ChessClientRole.Anonymous
                } as ChessClientRequest;
                const response = await server.leave(request);
                expect(response.data).toBeUndefined();
                expect(response.error).toBe('Join record not found for this leave operation');
          });
    });

    describe('_move', () => {
         it('should allow a valid move and update game state', async () => {
            const server = new LocalChessServer(ChessClient);
            server['_users'][testUserId1] = true;
            server['_users'][testUserId2] = true;
             // User1 creates & joins White
             const res1 = await server.create({
                  ...createBaseRequest(testUserId1, testClientId1),
                  operation: 'create', side: 1, role: ChessClientRole.Player
             } as ChessClientRequest);
             const gameId = res1.data!.gameId;
             const joinId1 = res1.data!.joinId!;

             // User2 joins Black -> status becomes 'ready'
             const res2 = await server.join({
                  ...createBaseRequest(testUserId2, testClientId2),
                  operation: 'join', gameId: gameId, side: 2, role: ChessClientRole.Player
             } as ChessClientRequest);
             // const joinId2 = res2.data!.joinId!; // Not needed here
             expect(server.getGameState(gameId)?.status).toBe('ready');

             const request: ChessClientRequest = {
                 ...createBaseRequest(testUserId1, testClientId1), // White's turn
                 operation: 'move',
                 gameId: gameId,
                 joinId: joinId1,
                 side: 1,
                 role: ChessClientRole.Player,
                 move: { from: 'e2', to: 'e4' }
             } as ChessClientRequest;

             const response = await server.move(request);

             expect(response.error).toBeUndefined();
             expect(response.data).toBeDefined();
             expect(response.data?.gameId).toBe(gameId);
             expect(response.data?.fen).toContain('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3'); // FEN after e4
             expect(response.data?.status).toBe('continue');
             expect(server.getGameState(gameId)?.fen).toBe(response.data!.fen);
             expect(server.getGameState(gameId)?.status).toBe('continue');
         });

         it('should return error for an invalid move', async () => {
            const server = new LocalChessServer(ChessClient);
            server['_users'][testUserId1] = true;
            server['_users'][testUserId2] = true;
             // User1 creates & joins White
             const res1 = await server.create({
                  ...createBaseRequest(testUserId1, testClientId1),
                  operation: 'create', side: 1, role: ChessClientRole.Player
             } as ChessClientRequest);
             const gameId = res1.data!.gameId;
             const joinId1 = res1.data!.joinId!;

             // User2 joins Black -> status becomes 'ready'
             const res2 = await server.join({
                  ...createBaseRequest(testUserId2, testClientId2),
                  operation: 'join', gameId: gameId, side: 2, role: ChessClientRole.Player
             } as ChessClientRequest);
             // const joinId2 = res2.data!.joinId!; // Not needed here
             expect(server.getGameState(gameId)?.status).toBe('ready');

             const request: ChessClientRequest = {
                 ...createBaseRequest(testUserId1, testClientId1), // White's turn
                 operation: 'move', gameId: gameId, joinId: joinId1,
                 side: 1, role: ChessClientRole.Player,
                 move: { from: 'e2', to: 'e5' } // Invalid pawn move
             } as ChessClientRequest;

             const response = await server.move(request);

             expect(response.error).toContain('Invalid move');
             expect(response.data).toBeDefined(); // Should still return current state
             expect(response.data?.fen).toBe(server.getGameState(gameId)?.fen); // FEN should not change
             expect(response.data?.status).toBe('ready'); // Status should not change
         });

         it('should return error if moving in a game that is not ready or continue', async () => {
            const server = new LocalChessServer(ChessClient);
            server['_users'][testUserId1] = true;
            server['_users'][testUserId2] = true;
             // User1 creates & joins White
             const res1 = await server.create({
                  ...createBaseRequest(testUserId1, testClientId1),
                  operation: 'create', side: 1, role: ChessClientRole.Player
             } as ChessClientRequest);
             const gameId = res1.data!.gameId;
             const joinId1 = res1.data!.joinId!;

             // User2 joins Black -> status becomes 'ready'
             const res2 = await server.join({
                  ...createBaseRequest(testUserId2, testClientId2),
                  operation: 'join', gameId: gameId, side: 2, role: ChessClientRole.Player
             } as ChessClientRequest);
             // const joinId2 = res2.data!.joinId!; // Not needed here
             expect(server.getGameState(gameId)?.status).toBe('ready');

              // Set status to 'await' manually for testing
              server.getGameState(gameId)!.status = 'await';

             const request: ChessClientRequest = {
                  ...createBaseRequest(testUserId1, testClientId1), // White's turn
                  operation: 'move', gameId: gameId, joinId: joinId1,
                  side: 1, role: ChessClientRole.Player,
                  move: { from: 'e2', to: 'e4' }
             } as ChessClientRequest;
             const response = await server.move(request);
             expect(response.error).toBe('Game not playable (status: await)');
             expect(response.data).toBeUndefined();
         });

         it('should return error if wrong player tries to move', async () => {
              const server = new LocalChessServer(ChessClient);
              server['_users'][testUserId1] = true;
              server['_users'][testUserId2] = true;
              // User1 creates & joins White
              const res1 = await server.create({
                   ...createBaseRequest(testUserId1, testClientId1),
                   operation: 'create', side: 1, role: ChessClientRole.Player
              } as ChessClientRequest);
              const gameId = res1.data!.gameId;
              // const joinId1 = res1.data!.joinId!; // Not needed here

              // User2 joins Black -> status becomes 'ready'
              const res2 = await server.join({
                   ...createBaseRequest(testUserId2, testClientId2),
                   operation: 'join', gameId: gameId, side: 2, role: ChessClientRole.Player
              } as ChessClientRequest);
              const joinId2 = res2.data!.joinId!;
              expect(server.getGameState(gameId)?.status).toBe('ready');

               // It's White's turn initially
               const request: ChessClientRequest = {
                   ...createBaseRequest(testUserId2, testClientId2), // Black tries to move
                   operation: 'move', gameId: gameId, joinId: joinId2,
                   side: 2, role: ChessClientRole.Player,
                   move: { from: 'e7', to: 'e5' }
               } as ChessClientRequest;
               const response = await server.move(request);
               expect(response.error).toContain("It's white's turn to move"); // Error from chess.js via server
               expect(response.data).toBeDefined();
               expect(response.data?.status).toBe('ready'); // Status doesn't change
         });

          it('should return error if a non-player tries to move', async () => {
               const server = new LocalChessServer(ChessClient);
               server['_users'][testUserId1] = true;
               server['_users'][testUserId2] = true;
               // User1 creates & joins White
               const res1 = await server.create({
                    ...createBaseRequest(testUserId1, testClientId1),
                    operation: 'create', side: 1, role: ChessClientRole.Player
               } as ChessClientRequest);
               const gameId = res1.data!.gameId;
               // const joinId1 = res1.data!.joinId!; // Not needed here

               // User2 joins Black -> status becomes 'ready'
               const res2 = await server.join({
                    ...createBaseRequest(testUserId2, testClientId2),
                    operation: 'join', gameId: gameId, side: 2, role: ChessClientRole.Player
               } as ChessClientRequest);
               // const joinId2 = res2.data!.joinId!; // Not needed here
               expect(server.getGameState(gameId)?.status).toBe('ready');

                const spectatorUserId = uuidv4();
                server['_users'][spectatorUserId] = true;
                const spectatorClientId = uuidv4();
                // Spectator joins
                const joinRes = await server.join({
                     ...createBaseRequest(spectatorUserId, spectatorClientId),
                     operation: 'join', gameId: gameId, side: 0, role: ChessClientRole.Voter // Or Anonymous
                } as ChessClientRequest);
                const spectatorJoinId = joinRes.data!.joinId!;


                const request: ChessClientRequest = {
                    ...createBaseRequest(spectatorUserId, spectatorClientId), // Spectator tries to move
                    operation: 'move', gameId: gameId, joinId: spectatorJoinId,
                    side: 0, // Actual side spectator joined with
                    role: ChessClientRole.Voter, // Actual role spectator joined with
                    move: { from: 'e2', to: 'e4' }
                } as ChessClientRequest;
                const response = await server.move(request);
                 // The public move validation might catch side!=1|2 first
                 // Let's adjust the request to pass initial validation but fail internal logic
                  const requestPassingValidation: ChessClientRequest = {
                      ...createBaseRequest(spectatorUserId, spectatorClientId),
                      operation: 'move', gameId: gameId, joinId: spectatorJoinId,
                      side: 0, // Actual side spectator joined with
                      role: ChessClientRole.Voter, // Actual role spectator joined with
                      move: { from: 'e2', to: 'e4' }
                  } as ChessClientRequest;
                  const response2 = await server.move(requestPassingValidation);

                  // Now it should fail the public validation because side must be 1 or 2
                  // Or if public validation is bypassed/changed, it should fail internal role check.
                  // Let's expect the public validation error first.
                  expect(response2.error).toContain('side must be 1 or 2 for move');
                  expect(response2.data).toBeUndefined();
          });
    });
});
