// Same-tab state shared by the profile photo form and every header avatar mount. It holds only a
// revision number and whether the photo was removed, never user data or photo bytes. The
// revision never repeats within a document, so a changed photo always gets a URL the browser
// has not loaded yet. Browsers can reuse a decoded image for the same URL even when the
// response is `no-store`, which would bring a removed photo back on the next page's header.
// Signed-out views reset the state so nothing carries over to a different account.
export type ProfilePhotoChange = "saved" | "removed";
export type ProfilePhotoState = { revision: number; removed: boolean };

const listeners = new Set<(change: ProfilePhotoChange) => void>();
let lastRevision = 0;
let state: ProfilePhotoState = { revision: 0, removed: false };

export function profilePhotoState(): ProfilePhotoState {
  return state;
}

export function subscribeProfilePhotoChange(listener: (change: ProfilePhotoChange) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyProfilePhotoChange(change: ProfilePhotoChange) {
  state = { revision: ++lastRevision, removed: change === "removed" };
  for (const listener of [...listeners]) listener(change);
}

// Called wherever no account is signed in, such as the sign-in page and the signed-out menu.
export function resetProfilePhotoState() {
  state = { revision: ++lastRevision, removed: false };
}
