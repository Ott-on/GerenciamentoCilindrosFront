import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';

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
        'ngrok-skip-browser-warning': '69420',
        'User-Agent': 'PostmanRuntime/7.32.3',
      },
      body: JSON.stringify(body),
    });

    console.log('[AUTH/REFRESH] Backend status:', response.status);

    const responseText = await response.text();

    // Detecta se o backend retornou HTML em vez de JSON
    if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
      console.error('[AUTH/REFRESH] Backend retornou HTML em vez de JSON:', responseText.substring(0, 200));
      return NextResponse.json(
        { error: 'Backend retornou HTML em vez de JSON' },
        { status: 502 }
      );
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error('[AUTH/REFRESH] Erro ao parsear JSON:', responseText.substring(0, 200));
      return NextResponse.json(
        { error: 'Resposta inválida do backend' },
        { status: 502 }
      );
    }
    
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

