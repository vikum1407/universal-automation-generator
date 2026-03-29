import { Section } from "../ui/Section";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";

interface Project {
  name: string;
  total_tests: number;
  pass_rate: number;
  last_run: string;
}

export function ProjectDetailView({ project }: { project: Project | null }) {
  if (!project)
    return <EmptyState message="No project selected." />;

  return (
    <Section title="Project Overview">
      <Card>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-caption text-neutral-mid">Project Name</div>
            <div className="text-body font-medium">{project.name}</div>
          </div>

          <div>
            <div className="text-caption text-neutral-mid">Total Tests</div>
            <div className="text-body font-medium">{project.total_tests}</div>
          </div>

          <div>
            <div className="text-caption text-neutral-mid">Pass Rate</div>
            <div className="text-body font-medium text-brand-secondary">
              {project.pass_rate}%
            </div>
          </div>

          <div>
            <div className="text-caption text-neutral-mid">Last Run</div>
            <div className="text-body font-medium">{project.last_run}</div>
          </div>
        </div>
      </Card>
    </Section>
  );
}
