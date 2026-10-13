"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
export type AuthResult = { error?: string; message?: string };
export async function login(
  _previous: AuthResult,
  form: FormData,
): Promise<AuthResult> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password || email.length > 254 || password.length > 256)
    return { error: "Enter your email and password." };
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error)
    return {
      error:
        "Sign-in failed. Check your details and whether your email is confirmed.",
    };
  redirect("/");
}
export async function signup(
  _previous: AuthResult,
  form: FormData,
): Promise<AuthResult> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (
    !email ||
    email.length > 254 ||
    password.length < 12 ||
    password.length > 256
  )
    return { error: "Use a valid email and a password of 12–256 characters." };
  const supabase = await supabaseServer();
  const { error, data } = await supabase.auth.signUp({ email, password });
  if (error)
    return {
      error: "Account creation could not be completed. Please try again later.",
    };
  if (data.session) redirect("/");
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
