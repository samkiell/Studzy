import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/admin/upload-file (large file uploads)
     * - api/admin/delete-file (file management)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|api/admin/upload-file|api/admin/delete-file|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
