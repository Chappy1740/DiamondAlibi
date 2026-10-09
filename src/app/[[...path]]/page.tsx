import { notFound } from "next/navigation";
import { Workspace } from "@/components/workspace";
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
  "more/profile",
  "more/settings",
];
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ path?: string[] }>;
  searchParams: Promise<{ game?: string }>;
}) {
  const { path } = await params;
  const route = (path ?? []).join("/");
  if (!routes.includes(route)) notFound();
  const { game } = await searchParams;
  return <Workspace route={route} otherGame={game === "second"} />;
}
