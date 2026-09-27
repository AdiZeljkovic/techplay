import { NextResponse, type NextRequest } from "next/server";

// Access guard. Growth OS holds unpublished campaign copy and working notes,
// so it must never be served openly:
//  - with GROWTH_OS_USER/GROWTH_OS_PASSWORD set, every request needs Basic auth;
//  - in production mode without them, it only answers on localhost;
//  - `npm run dev` binds to 127.0.0.1, so local use needs no password.
export function proxy(req: NextRequest) {
  const user = process.env.GROWTH_OS_USER;
  const pass = process.env.GROWTH_OS_PASSWORD;
  if (!user || !pass) {
    const host = (req.headers.get("host") || "").split(":")[0];
    const local = host === "localhost" || host === "127.0.0.1" || host === "[::1]";
    if (process.env.NODE_ENV === "production" && !local && process.env.GROWTH_OS_ALLOW_OPEN !== "1") {
      return new NextResponse("Growth OS: set GROWTH_OS_USER and GROWTH_OS_PASSWORD before running in production mode.", { status: 503 });
    }
    return NextResponse.next();
  }
  const header = req.headers.get("authorization") || "";
  const [scheme, encoded] = header.split(" ");
  if (scheme === "Basic" && encoded) {
    const [u, ...rest] = atob(encoded).split(":");
    if (safeEqual(u, user) && safeEqual(rest.join(":"), pass)) return NextResponse.next();
  }
  return new NextResponse("Authentication required", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="Growth OS", charset="UTF-8"' } });
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
