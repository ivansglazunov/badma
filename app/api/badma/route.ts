import http from 'http';
import { NextRequest, NextResponse } from 'next/server';
import { WebSocket, WebSocketServer } from 'ws';
import { proxyGET, proxyPOST, proxySOCKET } from 'hasyx/lib/graphql-proxy';
import { HasyxChessServer } from '@/lib/hasyx-chess-server';
import { Hasyx, createApolloClient, Generator, getTokenFromRequest } from 'hasyx';
import schema from '@/public/hasura-schema.json';
import Debug from '@/lib/debug';
import { ChessClientRequest, ChessServerResponse } from '@/lib/chess-client';

const debug = Debug('api:badma');

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

// Create new instances for each request
const apolloClient = createApolloClient({ secret: hasuraAdminSecret });
const generate = Generator(schema as any); // Cast schema if necessary
const hasyx = new Hasyx(apolloClient, generate);

export async function POST(request: NextRequest) {
  debug('Received POST request');

  // --- Authentication --- 
  let token;
  let userId;
  try {
    if (!nextAuthSecret) {
        throw new Error('Authentication secret is not configured on the server.');
    }
    token = await getTokenFromRequest(request);
    if (!token || !token.sub) {
      debug('Authentication failed: No token or token subject (userId) found');
      const response: ChessServerResponse = { error: 'Unauthorized: Missing or invalid token' };
      return NextResponse.json(response, { status: 200 }); // Always 200 as requested
    }
    userId = token.sub; // Use the user ID from the token
    debug(`Authenticated user: ${userId}`);
  } catch (error: any) {
    debug('Authentication error:', error);
    const response: ChessServerResponse = { error: `Authentication failed: ${error.message}` };
    return NextResponse.json(response, { status: 200 }); // Always 200
  }

  // --- Request Body Parsing --- 
  let clientRequestData: Partial<ChessClientRequest>;
  try {
    clientRequestData = await request.json();
    debug('Parsed client request data:', clientRequestData);
    if (!clientRequestData || typeof clientRequestData !== 'object') {
        throw new Error('Invalid request body format.');
    }
  } catch (error: any) {
    debug('Failed to parse request body:', error);
    const response: ChessServerResponse = { error: `Bad Request: ${error.message}` };
    return NextResponse.json(response, { status: 200 }); // Always 200
  }

  // --- Server Instantiation & Request Processing --- 
  let serverResponse: ChessServerResponse;
  try {
    // Prepare the request data for the server, injecting the authenticated userId
    // Also add timestamps if they are missing from the client request
    const serverRequestData: ChessClientRequest = {
      ...clientRequestData, // Spread client data first
      userId: userId,       // OVERWRITE userId with authenticated one
      operation: clientRequestData.operation!, // Assume operation exists from parsing check
      clientId: clientRequestData.clientId!,   // Assume clientId exists
      updatedAt: clientRequestData.updatedAt || Date.now(), // Add timestamp if missing
      createdAt: clientRequestData.createdAt || Date.now(), // Add timestamp if missing
      // Explicitly include optional fields only if they exist in the client data
      ...(clientRequestData.gameId && { gameId: clientRequestData.gameId }),
      ...(clientRequestData.joinId && { joinId: clientRequestData.joinId }),
      ...(clientRequestData.side !== undefined && { side: clientRequestData.side }), // side can be 0
      ...(clientRequestData.role !== undefined && { role: clientRequestData.role }), // role can be 0
      ...(clientRequestData.move && { move: clientRequestData.move }),
    };

    // Perform basic validation for required fields based on operation
    if (!serverRequestData.clientId) {
        throw new Error('clientId is required in the request body.');
    }
    // Add more specific validation here if needed...

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

export async function GET(request: NextRequest) {
  // пока не реализовываем
}

export function SOCKET(
  client: WebSocket,
  request: http.IncomingMessage,
  server: WebSocketServer
): void {
  // пока не реализовываем
} 