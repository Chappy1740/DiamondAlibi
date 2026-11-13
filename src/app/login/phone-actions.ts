"use server";

import { redirect } from "next/navigation";
import { authCaptchaToken, captchaRequiredMessage } from "@/lib/auth-captcha";
import { completePlayerSignup } from "@/lib/complete-player-signup";
import { isPilotPhone, normalizeSignInPhone, phoneAuthFetchMs, phoneAuthResponse, phoneSignInEnabled } from "@/lib/phone-sign-in";
import { playerDetails } from "@/lib/player-profile";
import { supabaseServer } from "@/lib/supabase/server";
import { trustedAuthOrigin } from "@/lib/trusted-auth-origin";

export type PhoneAuthResult = { error?: string; requested?: true };

export async function requestPhoneCode(_previous: PhoneAuthResult, form: FormData): Promise<PhoneAuthResult> {
  if (!phoneSignInEnabled() || !await trustedAuthOrigin()) return { error: "Phone sign-in is unavailable." };
  const phone = normalizeSignInPhone(form.get("phone"));
  if (!phone) return { error: "Enter a 10-digit US number or include the country code with a plus sign." };
  const intent = form.get("intent");
  if (intent !== "register" && intent !== "sign-in") return { error: "Choose sign-in or account creation." };
  const captchaToken = authCaptchaToken(form, true);
  if (!captchaToken) return { error: captchaRequiredMessage };

  return phoneAuthResponse(async () => {
    if (isPilotPhone(phone)) {
      try {
        const client = await supabaseServer(phoneAuthFetchMs);
        await client.auth.signInWithOtp({
          phone,
          options: { channel: "sms", shouldCreateUser: intent === "register", captchaToken },
        });
      } catch {
        // Never reveal transport failures, provider codes, or per-number cooldowns.
      }
    }
    return { requested: true };
  });
}

export async function verifyPhoneCode(_previous: PhoneAuthResult, form: FormData): Promise<PhoneAuthResult> {
  if (!phoneSignInEnabled() || !await trustedAuthOrigin()) return { error: "Phone sign-in is unavailable." };
  const phone = normalizeSignInPhone(form.get("phone"));
  const token = form.get("code");
  if (!phone || typeof token !== "string" || !/^\d{6}$/.test(token)) {
    return { error: "Enter the six-digit code from your text." };
  }
  const intent = form.get("intent");
  if (intent !== "register" && intent !== "sign-in") return { error: "Choose sign-in or account creation." };
  const details = intent === "register"
    ? playerDetails(form.get("nickname"), form.get("play_level"), form.get("fielding_position"))
    : null;
  if (intent === "register" && !details) {
    return { error: "Enter a name of 1–40 characters and choose only the listed options." };
  }

  const verified = await phoneAuthResponse(async () => {
    if (!isPilotPhone(phone)) return null;
    try {
      const client = await supabaseServer(phoneAuthFetchMs);
      const { data, error } = await client.auth.verifyOtp({ phone, token, type: "sms" });
      if (!error && data.session && data.user?.phone_confirmed_at &&
        normalizeSignInPhone(`+${data.user.phone?.replace(/^\+/, "") ?? ""}`) === phone) return { client, user: data.user };
      if (data.session) await client.auth.signOut({ scope: "local" });
    } catch {
      // An invalid, expired, limited or unavailable verification has one response.
    }
    return null;
  });
  if (!verified) return { error: "That code could not be verified. Try again or request a new code." };

  // Send current details only after verification. Supabase may retain stale
  // metadata on a pending signup, so do not use it to initialize an SMS profile.
  if (!details) redirect("/");
  redirect(await completePlayerSignup(verified.client, verified.user, details));
}
