import { ArrowUpRight, Folder, Plus } from "lucide-react";
import type { BrandProject } from "../../types/brand";
export function ProjectList({
  projects,
  onCreate,
  onOpen,
}: {
  projects: BrandProject[];
  onCreate: () => void;
  onOpen: (id: string) => void;
}) {
  return (
    <section className="projects-page">
      <div className="section-heading">
        <h2>
          Your projects <span className="count-badge">{projects.length}</span>
        </h2>
        <button className="primary-button" onClick={onCreate}>
          <Plus size={16} /> New project
        </button>
      </div>
      {projects.length === 0 ? (
        <div className="feature-panel projects-empty">
          <Folder size={32} />
          <h2>A home for your first brand</h2>
          <p>
            Create a project to organize an existing identity. Your projects are
            saved on this browser.
          </p>
          <button className="primary-button" onClick={onCreate}>
            Create your first project
          </button>
        </div>
      ) : (
        <div className="project-list">
          {projects.map((project) => (
            <button
              className="saved-project"
              key={project.id}
              onClick={() => onOpen(project.id)}
            >
              <span className="project-initial">
                {Array.from(project.name)[0]}
              </span>
              <div>
                <strong>{project.name}</strong>
                <p>{project.description || "No description yet."}</p>
                <small>
                  Updated {new Date(project.updatedAt).toLocaleString()}
                </small>
              </div>
              <ArrowUpRight size={18} />
            </button>
          ))}
        </div>
      )}
      <div className="sample-project-row">
        <div>
          <strong>Explore a sample identity</strong>
          <p>Forma is a read-only demo, separate from your saved projects.</p>
        </div>
        <button
          className="secondary-button"
          onClick={() => onOpen("demo-forma")}
        >
          View Forma
        </button>
      </div>
    </section>
  );
}
