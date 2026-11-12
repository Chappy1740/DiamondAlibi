export function phoneSignInEnabled() {
  return process.env.DA_PHONE_SIGN_IN_ENABLED === "true";
}

export function normalizeSignInPhone(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.length > 32) return null;
  const compact = value.trim().replace(/[\s().-]/g, "");
  const international = /^\d{10}$/.test(compact) ? `+1${compact}` : compact;
  return /^\+[1-9]\d{1,14}$/.test(international) ? international : null;
}
