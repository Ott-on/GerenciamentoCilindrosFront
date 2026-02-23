import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = 'http://44.220.143.197:8080';

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleProxyRequest(req, params, 'GET');
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleProxyRequest(req, params, 'POST');
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleProxyRequest(req, params, 'PUT');
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleProxyRequest(req, params, 'DELETE');
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleProxyRequest(req, params, 'PATCH');
}

async function handleProxyRequest(
  req: NextRequest,
  paramsPromise: Promise<{ path: string[] }>,
  method: string
) {
  try {
    const params = await paramsPromise;
    const pathSegments = params.path || [];
    const pathString = pathSegments.join('/');

    // Monta a URL do backend
    const backendUrl = new URL(`${BACKEND_URL}/${pathString}`);
    backendUrl.search = req.nextUrl.search;

    console.log(`[PROXY] ${method} ${backendUrl.toString()}`);

    // Prepara os headers, mantendo os de autorização
    const headers = new Headers();
    
    // Copia headers importantes
    req.headers.forEach((value, key) => {
      // Evita copiar headers que podem causar problemas
      if (
        !key.toLowerCase().startsWith('host') &&
        !key.toLowerCase().startsWith('connection') &&
        !key.toLowerCase().startsWith('content-length')
      ) {
        headers.set(key, value);
      }
    });

    // Garante Content-Type
    if (!headers.has('content-type')) {
      headers.set('content-type', 'application/json');
    }

    console.log(`[PROXY] Headers enviados:`, {
      authorization: headers.get('authorization') ? 'present' : 'missing',
      contentType: headers.get('content-type'),
    });

    // Prepara o body para POST/PUT/PATCH
    let body: string | undefined;
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      body = await req.text();
    }

    // Faz a requisição para o backend
    const backendResponse = await fetch(backendUrl.toString(), {
      method,
      headers,
      body,
      credentials: 'omit',
    });

    console.log(`[PROXY] Backend respondeu com status: ${backendResponse.status}`);

    // Lê a resposta
    const responseBody = await backendResponse.text();

    // Retorna a resposta
    return new NextResponse(responseBody, {
      status: backendResponse.status,
      headers: {
        'Content-Type': backendResponse.headers.get('content-type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[PROXY] Erro ao fazer proxy:', error);
    return NextResponse.json(
      { error: 'Erro ao fazer proxy para o backend' },
      { status: 500 }
    );
  }
}
