import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Paths that receive external webhooks (skip CSRF check)
const WEBHOOK_PATHS = ["/api/payments/momo/callback"];

export async function middleware(request: NextRequest) {
  // CSRF protection: block cross-origin state-changing requests
  if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
    const isWebhook = WEBHOOK_PATHS.some((p) => request.nextUrl.pathname.startsWith(p));

    if (!isWebhook) {
      const origin = request.headers.get("origin");
      const host = request.headers.get("host");

      // Origin must match host (same-site). Missing origin on non-GET is suspicious.
      if (!origin || new URL(origin).host !== host) {
        return NextResponse.json(
          { error: "Forbidden — cross-origin request" },
          { status: 403 }
        );
      }
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
