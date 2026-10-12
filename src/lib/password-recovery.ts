export const RESET_MESSAGE =
  "If an account exists for that address, you’ll receive a password reset email. Check your inbox and spam folder, or try again later.";
export const RECOVERY_ERROR =
  "This reset link is invalid or expired. Request a new password reset email.";

// Never construct email links from Host, Origin, forwarded headers or form input.
export function authOrigin(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== "/"
    )
      return null;
    const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (url.protocol !== "https:" && !(url.protocol === "http:" && loopback))
      return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function validRecoveryEmail(email: string): boolean {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Only pass claims returned by Supabase getClaims(), never decoded input or metadata.
export function hasRecentRecovery(
  claims: Record<string, unknown> | undefined,
  now = Date.now() / 1000,
): boolean {
  if (
    !claims ||
    claims.role !== "authenticated" ||
    typeof claims.sub !== "string" ||
    !claims.sub ||
    typeof claims.session_id !== "string" ||
    !claims.session_id ||
    typeof claims.exp !== "number" ||
    !Number.isFinite(claims.exp) ||
    claims.exp <= now ||
    !Array.isArray(claims.amr)
  )
    return false;
  return claims.amr.some((entry: unknown) => {
    if (!entry || typeof entry !== "object") return false;
    const { method, timestamp } = entry as Record<string, unknown>;
    return (
      method === "recovery" &&
      typeof timestamp === "number" &&
      Number.isFinite(timestamp) &&
      timestamp <= now &&
      now - timestamp < 900
    );
  });
}
