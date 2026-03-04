import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { normalizeMainRoutePath } from "./utils/urlRoute";

export function middleware(request: NextRequest) {
  const originalPath = request.nextUrl.pathname;
  const normalizedPath = normalizeMainRoutePath(originalPath);

  if (normalizedPath !== originalPath) {
    const nextUrl = request.nextUrl.clone();
    nextUrl.pathname = normalizedPath;
    return NextResponse.redirect(nextUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|images|.*\\..*).*)"],
};
