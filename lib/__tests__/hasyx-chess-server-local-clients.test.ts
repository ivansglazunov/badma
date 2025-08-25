import dotenv from 'dotenv';
import { createApolloClient } from 'hasyx/lib/apollo/apollo';
import { Generator } from 'hasyx/lib/generator';
import { Hasyx } from 'hasyx/lib/hasyx/hasyx';
import { v4 as uuidv4 } from 'uuid';
import schema from '../../public/hasura-schema.json';
import { ChessClientRole } from '../chess-client';
import Debug from '../debug';
import { HasyxChessServer } from '../hasyx-chess-server';
import { LocalChessClient } from '../local-chess-client';

dotenv.config();

const debug = Debug('test:hasyx-chess-client');

const isLocal = !!+process.env.JEST_LOCAL!;
(!isLocal ? describe : describe.skip)('HasyxChessClient <-> HasyxChessServer Interaction', () => {

    it('should handle a full game cycle (Fools Mate)', async () => {
        debug('Starting Fool\'s Mate test');

        // 1. Setup Server and Users
        const hasyx = new Hasyx(createApolloClient({
        secret: process.env.HASURA_ADMIN_SECRET,
        }), Generator(schema)); // Pass LocalChessClient constructor

        const server = new HasyxChessServer(hasyx);
        
        const userId1 = await server.__addUser();
        const userId2 = await server.__addUser();

        expect(userId1).toBeDefined();
        expect(userId2).toBeDefined();

        // 2. Setup Clients
        const whiteClient = new LocalChessClient<HasyxChessServer>(server);
        whiteClient.clientId = uuidv4();
        whiteClient.userId = userId1;
        expect(whiteClient.userId).toBe(userId1);
        
        const blackClient = new LocalChessClient<HasyxChessServer>(server);
        blackClient.clientId = uuidv4();
        blackClient.userId = userId2;
        expect(blackClient.userId).toBe(userId2);

        debug(`White Client ID: ${whiteClient.clientId}, User ID: ${whiteClient.userId}`);
        debug(`Black Client ID: ${blackClient.clientId}, User ID: ${blackClient.userId}`);

        // 3. White Creates Game
        debug('White creating game...');
        const createResponse = await whiteClient.asyncCreate(1); // White is side 1
        expect(whiteClient.userId).toBe(userId1);
        expect(createResponse.error).toBeUndefined();
        expect(createResponse.data).toBeDefined();
        const gameId = createResponse.data!.gameId!;
        expect(gameId).toBeDefined();
        debug(`Game created by White. Game ID: ${gameId}, White Join ID: ${whiteClient.joinId}`);
        expect(whiteClient.gameId).toBe(gameId);

        // 4. White Joins Game
        debug('White joining game...');
        const joinWhiteResponse = await whiteClient.asyncJoin(1, ChessClientRole.Player); // White is side 1
        expect(joinWhiteResponse.error).toBeUndefined();
        expect(joinWhiteResponse.data).toBeDefined();
        debug(`White joined game. White Join ID: ${whiteClient.joinId}`);
        expect(whiteClient.side).toBe(1);
        expect(whiteClient.status).toBe('await');
        
        // 5. Black Joins Game
        debug('Black joining game...');
        blackClient.gameId = gameId; // Manually set gameId for black client
        const joinBlackResponse = await blackClient.asyncJoin(2, ChessClientRole.Player); // Black is side 2
        expect(joinBlackResponse.error).toBeUndefined();
        expect(joinBlackResponse.data).toBeDefined();
        debug(`Black joined game. Black Join ID: ${blackClient.joinId}`);
    }, 100000);
}); 