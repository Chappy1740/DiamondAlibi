import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const resetting =
    request.nextUrl.searchParams.get("next") === "/reset-password";
  if (code) {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const response = NextResponse.redirect(
        new URL(resetting ? "/reset-password" : "/club", request.url),
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
