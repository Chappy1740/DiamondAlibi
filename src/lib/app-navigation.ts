/** Navigation context is a convenience only; page loaders still enforce access. */
export const APP_TABS = [
  { path: "", label: "Home" },
  { path: "games", label: "Games" },
  { path: "stats", label: "Stats" },
  { path: "beverages", label: "Beverage" },
  { path: "more", label: "More" },
] as const;
const keys = ["team", "season", "scope", "sample", "player", "shell"];
const accountEntry = (path: string) =>
  ["/login", "/forgot-password", "/reset-password", "/auth/callback"].includes(
    path,
  );
export function navigationContext(
  previous: string,
  current: string,
  path: string,
): string {
  if (accountEntry(path)) return "";
  const before = new URLSearchParams(previous),
    input = new URLSearchParams(current);
  const result = new URLSearchParams();
  for (const key of keys) {
    const value = before.get(key);
    if (value && value.length <= 200) result.set(key, value);
  }
  if (input.has("team") && input.get("team") !== before.get("team"))
    result.delete("season");
  for (const key of keys) {
    if (!input.has(key)) continue;
    const value = input.get(key);
    if (value && value.length <= 200) result.set(key, value);
    else result.delete(key);
  }
  if (
    result.has("scope") &&
    !["Overall", "League", "Tournament"].includes(result.get("scope")!)
  )
    result.delete("scope");
  if (result.get("sample") !== "1") {
    result.delete("sample");
    result.delete("player");
  }
  if (result.get("shell") !== "1") result.delete("shell");
  // Authenticated account pages must not carry a former sample team's context.
  if (
    path.startsWith("/club") ||
    ["/more/profile", "/more/settings"].includes(path)
  ) {
    if (result.has("sample") || result.has("shell")) {
      for (const key of ["team", "season", "scope"])
        if (!input.has(key)) result.delete(key);
    }
    for (const key of ["sample", "player", "shell"]) result.delete(key);
  }
  return result.toString();
}
export function activeAppTab(path: string, search: string): string | undefined {
  if (path === "/review/history") {
    const route = new URLSearchParams(search).get("route") ?? "";
    return APP_TABS.find((tab) => tab.path === route.split("/")[0])?.path;
  }
  if (path === "/") return "";
  if (
    [
      "/games",
      "/leagues",
      "/tournaments",
      "/club/score",
      "/practice",
      "/review/scoring",
    ].some((prefix) => path === prefix || path.startsWith(prefix + "/"))
  )
    return "games";
  if (path === "/stats") return "stats";
  if (path === "/beverages") return "beverages";
  if (
    ["/more", "/club", "/review", "/owner", "/status"].some(
      (prefix) => path === prefix || path.startsWith(prefix + "/"),
    ) ||
    accountEntry(path)
  )
    return "more";
}
export function appNavigation(path: string, search: string, context: string) {
  const active = activeAppTab(path, search);
  return APP_TABS.map((tab) => {
    const query = new URLSearchParams(context);
    if (path.startsWith("/review")) {
      query.set("route", tab.path);
      return {
        ...tab,
        href: `/review/history?${query}`,
        active: tab.path === active,
      };
    }
    return {
      ...tab,
      href: `/${tab.path}${query.size ? `?${query}` : ""}`,
      active: tab.path === active,
    };
  });
}
