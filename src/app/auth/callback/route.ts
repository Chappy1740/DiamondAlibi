import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { completePlayerSignup } from "@/lib/complete-player-signup";
export async function GET(request: NextRequest) {
  const next = request.nextUrl.searchParams.get("next");
  if (next === "/login") {
    // Supabase confirms the email before redirecting here. Sign-in starts separately.
    return NextResponse.redirect(new URL("/login#", request.url), {
      headers: { "Cache-Control": "private, no-store" },
    });
  }
  const code = request.nextUrl.searchParams.get("code");
  const resetting = next === "/reset-password";
  if (code) {
    const supabase = await supabaseServer();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const destination = resetting
        ? "/reset-password"
        : await completePlayerSignup(supabase, data.user);
      const response = NextResponse.redirect(
        new URL(destination, request.url),
      );
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }
  }
  const response = NextResponse.redirect(
    new URL(
      resetting ? "/forgot-password?error=expired" : "/login",
      request.url,
    ),
  );
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
