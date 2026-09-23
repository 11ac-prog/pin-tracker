import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const UNAUTHORIZED = new NextResponse("Authentication required", {
  status: 401,
  headers: { "WWW-Authenticate": 'Basic realm="Pin Tracker"' },
});

export function proxy(request: NextRequest) {
  const user = process.env.BASIC_AUTH_USER;
  const password = process.env.BASIC_AUTH_PASSWORD;

  // Not configured (e.g. local dev) — don't lock anyone out.
  if (!user || !password) return NextResponse.next();

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Basic ")) {
    const decoded = Buffer.from(authHeader.slice(6), "base64").toString("utf-8");
    const separatorIndex = decoded.indexOf(":");
    const suppliedUser = decoded.slice(0, separatorIndex);
    const suppliedPassword = decoded.slice(separatorIndex + 1);

    if (suppliedUser === user && suppliedPassword === password) {
      return NextResponse.next();
    }
  }

  return UNAUTHORIZED;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
