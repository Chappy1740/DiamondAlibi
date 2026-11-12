"use server";

import { redirect } from "next/navigation";
import { completePlayerSignup } from "@/lib/complete-player-signup";
import { normalizeSignInPhone, phoneSignInEnabled } from "@/lib/phone-sign-in";
import { playerDetails } from "@/lib/player-profile";
import { supabaseServer } from "@/lib/supabase/server";

export type PhoneAuthResult = { error?: string; phone?: string };

export async function requestPhoneCode(_previous: PhoneAuthResult, form: FormData): Promise<PhoneAuthResult> {
  if (!phoneSignInEnabled()) return { error: "Phone sign-in is unavailable." };
  const phone = normalizeSignInPhone(form.get("phone"));
  if (!phone) return { error: "Enter a 10-digit US number or include the country code with a plus sign." };
  const intent = form.get("intent");
  if (intent !== "register" && intent !== "sign-in") return { error: "Choose sign-in or account creation." };
  const creating = intent === "register";
  const details = creating
    ? playerDetails(form.get("nickname"), form.get("play_level"), form.get("fielding_position"))
    : null;
  if (creating && !details) return { error: "Enter a name of 1–40 characters and choose only the listed options." };

  const client = await supabaseServer();
  const { error } = await client.auth.signInWithOtp({
    phone,
    options: {
      channel: "sms",
      shouldCreateUser: creating,
      ...(details ? { data: { da_signup_profile: details } } : {}),
    },
  });
  // Keep account-dependent responses indistinguishable in the sign-in form.
  if (error && !["signup_disabled", "user_not_found", "user_banned", "phone_exists"].includes(error.code ?? "")) {
    return { error: "Could not request a code. Wait a minute and try again, or use email." };
  }
  return { phone };
}

export async function verifyPhoneCode(_previous: PhoneAuthResult, form: FormData): Promise<PhoneAuthResult> {
  if (!phoneSignInEnabled()) return { error: "Phone sign-in is unavailable." };
  const phone = normalizeSignInPhone(form.get("phone"));
  const token = form.get("code");
  if (!phone || typeof token !== "string" || !/^\d{6}$/.test(token)) {
    return { error: "Enter the six-digit code from your text." };
  }

  const client = await supabaseServer();
  const { data, error } = await client.auth.verifyOtp({ phone, token, type: "sms" });
  if (!error && data.session && data.user?.phone_confirmed_at) {
    redirect(await completePlayerSignup(client, data.user));
  }
  if (data.session) {
    await client.auth.signOut({ scope: "local" });
  }
  return { error: "That code could not be verified. Try again or request a new code." };
}
