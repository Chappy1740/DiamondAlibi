"use server";

import { supabaseServer } from "@/lib/supabase/server";
import type { AuthResult } from "@/app/login/actions";

export async function updatePassword(
  _previous: AuthResult,
  form: FormData,
): Promise<AuthResult> {
  const password = String(form.get("password") ?? "");
  if (password.length < 12 || password.length > 256)
    return { error: "Use a password of 12–256 characters." };
  if (password !== String(form.get("confirmPassword") ?? ""))
    return { error: "The passwords do not match." };
  try {
    const supabase = await supabaseServer();
    const { data, error: userError } = await supabase.auth.getUser();
    if (userError || !data.user)
      return {
        error: "Your reset session has expired. Request a new reset link.",
      };
    const { error } = await supabase.auth.updateUser({ password });
    if (error)
      return {
        error:
          "Could not save your password. Try a different password or request a fresh link.",
      };
    return {
      message: "Your password is saved. You can return to your clubhouse.",
    };
  } catch {
    return { error: "Could not save your password. Please try again later." };
  }
}
