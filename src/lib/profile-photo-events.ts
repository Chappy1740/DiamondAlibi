// Same-tab signal from the profile photo form to the header avatar. It keeps no user data
// or photo state, so nothing can carry over to a different account after sign-out.
export type ProfilePhotoChange = "saved" | "removed";

const listeners = new Set<(change: ProfilePhotoChange) => void>();

export function subscribeProfilePhotoChange(listener: (change: ProfilePhotoChange) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyProfilePhotoChange(change: ProfilePhotoChange) {
  for (const listener of [...listeners]) listener(change);
}
