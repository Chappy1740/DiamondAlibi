"use server";
import { supabaseServer } from "@/lib/supabase/server";
import {
  authOrigin,
  RESET_MESSAGE,
  validRecoveryEmail,
} from "@/lib/password-recovery";
import type { AuthResult } from "@/app/login/actions";

export async function requestPasswordReset(
  _previous: AuthResult,
  form: FormData,
): Promise<AuthResult> {
  const email = String(form.get("email") ?? "").trim();
  if (!validRecoveryEmail(email))
    return { error: "Enter a valid email address." };
  const origin = authOrigin(process.env.AUTH_SITE_URL);
  if (!origin)
    return {
      error:
        "Password reset is temporarily unavailable. Please try again later.",
    };
  try {
    const supabase = await supabaseServer();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/recovery`,
    });
  } catch {
    // Match success, unknown address, SMTP failures and throttling. Never log email or tokens.
  }
  return { message: RESET_MESSAGE };
}
