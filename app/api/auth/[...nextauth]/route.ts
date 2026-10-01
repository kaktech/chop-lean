import { NextResponse, type NextRequest } from "next/server";
import { handlers } from "@/auth";

export const { POST } = handlers;

/** A provider callback opened without Google's `code`/`error` (history, autofill, refresh) can never succeed, so send the person back to sign in instead of showing an error. */
export async function GET(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  if (/^\/api\/auth\/callback\/[^/]+$/.test(pathname) && !searchParams.has("code") && !searchParams.has("error")) {
    return NextResponse.redirect(new URL("/signin", req.nextUrl.origin));
  }
  return handlers.GET(req);
}
