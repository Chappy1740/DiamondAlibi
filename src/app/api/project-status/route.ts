import { projectTracker } from "@/data/project-tracker";
export const dynamic = "force-dynamic";
export function GET() {
  return Response.json(projectTracker, {
    headers: { "Cache-Control": "no-store" },
  });
}
