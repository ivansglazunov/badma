import { NextRequest, NextResponse } from 'next/server';
import Debug from '../debug';

const debug = Debug('cors');

/**
 * Apply CORS headers to a response object
 * @param response - The NextResponse object to add headers to
 * @param origin - Origin to allow, defaults to '*' (all origins)
 * @returns The response with CORS headers
 */
export function applyCorsHeaders(
  response: NextResponse,
  origin: string = '*'
): NextResponse {
  debug(`Applying CORS headers with origin: ${origin}`);
  
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Hasura-Role, X-Hasura-User-Id');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  
  return response;
}

/**
 * Handle CORS and process the request
 * @param request - The incoming request
 * @param handler - Function that processes the request and returns a response
 * @returns Response with appropriate CORS headers
 */
export async function withCors(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse> | NextResponse | any
): Promise<NextResponse> {
  const requestOrigin = request.headers.get('Origin') || '*';
  
  // Handle preflight OPTIONS request
  if (request.method === 'OPTIONS') {
    debug('Handling OPTIONS preflight request from origin:', requestOrigin);
    const response = new NextResponse(null, { status: 204 });
    return applyCorsHeaders(response, requestOrigin);
  }
  
  // Process the request with the handler
  try {
    const response = await handler(request);
    
    // Проверяем, что response является экземпляром NextResponse
    // Это должно решить проблему сравнения с оператором '<'
    if (!(response instanceof NextResponse)) {
      debug('Handler returned non-NextResponse object, converting to NextResponse');
      // Если response не является NextResponse, преобразуем его
      return applyCorsHeaders(NextResponse.json(response), requestOrigin);
    }
    
    return applyCorsHeaders(response, requestOrigin);
  } catch (error) {
    debug(`Error handling request: ${error}`);
    const errorResponse = NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
    return applyCorsHeaders(errorResponse, requestOrigin);
  }
}

export default withCors; 