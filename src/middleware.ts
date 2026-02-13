import { type NextRequest } from "next/server";
import { proxy } from "@/proxy";

export async function middleware(request: NextRequest) {
  return proxy(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/admin/upload-file|api/admin/delete-file|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
