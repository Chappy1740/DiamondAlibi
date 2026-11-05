// Test-only esbuild plugin: browser harnesses never call the real Roast Club server action.
// "unsupported" is what an app without the Roast Club migration returns, so popups stay off.
module.exports = {
  name: "roast-club-stub",
  setup(build) {
    build.onResolve({ filter: /club\/roast-club-actions$/ }, () => ({ path: "roast-club-actions", namespace: "roast-club-stub" }));
    build.onLoad({ filter: /.*/, namespace: "roast-club-stub" }, () => ({
      contents: "export const roastClubAction=async()=>({status:'unsupported'})",
      loader: "js",
    }));
  },
};
