import assert from "node:assert/strict";
import { test } from "node:test";
import { createRequire } from "node:module";
import { build } from "esbuild";

const nodeRequire = createRequire(import.meta.url);

async function load() {
  const bundle = await build({
    stdin: {
      resolveDir: process.cwd(),
      loader: "tsx",
      contents: `
        import React from "react";
        import { renderToStaticMarkup } from "react-dom/server";
        import { ProfileAvatar } from "./src/components/profile-avatar";
        export { notifyProfilePhotoChange, subscribeProfilePhotoChange } from "./src/lib/profile-photo-events";
        export const render = (signedIn) => renderToStaticMarkup(<ProfileAvatar signedIn={signedIn} />);
      `,
    },
    bundle: true,
    write: false,
    platform: "node",
    format: "cjs",
    jsx: "automatic",
    define: { "process.env.NODE_ENV": '"production"' },
  });
  const module = { exports: {} as any };
  new Function("module", "exports", "require", bundle.outputFiles[0].text)(module, module.exports, nodeRequire);
  return module.exports;
}

test("signed-in header loads only the signed-in user's own photo endpoint and shows the icon until it loads", async () => {
  const { render } = await load();
  const html = render(true);
  assert.match(html, /<img[^>]*src="\/more\/profile\/photo\?v=0"/);
  assert.doesNotMatch(html, /player=/, "the teammate form of the endpoint is never used in the header");
  assert.match(html, /alt=""/);
  assert.match(html, /aria-hidden="true"/);
  assert.match(html, /<img[^>]* hidden=""/, "photo stays hidden until it has loaded");
  assert.match(html, /<svg/, "generic icon shows until the photo loads");
});

test("signed-out and sample views render only the generic icon and request nothing", async () => {
  const { render } = await load();
  const html = render(false);
  assert.doesNotMatch(html, /<img/);
  assert.doesNotMatch(html, /\/more\/profile\/photo/);
  assert.match(html, /<svg/);
});

test("photo change signals reach every subscriber until it unsubscribes and carry no user data", async () => {
  const { notifyProfilePhotoChange, subscribeProfilePhotoChange } = await load();
  const seen: unknown[][] = [[], []];
  const stopFirst = subscribeProfilePhotoChange((change: unknown) => seen[0].push(change));
  const stopSecond = subscribeProfilePhotoChange((change: unknown) => seen[1].push(change));
  notifyProfilePhotoChange("saved");
  stopFirst();
  notifyProfilePhotoChange("removed");
  stopSecond();
  notifyProfilePhotoChange("saved");
  assert.deepEqual(seen, [["saved"], ["saved", "removed"]]);
});
