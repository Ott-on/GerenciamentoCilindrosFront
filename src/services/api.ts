
import { getSession, signOut } from "next-auth/react";

// URL do backend (conferida com next.config.ts)
const BACKEND_BASE_URL = "http://44.220.143.197:8080";

// Função para converter URLs do backend direto para usar o proxy
const convertToProxyUrl = (url: string): string => {
  if (url.startsWith(BACKEND_BASE_URL)) {
    // Remove o protocolo e domínio, deixando apenas o path
    const path = url.replace(BACKEND_BASE_URL, "");
    return `/api/backend${path}`;
  }
  return url;
};

const api = async <T = unknown>(url: string, options: RequestInit = {}): Promise<T> => {
  // Converte URLs do backend para usar o proxy
  const proxyUrl = convertToProxyUrl(url);
  console.log(`[API] Making request to: ${url} → ${proxyUrl}`);
  const session = await getSession();

  if (!session) {
    console.log("[API] No active session found. Signing out.");
    signOut({ callbackUrl: '/' });
    throw new Error("Não autenticado");
  }
  
  if (session.error === "RefreshAccessTokenError") {
    console.log("[API] Session has RefreshAccessTokenError. Signing out.");
    signOut({ callbackUrl: '/' });
    throw new Error("Sessão expirada. Por favor, faça o login novamente.");
  }

  const makeRequest = async (token: string | undefined, attempt: number = 1) => {
    const headers = {
      ...options.headers,
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
    console.log(`[API] Attempt ${attempt}: Fetching ${proxyUrl}`);
    console.log(`[API] Token present: ${token ? 'yes' : 'no'}`);
    return fetch(proxyUrl, { ...options, headers });
  };

  let response = await makeRequest(session.accessToken, 1);

  if (response.status === 401) {
    console.log(`[API] Initial request to ${proxyUrl} returned 401. Attempting to refresh session.`);
    const newSession = await getSession(); 

    if (newSession?.error === "RefreshAccessTokenError" || !newSession?.accessToken) {
      console.log("[API] Session refresh failed or no new token. Signing out.");
      await signOut({ callbackUrl: '/' });
      throw new Error("Sessão expirada. Por favor, faça o login novamente.");
    }

    console.log("[API] Session refreshed successfully. Retrying original request.");
    response = await makeRequest(newSession.accessToken, 2); // Retried request
  }

  if (!response.ok) {
    let errorMessage = `Erro: ${response.status} ${response.statusText}`;
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.detail || JSON.stringify(errorBody);
    } catch {
      
    }
    console.error(`[API] Request to ${proxyUrl} failed after retry (or initial if no 401):`, errorMessage);
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    console.log(`[API] Request to ${proxyUrl} successful with 204 No Content.`);
    return {} as T;
  }

  console.log(`[API] Request to ${proxyUrl} successful.`);
  return response.json() as Promise<T>;
};

export default api;
