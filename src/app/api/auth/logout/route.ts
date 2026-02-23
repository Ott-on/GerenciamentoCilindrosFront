import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = 'http://44.220.143.197:8080';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      console.log('[AUTH/LOGOUT] Nenhum token de autorização fornecido');
      return NextResponse.json(
        { error: 'Token de autorização ausente' },
        { status: 401 }
      );
    }

    console.log('[AUTH/LOGOUT] Iniciando logout');

    const backendUrl = `${BACKEND_URL}/auth/logout`;
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    });

    console.log('[AUTH/LOGOUT] Backend status:', response.status);
    
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      console.error('[AUTH/LOGOUT] Erro:', data);
      return NextResponse.json(data, { status: response.status });
    }

    console.log('[AUTH/LOGOUT] Sucesso ao fazer logout');
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[AUTH/LOGOUT] Erro ao fazer logout:', error);
    return NextResponse.json(
      { error: 'Erro ao fazer logout' },
      { status: 500 }
    );
  }
}
