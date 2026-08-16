import NextAuth from "next-auth";
import authConfig from "@/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: [
    /*
     * Match all protected routes
     */
    "/dashboard/:path*",
    "/admin/:path*",
    "/cbt/:path*",
    "/cbtx/:path*",
    "/studzyai/:path*",
  ],
};
