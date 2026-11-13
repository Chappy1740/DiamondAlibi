export function authCaptchaSiteKey() {
  return process.env.DA_AUTH_TURNSTILE_SITE_KEY?.trim() || null;
}

// Supabase Auth validates and consumes the token. Never verify it twice.
export function authCaptchaToken(form: FormData, required = Boolean(authCaptchaSiteKey())) {
  if (!required) return undefined;
  const token = form.get("captchaToken");
  return typeof token === "string" && token.length <= 2048 && /^\S+$/.test(token)
    ? token
    : null;
}

export const captchaRequiredMessage = "Complete the security check and try again.";
