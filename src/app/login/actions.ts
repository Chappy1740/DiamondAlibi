"use server";

import { redirect } from "next/navigation";
import { authCaptchaToken, captchaRequiredMessage } from "@/lib/auth-captcha";
import { supabaseServer } from "@/lib/supabase/server";
import { completePlayerSignup } from "@/lib/complete-player-signup";
import { playerDetails } from "@/lib/player-profile";
import { diamondAlibiOrigin, trustedAuthOrigin } from "@/lib/trusted-auth-origin";
export type AuthResult = { error?: string; message?: string };
export async function login(
  _previous: AuthResult,
  form: FormData,
): Promise<AuthResult> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password || email.length > 254 || password.length > 256)
    return { error: "Enter your email and password." };
  const captchaToken = authCaptchaToken(form);
  if (captchaToken === null) return { error: captchaRequiredMessage };
  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.signInWithPassword({
    email, password, ...(captchaToken && { options: { captchaToken } }),
  });
  if (error)
    return {
      error:
        "Sign-in failed. Check your details and whether your email is confirmed.",
    };
  redirect(await completePlayerSignup(supabase, data.user));
}
export async function signup(
  _previous: AuthResult,
  form: FormData,
): Promise<AuthResult> {
  if (process.env.DA_SANDBOX_ORIGIN)
    return { error: "Sandbox accounts are created by the owner." };
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (
    !email ||
    email.length > 254 ||
    password.length < 12 ||
    password.length > 256
  )
    return { error: "Use a valid email and a password of 12–256 characters." };
  const details = playerDetails(form.get("nickname"), form.get("play_level"), form.get("fielding_position"));
  if (!details) return { error: "Enter a name of 1–40 characters and choose only the listed options." };
  const origin = await trustedAuthOrigin();
  if (!origin) return { error: "Open Diamond Alibi directly and try again." };
  const captchaToken = authCaptchaToken(form);
  if (captchaToken === null) return { error: captchaRequiredMessage };
  // Supabase accepts the canonical host and numeric loopback addresses for this callback.
  const confirmationOrigin = origin.startsWith("https://")
    ? diamondAlibiOrigin
    : origin.replace("localhost", "127.0.0.1");
  const supabase = await supabaseServer();
  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      ...(captchaToken && { captchaToken }),
      emailRedirectTo: `${confirmationOrigin}/auth/callback?next=/login`,
      data: { da_signup_profile: details },
    },
  });
  if (error)
    return {
      error: "Account creation could not be completed. Please try again later.",
    };
  if (data.session) redirect(await completePlayerSignup(supabase, data.user));
  return {
    message:
      "If account creation is available for this address, check your confirmation email. After confirming, return here to sign in.",
  };
}
export async function signout() {
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signOut();
  if (error) redirect("/club?notice=signout-failed");
  redirect("/login");
}
