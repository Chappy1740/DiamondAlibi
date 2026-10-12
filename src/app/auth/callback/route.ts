import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { authOrigin } from "@/lib/password-recovery";
import { recoveryClient } from "@/lib/supabase/recovery";
export async function GET(request: NextRequest) {
  const origin = authOrigin(process.env.AUTH_SITE_URL);
  if (!origin)
    return new NextResponse("Authentication is temporarily unavailable.", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  let path = "/login";
  const code = request.nextUrl.searchParams.get("code");
  try {
    if (
      code &&
      code.length <= 2048 &&
      !request.nextUrl.searchParams.has("error")
    ) {
      const supabase = await supabaseServer();
      const flowId = request.nextUrl.searchParams.get("sb_flow_id");
      const { error } = await supabase.auth.exchangeCodeForSession(
        code,
        flowId ? { flowId } : undefined,
      );
      if (!error)
        path = (await recoveryClient()) ? "/update-password" : "/club";
    }
  } catch {
    /* Keep provider details and tokens private. */
  }
  const response = NextResponse.redirect(new URL(path, origin), 303);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
