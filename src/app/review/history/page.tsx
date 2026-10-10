import { notFound } from "next/navigation";
import { PlayerDashboard } from "@/components/player-dashboard";
import { dashboardProps, type DashboardQuery } from "@/app/dashboard-loader";
export const dynamic = "force-dynamic";
export default async function ReviewHistory({
  searchParams,
}: {
  searchParams: Promise<DashboardQuery & { route?: string }>;
}) {
  const query = await searchParams;
  const route = query.route ?? "";
  if (
    ![
      "",
      "games",
      "games/live",
      "stats",
      "beverages",
      "more",
      "more/alibi",
    ].includes(route)
  )
    notFound();
  // This route always supplies synthetic context; user queries cannot switch to a real team.
  return (
    <PlayerDashboard
      {...await dashboardProps(route, { ...query, sample: "1" })}
      review
    />
  );
}
