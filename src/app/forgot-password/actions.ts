"use server";

import { headers } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import type { AuthResult } from "@/app/login/actions";

export async function requestPasswordReset(
  _previous: AuthResult,
  form: FormData,
): Promise<AuthResult> {
  const email = String(form.get("email") ?? "").trim();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { error: "Enter a valid email address." };
  // Never build email links from an arbitrary Host or submitted URL.
  const origin = (await headers()).get("origin");
  const allowed = ["https://diamond-alibi-preview.lanternmere-wow.workers.dev"];
  if (process.env.NODE_ENV !== "production")
    allowed.push("http://localhost:3000", "http://127.0.0.1:3000");
  if (!origin || !allowed.includes(origin))
    return { error: "Open Diamond Alibi directly and try again." };
  try {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/reset-password`,
    });
    if (error)
      return {
        error: "Could not request a reset email. Please wait and try again.",
      };
    return {
      message:
        "If an account exists for this email, you’ll receive a password reset link. Check your spam folder too. Open the link in this same browser.",
    };
  } catch {
    return {
      error: "Could not request a reset email. Please try again later.",
    };
  }
}
