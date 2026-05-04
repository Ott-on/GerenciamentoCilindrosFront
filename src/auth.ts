import NextAuth from "next-auth";
import { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";

// Tolerância de tempo para evitar usar tokens já expirados no servidor
// Se backend expirou mas frontend ainda acha válido, refresha 30s antes
const CLOCK_SKEW_SECONDS = 30;

interface ApiUser {
  id_usuario: number;
  matricula: string;
  nome: string;
  cargo: string;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

async function refreshAccessToken(token: JWT) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
    const res = await fetch(`${backendUrl}/auth/refresh`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "69420",
        "User-Agent": "PostmanRuntime/7.32.3"
      },
      body: JSON.stringify({ refresh_token: token.refreshToken }),
    });

    const responseText = await res.text();

    // Ngrok frequentemente retorna HTML (502 Bad Gateway) quando o tunnel está instável
    // Isso é esperado e recuperável — não é um erro crítico
    if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
      console.warn("[Auth] Refresh falhou: backend/ngrok retornou HTML (status:", res.status, ") — sessão será expirada");
      return { ...token, error: "RefreshAccessTokenError" as const };
    }

    const refreshedTokens = JSON.parse(responseText);

    if (!res.ok) {
      console.warn("[Auth] Refresh falhou com status:", res.status);
      return { ...token, error: "RefreshAccessTokenError" as const };
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, 
    };
  } catch (error) {
    console.warn("[Auth] Refresh falhou:", error instanceof Error ? error.message : error);
    return {
      ...token,
      error: "RefreshAccessTokenError" as const, 
    };
  }
}

const handler = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        matricula: { label: "Matrícula", type: "text" },
        senha: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        try {
          const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
          const loginUrl = `${backendUrl}/auth/login`;
          
          const res = await fetch(loginUrl, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "ngrok-skip-browser-warning": "69420",
              "User-Agent": "PostmanRuntime/7.32.3"
            },
            body: JSON.stringify({
              matricula: credentials?.matricula,
              senha: credentials?.senha,
            }),
          });

          const responseText = await res.text();

          if (!res.ok) {
            console.error("[Auth] Falha na autenticação:", res.status);
            return null;
          }

          const user: ApiUser = JSON.parse(responseText);
          if (user && user.id_usuario) {
            return { ...user, id: String(user.id_usuario) };
          }
          console.error("[Auth] API não retornou id_usuario válido.");
          return null;
        } catch (error) {
          console.error("[Auth] Erro ao conectar API:", error instanceof Error ? error.message : error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/", 
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.access_token;
        token.refreshToken = user.refresh_token;
        token.accessTokenExpires = Date.now() + user.expires_in * 1000;
        token.id = user.id;
        token.name = user.nome;
        token.matricula = user.matricula;
        token.cargo = user.cargo;
        return token;
      }

      
      // Se o token ainda é válido (não expirou)
      // Subtrai CLOCK_SKEW para expirar mais cedo e evitar usar token já expirado no servidor
      const expirationWithSkew = (token.accessTokenExpires as number) - (CLOCK_SKEW_SECONDS * 1000);
      if (Date.now() < expirationWithSkew) {
        return token;
      }

      // Token expirou, faz refresh
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.accessToken = token.accessToken as string;
      session.user.name = token.name;
      session.user.matricula = token.matricula as string;
      session.user.cargo = token.cargo as string;
      session.error = token.error as "RefreshAccessTokenError" | undefined; // Propaga o erro para o cliente
      return session;
    },
  },
  events: {
    async signOut({ token }) {
      const refreshToken = token.refreshToken as string;
      if (refreshToken) {
        try {
          const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
          const response = await fetch(`${backendUrl}/auth/logout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': '69420',
              'User-Agent': 'PostmanRuntime/7.32.3'
            },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });
          if (!response.ok) {
            console.warn('[Auth] Backend logout failed:', response.status);
          }
        } catch (error) {
          // Logout é best-effort — não propaga erros
          console.warn('[Auth] Logout erro:', error instanceof Error ? error.message : error);
        }
      }
    }
  }
});

export { handler as GET, handler as POST };


