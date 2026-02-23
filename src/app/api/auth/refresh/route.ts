import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = 'http://44.220.143.197:8080';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    console.log('[AUTH/REFRESH] Iniciando refresh do token');
    console.log('[AUTH/REFRESH] Payload:', { ...body, refresh_token: '[REDACTED]' });

    const backendUrl = `${BACKEND_URL}/auth/refresh`;
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    console.log('[AUTH/REFRESH] Backend status:', response.status);
    
    if (!response.ok) {
      console.error('[AUTH/REFRESH] Erro:', data);
      return NextResponse.json(data, { status: response.status });
    }

    console.log('[AUTH/REFRESH] Sucesso ao atualizar token');
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('[AUTH/REFRESH] Erro ao fazer refresh:', error);
    return NextResponse.json(
      { error: 'Erro ao fazer refresh do token' },
      { status: 500 }
    );
  }
}
