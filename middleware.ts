import { NextResponse, type NextRequest } from "next/server";

// First gate for /admin: no session cookie means no way in. The real check (is this email in
// ADMIN_EMAILS?) runs server-side in app/admin/layout.tsx and in every admin server action,
// because Auth.js database sessions can't be read from the edge.
export function middleware(req: NextRequest) {
  const hasSession = req.cookies.has("authjs.session-token") || req.cookies.has("__Secure-authjs.session-token");
  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/signin";
    url.search = `?callbackUrl=${encodeURIComponent(req.nextUrl.pathname)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/account/:path*"] };
