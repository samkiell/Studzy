import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  return NextResponse.redirect(new URL("/login", req.url), {
    status: 302,
  });
}
