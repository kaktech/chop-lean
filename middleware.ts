import { NextResponse, type NextRequest } from "next/server";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "";

// 1) Send visitors on any other *.vercel.app address (per-deployment URLs) to the main address, because
//    Google sign-in and emails only know the main one.
// 2) First gate for /admin and /account: no session cookie means no way in. The real check (is this email in
//    ADMIN_EMAILS?) runs server-side in app/admin/layout.tsx and in every admin server action,
//    because Auth.js database sessions can't be read from the edge.
export function middleware(req: NextRequest) {
  if ((req.method === "GET" || req.method === "HEAD") && SITE.startsWith("https://")) {
    const host = req.headers.get("host") ?? "";
    if (host.endsWith(".vercel.app") && host !== new URL(SITE).host) {
      const url = new URL(req.nextUrl.pathname + req.nextUrl.search, SITE);
      return NextResponse.redirect(url, 307);
    }
  }

  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/admin") || pathname.startsWith("/account")) {
    const hasSession = req.cookies.has("authjs.session-token") || req.cookies.has("__Secure-authjs.session-token");
    if (!hasSession) {
      const url = req.nextUrl.clone();
      url.pathname = "/signin";
      url.search = `?callbackUrl=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|images/|favicon|icon.svg|logo-mark.png|api/webhooks).*)"] };
