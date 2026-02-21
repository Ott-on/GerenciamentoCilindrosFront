import { withAuth } from "next-auth/middleware";

export const middleware = withAuth({
  pages: {
    signIn: "/",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/cylinder-movements/:path*",
    "/estoque/:path*",
    "/sectors/:path*",
    "/autonomy-analyse/:path*",
  ],
};