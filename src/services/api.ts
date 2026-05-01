
import { getSession, signOut } from "next-auth/react";
import type { Session } from "next-auth";

// Cache da sessão para deduplicar chamadas concorrentes a getSession()
// Evita o flood de GET /api/auth/session quando múltiplos hooks montam ao mesmo tempo
let cachedSession: Session | null = null;
let sessionPromise: Promise<Session | null> | null = null;
let sessionCacheTime = 0;
const SESSION_CACHE_TTL_MS = 5000; // 5 segundos de cache

async function getCachedSession(): Promise<Session | null> {
  const now = Date.now();

  // Se a sessão está em cache e ainda é válida, retorna direto
  if (cachedSession && (now - sessionCacheTime) < SESSION_CACHE_TTL_MS) {
    return cachedSession;
  }

  // Se já há uma requisição de sessão em andamento, reutiliza a mesma Promise
  if (sessionPromise) {
    return sessionPromise;
  }

  // Nova requisição de sessão
  sessionPromise = getSession().then((session) => {
    cachedSession = session;
    sessionCacheTime = Date.now();
    sessionPromise = null;
    return session;
  }).catch((err) => {
    sessionPromise = null;
    throw err;
  });

  return sessionPromise;
}

// Invalida o cache (usado após 401 para forçar novo getSession)
function invalidateSessionCache() {
  cachedSession = null;
  sessionCacheTime = 0;
}

const api = async <T = unknown>(url: string, options: RequestInit = {}): Promise<T> => {
  const session = await getCachedSession();

  if (!session) {
    signOut({ callbackUrl: '/' });
    throw new Error("Não autenticado");
  }
  
  if (session.error === "RefreshAccessTokenError") {
    signOut({ callbackUrl: '/' });
    throw new Error("Sessão expirada. Por favor, faça o login novamente.");
  }

  const makeRequest = async (token: string | undefined) => {
    const headers = {
      ...options.headers,
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': '69420',
      'User-Agent': 'PostmanRuntime/7.32.3',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
    return fetch(url, { ...options, headers });
  };

  let response = await makeRequest(session.accessToken);

  // Retry com sessão atualizada em caso de 401
  if (response.status === 401) {
    console.warn(`[API] 401 em ${url}, tentando refresh de sessão...`);
    invalidateSessionCache();
    const newSession = await getCachedSession();

    if (newSession?.error === "RefreshAccessTokenError" || !newSession?.accessToken) {
      await signOut({ callbackUrl: '/' });
      throw new Error("Sessão expirada. Por favor, faça o login novamente.");
    }

    response = await makeRequest(newSession.accessToken);
  }

  if (!response.ok) {
    const responseText = await response.text();
    let errorMessage = `Erro: ${response.status} ${response.statusText}`;
    
    if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
      errorMessage = `Erro do backend: ${response.status}. Verifique os logs do servidor.`;
    } else {
      try {
        const errorBody = JSON.parse(responseText);
        errorMessage = errorBody.detail || JSON.stringify(errorBody);
      } catch {
        errorMessage = responseText.substring(0, 200);
      }
    }
    
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return {} as T;
  }

  const responseText = await response.text();
  
  if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
    throw new Error('Backend retornou HTML em vez de JSON (Status 200)');
  }
  
  try {
    return JSON.parse(responseText) as T;
  } catch {
    throw new Error('Resposta inválida do servidor');
  }
};

export default api;
