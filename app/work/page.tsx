import type { Metadata } from "next";
import { WorkGrid } from "@/components/sections/WorkGrid";
import { getAllProjects } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Hardware projects and engineering experience — PCB design, embedded systems, and electrical engineering.",
};

export default function WorkPage() {
  const projects = getAllProjects();

  return (
    <div className="py-12">
      <WorkGrid projects={projects} />
    </div>
  );
}
