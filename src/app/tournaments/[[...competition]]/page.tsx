import { notFound } from "next/navigation";
import { dashboardProps, type DashboardQuery } from "@/app/dashboard-loader";
import { CompetitionPage } from "@/components/competition-page";
export const dynamic = "force-dynamic";
export default async function Page({ params, searchParams }: {
  params: Promise<{ competition?: string[] }>; searchParams: Promise<DashboardQuery & { from?: string; create?: string; settings?: string }>;
}) {
  const { competition = [] } = await params;
  if (competition.length > 1) notFound();
  const query = await searchParams;
  return <CompetitionPage data={await dashboardProps("tournaments", query)} kind="Tournament" id={competition[0]} fromGames={query.from === "games"} creating={query.create === "1"} settings={query.settings === "1"} />;
}
