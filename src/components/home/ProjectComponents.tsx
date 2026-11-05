import type { MergedProject } from "@/lib/projects";

export function ProjectComponents({
  project,
}: {
  project: MergedProject & { components?: MergedProject[] };
}) {
  if (!project.components || project.components.length < 2) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-x-3 text-xs">
      {project.components.map((member) => (
        <span key={member.id} className="inline-flex items-center gap-2">
          <a
            className="inline-flex min-h-11 items-center underline underline-offset-4"
            href={member.htmlUrl || `https://github.com/aristache-labs/${member.repo}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {member.title}
          </a>
          {member.homepage && (
            <a
              className="inline-flex min-h-11 items-center underline"
              href={member.homepage}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Live site for ${member.title}`}
            >
              Live
            </a>
          )}
        </span>
      ))}
    </div>
  );
}
