import { authCaptchaSiteKey } from "./auth-captcha";

export function phoneSignInEnabled() {
  return !process.env.DA_SANDBOX_ORIGIN &&
    process.env.DA_PHONE_SIGN_IN_ENABLED === "true" &&
    Boolean(authCaptchaSiteKey() && pilotPhone());
}

function pilotPhone() {
  const phone = process.env.DA_PHONE_PILOT_NUMBER;
  return phone && /^\+[1-9]\d{1,14}$/.test(phone) ? phone : null;
}

export function isPilotPhone(phone: string) {
  return phone === pilotPhone();
}

export function normalizeSignInPhone(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.length > 32) return null;
  const compact = value.trim().replace(/[\s().-]/g, "");
  const international = /^\d{10}$/.test(compact) ? `+1${compact}` : compact;
  return /^\+[1-9]\d{1,14}$/.test(international) ? international : null;
}

// Allow a little headroom beyond the provider fetch deadline. This is a minimum
// response window, not a constant-time guarantee under scheduler/network pressure.
export const phoneAuthResponseMs = 2500;
export const phoneAuthFetchMs = 2000;

export async function phoneAuthResponse<T>(work: () => Promise<T>) {
  const earliest = performance.now() + phoneAuthResponseMs;
  try {
    return await work();
  } finally {
    const remaining = earliest - performance.now();
    if (remaining > 0) await new Promise<void>((resolve) => setTimeout(resolve, Math.ceil(remaining)));
  }
}
