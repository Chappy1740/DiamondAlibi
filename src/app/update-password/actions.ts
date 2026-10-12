"use server";
import { redirect } from "next/navigation";
import type { AuthResult } from "@/app/login/actions";
import { recoveryClient } from "@/lib/supabase/recovery";
import { RECOVERY_ERROR } from "@/lib/password-recovery";

export async function updatePassword(
  _previous: AuthResult,
  form: FormData,
): Promise<AuthResult> {
  const password = String(form.get("password") ?? "");
  const confirmation = String(form.get("confirmPassword") ?? "");
  if (password.length < 12 || password.length > 256)
    return { error: "Use a password of 12–256 characters." };
  if (password !== confirmation)
    return { error: "The passwords do not match." };
  const supabase = await recoveryClient();
  if (!supabase) return { error: RECOVERY_ERROR };
  try {
    const { error } = await supabase.auth.updateUser({ password });
    if (error)
      return {
        error:
          "Password could not be updated. Try a different password or request a new reset link.",
      };
  } catch {
    return {
      error:
        "Password could not be updated. Please try again or request a new reset link.",
    };
  }
  let signedOut = false;
  try {
    const { error } = await supabase.auth.signOut({ scope: "global" });
    signedOut = !error;
  } catch {
    /* The password change succeeded even if sign-out failed. */
  }
  // Cookie changes rerender the protected page; redirect so success remains visible.
  redirect(
    signedOut
      ? "/login?notice=password-updated"
      : "/login?notice=password-updated-signout-failed",
  );
}
