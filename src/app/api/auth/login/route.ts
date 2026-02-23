import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = 'http://44.220.143.197:8080';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    console.log('[AUTH/LOGIN] Iniciando login', { matricula: body.matricula });

    const backendUrl = `${BACKEND_URL}/auth/login`;
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    console.log('[AUTH/LOGIN] Backend status:', response.status);
    
    if (!response.ok) {
      console.error('[AUTH/LOGIN] Erro:', data);
      return NextResponse.json(data, { status: response.status });
    }

    console.log('[AUTH/LOGIN] Sucesso ao fazer login');
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('[AUTH/LOGIN] Erro ao fazer login:', error);
    return NextResponse.json(
      { error: 'Erro ao fazer login' },
      { status: 500 }
    );
  }
}
