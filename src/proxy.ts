import { withAuth } from "next-auth/middleware";
import { NextRequest } from "next/server";

// O Next.js 16 exige uma função chamada 'proxy' ou um 'default export'
const authMiddleware = withAuth({
  pages: {
    signIn: "/",
  },
});

// Exportamos a função com o nome que o Next.js está pedindo
export default function proxy(req: NextRequest, event: any) {
  return (authMiddleware as any)(req, event);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/cylinder-movements/:path*",
    "/estoque/:path*",
    "/sectors/:path*",
    "/autonomy-analyse/:path*",
  ],
};