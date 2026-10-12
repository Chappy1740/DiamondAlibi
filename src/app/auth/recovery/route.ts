import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { recoveryClient } from "@/lib/supabase/recovery";
import { authOrigin } from "@/lib/password-recovery";

export async function GET(request: NextRequest) {
  const origin = authOrigin(process.env.AUTH_SITE_URL);
  if (!origin)
    return new NextResponse("Password recovery is temporarily unavailable.", {
      status: 503,
      headers: {
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
      },
    });
  let path = "/forgot-password?notice=invalid-link";
  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const hash = params.get("token_hash");
  try {
    if (
      !params.has("error") &&
      ((code && !hash && code.length <= 2048) ||
        (hash &&
          !code &&
          hash.length <= 2048 &&
          params.get("type") === "recovery"))
    ) {
      const supabase = await supabaseServer();
      const result = hash
        ? await supabase.auth.verifyOtp({ token_hash: hash, type: "recovery" })
        : await supabase.auth.exchangeCodeForSession(
            code!,
            params.has("sb_flow_id")
              ? { flowId: params.get("sb_flow_id")! }
              : undefined,
          );
      if (!result.error && (await recoveryClient())) path = "/update-password";
    }
  } catch {
    /* Never return provider errors, codes or tokens to the browser. */
  }
  // Fixed destinations: ignore next/redirect_to and strip credentials from the URL.
  const response = NextResponse.redirect(new URL(path, origin), 303);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
