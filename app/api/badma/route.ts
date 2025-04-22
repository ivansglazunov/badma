import http from 'http';
import { NextRequest, NextResponse } from 'next/server';
import { WebSocket, WebSocketServer } from 'ws';
import { proxyGET, proxyPOST, proxySOCKET } from 'hasyx/lib/graphql-proxy';

export async function POST(request: NextRequest): Promise<NextResponse> {
  return NextResponse.json(
    {
      // ответ в стандарте ChessServer <=> ChessClient
    },
    { status: 200 } // всегда позитивный статус
  );
}

export function SOCKET(
  client: WebSocket,
  request: http.IncomingMessage,
  server: WebSocketServer
): void {
  // пока не реализовываем
} 