import NextAuth from 'next-auth';
// import GitHubProvider from 'next-auth/providers/github'; // Uncomment if needed
// import { HasuraAdapter } from '@auth/hasura-adapter'; // REMOVE ADAPTER
import Debug from 'hasyx/lib/debug'; // Import from new path
import authOptions from '../../../options';
import { NextRequest, NextResponse } from 'next/server';
import { withCors } from 'hasyx/lib/cors';

// Provide static params for [...nextauth] route for static export
export function generateStaticParams() {
  return [
    { nextauth: ['signin'] },
    { nextauth: ['signout'] },
    { nextauth: ['session'] },
    { nextauth: ['providers'] }
  ];
}

// Create logger function for this module
const debug = Debug('auth:next-auth'); 

const authHandler = NextAuth(authOptions);

// Wrap original handler to add CORS support
export async function GET(request: NextRequest) {
  debug('GET auth route handler');

  try {
    // Получаем URL и параметры запроса
    const url = new URL(request.url);
    const path = url.pathname.split('/').slice(4); // ['session'] или ['signin'] и т.д.
    
    debug(`Processing GET request for path: ${path.join('/')}`);
    
    // Передаем запрос в NextAuth и ждем результат
    // Оборачиваем все в try/catch для дополнительной безопасности
    const response = await authHandler(request as any);
    
    debug('Got response from NextAuth handler');
    
    // Добавляем CORS заголовки
    const origin = request.headers.get('Origin') || '*';
    const result = new NextResponse(response.body);
    
    // Копируем все заголовки
    response.headers.forEach((value, key) => {
      result.headers.set(key, value);
    });
    
    // Добавляем CORS заголовки
    result.headers.set('Access-Control-Allow-Origin', origin);
    result.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    result.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Hasura-Role, X-Hasura-User-Id');
    result.headers.set('Access-Control-Allow-Credentials', 'true');
    
    return result;
    
  } catch (error) {
    debug('Error in GET handler:', error);
    return NextResponse.json(
      { error: 'Authentication error' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Hasura-Role, X-Hasura-User-Id',
          'Access-Control-Allow-Credentials': 'true'
        }
      }
    );
  }
}

// Обработчик POST запросов
export async function POST(request: NextRequest) {
  debug('POST auth route handler');
  
  try {
    // Аналогично GET-обработчику
    const response = await authHandler(request as any);
    
    // Добавляем CORS заголовки
    const origin = request.headers.get('Origin') || '*';
    const result = new NextResponse(response.body);
    
    // Копируем все заголовки
    response.headers.forEach((value, key) => {
      result.headers.set(key, value);
    });
    
    // Добавляем CORS заголовки
    result.headers.set('Access-Control-Allow-Origin', origin);
    result.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    result.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Hasura-Role, X-Hasura-User-Id');
    result.headers.set('Access-Control-Allow-Credentials', 'true');
    
    return result;
    
  } catch (error) {
    debug('Error in POST handler:', error);
    return NextResponse.json(
      { error: 'Authentication error' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Hasura-Role, X-Hasura-User-Id',
          'Access-Control-Allow-Credentials': 'true'
        }
      }
    );
  }
}

// Обработчик OPTIONS запросов для CORS
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    {},
    { 
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Hasura-Role, X-Hasura-User-Id',
        'Access-Control-Allow-Credentials': 'true'
      }
    }
  );
}
