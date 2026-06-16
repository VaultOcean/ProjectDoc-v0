import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

/**
 * Gate the enterprise Console behind a valid session. Runs on the edge, so it
 * verifies the signed JWT directly (no DB) — fast and safe. Unauthenticated
 * visitors are sent to /login with a return path. (Next 16 "proxy" convention.)
 */
export async function proxy(req: NextRequest) {
  const secret = process.env.SESSION_SECRET;
  const token = req.cookies.get("vo_session")?.value;

  let valid = false;
  if (token && secret && secret.length >= 32) {
    try {
      await jwtVerify(token, new TextEncoder().encode(secret));
      valid = true;
    } catch {
      valid = false;
    }
  }

  if (!valid) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/console", "/console/:path*", "/workspace", "/workspace/:path*"] };
