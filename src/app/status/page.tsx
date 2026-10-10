import type { Metadata } from "next";
import { ProjectStatusDashboard } from "@/components/project-status-dashboard";
import { projectTracker } from "@/data/project-tracker";
export const metadata: Metadata = { title: "Project status · Diamond Alibi" };
export default function StatusPage() {
  return <ProjectStatusDashboard tracker={projectTracker} />;
}
