import { notFound, redirect } from "next/navigation";
import { Workspace } from "@/components/workspace";
import { PlayerDashboard } from "@/components/player-dashboard";
import { dashboardProps, type DashboardQuery } from "@/app/dashboard-loader";
export const dynamic = "force-dynamic";
const routes = [
  "",
  "games",
  "games/live",
  "stats",
  "beverages",
  "more",
  "more/team",
  "more/seasons",
  "more/alibi",
  "more/beverage-rules",
  "more/profile",
  "more/settings",
];
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ path?: string[] }>;
  searchParams: Promise<DashboardQuery>;
}) {
  const { path } = await params;
  const route = (path ?? []).join("/");
  if (!routes.includes(route)) notFound();
  const query = await searchParams;
  if (query.shell === "1")
    return <Workspace route={route} otherGame={query.game === "second"} />;
  if (
    ["", "games", "stats", "beverages", "more", "more/alibi", "more/beverage-rules"].includes(route) ||
    (route === "games/live" && query.sample === "1")
  ) {
    const dashboard = await dashboardProps(route, query);
    if (route === "" && dashboard.sample && query.sample !== "1")
      redirect("/login");
    return <PlayerDashboard {...dashboard} setupReturnHref={route === "more/beverage-rules" ? query.returnTo : undefined} />;
  }
  redirect(route === "games/live" ? "/club/score" : "/club");
}
