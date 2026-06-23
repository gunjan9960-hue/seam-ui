import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ── Upstash Redis rate limiter ────────────────────────────────────────────────
// Falls back to allow-all if env vars are not configured.

function makeRatelimiter(max: number, windowSeconds: number) {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(max, `${windowSeconds} s`),
    prefix: "seam_rl",
  });
}

// One limiter per route profile
const limiters: Record<string, ReturnType<typeof makeRatelimiter>> = {
  "/api/search":         makeRatelimiter(30, 60),
  "/api/sync":           makeRatelimiter(10, 60),
  "/api/oauth/connect":  makeRatelimiter(20, 60),
  "/api/oauth/callback": makeRatelimiter(20, 60),
  "__default__":         makeRatelimiter(60, 60),
};

// ── Proxy ─────────────────────────────────────────────────────────────────────

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate-limit API routes
  if (pathname.startsWith("/api/")) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? request.headers.get("x-real-ip")
      ?? "anonymous";

    const routeKey = Object.keys(limiters).find((k) => k !== "__default__" && pathname.startsWith(k)) ?? "__default__";
    const limiter = limiters[routeKey];

    if (limiter) {
      try {
        const { success, remaining, reset } = await limiter.limit(`${routeKey}:${ip}`);
        const headers = {
          "X-RateLimit-Remaining": String(remaining),
          "X-RateLimit-Reset": String(reset),
        };

        if (!success) {
          return new NextResponse(JSON.stringify({ error: "Too many requests. Please slow down." }), {
            status: 429,
            headers: { "Content-Type": "application/json", ...headers },
          });
        }

        const res = NextResponse.next();
        Object.entries(headers).forEach(([k, v]) => res.headers.set(k, v));
        return res;
      } catch {
        // Upstash unavailable — allow request through rather than blocking users
      }
    }

    // No limiter configured (env vars missing) — allow through
    return NextResponse.next();
  }

  // Auth guard + Supabase cookie refresh for page routes
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Protect /app/* and /onboarding — redirect unauthenticated users to login
  if ((pathname.startsWith("/app") || pathname === "/onboarding") && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect authenticated users away from login
  if (pathname === "/login" && user) {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/app/:path*", "/login", "/onboarding", "/api/:path*"],
};
