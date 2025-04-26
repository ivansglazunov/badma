import http from 'http';
import { NextRequest, NextResponse } from 'next/server';
import { WebSocket, WebSocketServer } from 'ws';
// Remove unused proxy imports if no longer needed after refactor
// import { proxyGET, proxyPOST, proxySOCKET } from 'hasyx/lib/graphql-proxy'; 
import { HasyxChessServer } from '@/lib/hasyx-chess-server';
import { Hasyx, createApolloClient, Generator, getTokenFromRequest } from 'hasyx';
// Ensure verifyJWT path is correct if used directly
import { verifyJWT } from 'hasyx/lib/jwt'; // Adjusted path assuming it comes from hasyx lib
import schema from '@/public/hasura-schema.json';
import Debug from '@/lib/debug';
import { ChessClientRequest, ChessServerResponse, ChessClientMove, ChessClientSide, ChessClientRole } from '@/lib/chess-client';
import { WsClientsManager } from 'hasyx';

const debug = Debug('api:badma');

// For static export (Capacitor) - Revisit if GET handler needs dynamic behavior
// export const dynamic = 'force-static';

// Ensure environment variables are available
const hasuraAdminSecret = process.env.HASURA_ADMIN_SECRET;
const nextAuthSecret = process.env.NEXTAUTH_SECRET;

if (!hasuraAdminSecret) {
  console.error('ERROR: HASURA_ADMIN_SECRET environment variable is not set.');
  debug('API route startup error: HASURA_ADMIN_SECRET is missing');
}
if (!nextAuthSecret) {
  console.error('ERROR: NEXTAUTH_SECRET environment variable is not set. Required for authentication.');
  debug('API route startup error: NEXTAUTH_SECRET is missing');
}

// Create new instances for each request - This might be fine, but consider if they need re-creation per request
const apolloClient = createApolloClient({ secret: hasuraAdminSecret });
const generate = Generator(schema as any); // Cast schema if necessary
const hasyx = new Hasyx(apolloClient, generate);

// --- GET Handler --- 
export async function GET(request: NextRequest) {
  debug('Received GET request');

  // --- FULL REQUEST DIAGNOSTICS --- 
  debug('REQUEST DIAGNOSTICS START --------------------------------');
  debug('request.url (raw):', request.url);
  debug('request.method:', request.method);
  
  // Log the full nextUrl object and its properties
  try {
    // It seems logging the full object might cause issues, log key parts:
    debug('request.nextUrl.href:', request.nextUrl?.href);
    debug('request.nextUrl.pathname:', request.nextUrl?.pathname);
    debug('request.nextUrl.search:', request.nextUrl?.search); // The raw query string?
    // Explicitly try to get the 'auth_token' using the standard method
    const searchParamToken = request.nextUrl?.searchParams?.get('auth_token');
    debug('Attempting request.nextUrl.searchParams.get(auth_token):', searchParamToken);
  } catch (urlError) {
    debug('Error accessing/logging request.nextUrl properties:', urlError);
  }

  // Log all headers using request.headers.entries()
  try {
    const allHeaders: Record<string, string> = {};
    // @ts-ignore
    for (const [key, value] of request.headers.entries()) {
      allHeaders[key] = value;
    }
    debug('request.headers (all entries):', allHeaders);
    // Explicitly try to get the 'Authorization' header
    const authHeaderFromHeaders = request.headers?.get('Authorization');
    debug('Attempting request.headers.get(Authorization):', authHeaderFromHeaders);
  } catch (headersError) {
    debug('Error accessing/logging request.headers:', headersError);
  }
  
  debug('REQUEST DIAGNOSTICS END ----------------------------------');
  
  // --- Authentication --- 
  let token;
  let userId;
  try {
    if (!nextAuthSecret) {
        throw new Error('Authentication secret is not configured on the server.');
    }
    
    // Try to get token from request (getTokenFromRequest should handle headers/cookies)
    token = await getTokenFromRequest(request); 
    debug('Result from getTokenFromRequest:', token ? { sub: token.sub, provider: token.provider } : null);
    
    // Note: Fallback logic for URL token is now handled inside getTokenFromRequest
    // No need for separate fallback here if getTokenFromRequest is working as expected
    
    if (!token || !token.sub) {
      debug('Authentication failed: No token or token subject (userId) found');
      const response: ChessServerResponse = { error: 'Unauthorized: Missing or invalid token' };
      // For GET, standard practice is 401 Unauthorized, but keeping 200 as per original code for now
      return NextResponse.json(response, { status: 200 }); // Always 200 as requested?
    }
    userId = token.sub; // Use the user ID from the token
    debug(`Authenticated user: ${userId}`);
  } catch (error: any) {
    debug('Authentication error:', error);
    const response: ChessServerResponse = { error: `Authentication failed: ${error.message}` };
    return NextResponse.json(response, { status: 200 }); // Always 200?
  }

  // --- Request Data Extraction from Query Params --- 
  let clientRequestData: Partial<ChessClientRequest>;
  try {
    debug('Extracting client request data from query parameters...');
    const params = request.nextUrl.searchParams;
    
    // Helper function to safely get and parse parameters
    const getParam = <T>(key: string, parseFn?: (val: string) => T): T | undefined => {
        const value = params.get(key);
        if (value === null || value === undefined) return undefined;
        if (parseFn) {
            try {
                return parseFn(value);
            } catch (e) {
                debug(`Error parsing param '${key}' with value '${value}':`, e);
                throw new Error(`Invalid format for parameter '${key}'.`);
            }
        } 
        return value as unknown as T; // Basic string assignment
    };

    // Parse potentially JSON stringified values
    const parseJsonParam = <T>(key: string): T | undefined => {
        return getParam(key, (val) => JSON.parse(val));
    };
    
    // Parse number parameters
    const parseNumberParam = (key: string): number | undefined => {
        return getParam(key, (val) => {
            const num = Number(val);
            if (isNaN(num)) throw new Error('Not a number');
            return num;
        });
    };

    // Reconstruct the request object
    clientRequestData = {
        operation: getParam<'create' | 'join' | 'leave' | 'move' | 'sync'>('operation'),
        clientId: getParam<string>('clientId'),
        // userId is injected from token, no need to parse from params
        gameId: getParam<string>('gameId'),
        joinId: getParam<string>('joinId'),
        side: parseNumberParam('side') as ChessClientSide | undefined,
        role: parseNumberParam('role') as ChessClientRole | undefined,
        move: parseJsonParam<ChessClientMove>('move'), // Expect move to be JSON string
        updatedAt: parseNumberParam('updatedAt'),
        createdAt: parseNumberParam('createdAt'),
    };

    debug('Reconstructed client request data from params:', clientRequestData);

    // Validation (ensure required fields are present based on operation)
    if (!clientRequestData.operation) throw new Error('operation parameter is required');
    if (!clientRequestData.clientId) throw new Error('clientId parameter is required');
    if (!clientRequestData.updatedAt) throw new Error('updatedAt parameter is required');
    if (!clientRequestData.createdAt) throw new Error('createdAt parameter is required');
    // Add more specific validation based on operation if needed
    if (clientRequestData.operation === 'move' && !clientRequestData.move) throw new Error ('move parameter is required for move operation');
    if (clientRequestData.operation === 'join' && clientRequestData.side === undefined) throw new Error ('side parameter is required for join operation');
    if (clientRequestData.operation === 'join' && clientRequestData.role === undefined) throw new Error ('role parameter is required for join operation');
    // ... add other validations

  } catch (error: any) {
    debug('Failed to parse request data from query params:', error);
    const response: ChessServerResponse = { error: `Bad Request: ${error.message}` };
    return NextResponse.json(response, { status: 200 }); // Always 200?
  }

  // --- Server Instantiation & Request Processing --- 
  let serverResponse: ChessServerResponse;
  try {
    // Prepare the request data for the server, injecting the authenticated userId
    const serverRequestData: ChessClientRequest = {
      // Now use the parsed data
      operation: clientRequestData.operation!,
      clientId: clientRequestData.clientId!,
      userId: userId,       // OVERWRITE userId with authenticated one
      updatedAt: clientRequestData.updatedAt!,
      createdAt: clientRequestData.createdAt!,
      // Optional fields from parsed data
      gameId: clientRequestData.gameId,
      joinId: clientRequestData.joinId,
      side: clientRequestData.side,
      role: clientRequestData.role,
      move: clientRequestData.move,
    };

    const server = new HasyxChessServer(hasyx);

    debug('Sending request to HasyxChessServer:', serverRequestData);
    serverResponse = await server.request(serverRequestData);
    debug('Received response from HasyxChessServer:', serverResponse);

  } catch (error: any) {
    debug('Error during server interaction:', error);
    serverResponse = { error: `Server error: ${error.message}` };
  }

  // --- Final Response --- 
  // Always return 200, with success/error details in the body
  return NextResponse.json(serverResponse, { status: 200 });
}

// Remove the old GET route that just checked auth status, 
// as the main GET handler now handles the requests.
// export async function GET(request: NextRequest) { ... } 

// --- SOCKET Handler (Remains the same) --- 
const clients = WsClientsManager('/api/badma');
export function SOCKET(
  client: WebSocket,
  request: http.IncomingMessage,
  server: WebSocketServer
): void {
  const clientId = clients.Client(client);
  
  (async () => {
    const user = await clients.parseUser(request, clientId);
    if (user) {
      debug(`SOCKET /api/badma (${clientId}): User authenticated as ${user.sub}`);
      client.send(JSON.stringify({
        type: 'auth_status',
        authenticated: true,
        userId: user.sub,
        token: user
      }));
    } else {
      debug(`SOCKET /api/badma (${clientId}): No valid user found`);
      client.send(JSON.stringify({
        type: 'auth_status',
        authenticated: false
      }));
    }
  })();

  client.on('message', (data: WebSocket.Data) => {
    // Process chess-related WebSocket messages here
    debug(`SOCKET /api/badma (${clientId}): Message received:`, data.toString());
    
    // TODO: Implement chess WebSocket protocol
  });

  client.on('close', () => {
    debug(`SOCKET /api/badma (${clientId}): Client disconnected.`);
    clients.delete(clientId);
  });

  client.on('error', (error: Error) => {
    debug(`SOCKET /api/badma (${clientId}): Connection error:`, error);
    clients.delete(clientId);
  });
} 