import { useCallback, useEffect, useRef, useState } from "react";
import { Workspace } from "./Workspace";
import { readRoute, routeHash, type Route, type Screen } from "./routing";
import { demoProject } from "../features/projects/demo";
import { ProjectList } from "../features/projects/ProjectList";
import { ProjectForm } from "../features/projects/ProjectForm";
import { listProjects, saveProject, deleteProject } from "../lib/projects-db";
import { storageMessage } from "../features/projects/model";
import type { BrandProject } from "../types/brand";
import { AssetsPanel } from "../features/assets/AssetsPanel";
import { BrandSystemEditor } from "../features/brand-system/BrandSystemEditor";
import { GuidelinesEditor } from "../features/guidelines/GuidelinesEditor";
import { ExportPanel } from "../features/export/ExportPanel";
import { RestoreBackup } from "../features/backup/RestoreBackup";
export default function App() {
  const [route, setRoute] = useState<Route>(readRoute);
  const [projects, setProjects] = useState<BrandProject[]>([]);
  const [previewDraft, setPreviewDraft] = useState<BrandProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const dirty = useRef(false);
  const saving = useRef(false);
  const lastHash = useRef(window.location.hash);
  const setDirty = useCallback((value: boolean) => {
    dirty.current = value;
  }, []);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const reload = () => {
    setLoading(true);
    setLoadError("");
    setLoadAttempt((value) => value + 1);
  };
  useEffect(() => {
    let active = true;
    listProjects().then(
      (records) => {
        if (active) {
          setProjects(records);
          setLoading(false);
        }
      },
      (error) => {
        if (active) {
          setLoadError(storageMessage(error));
          setLoading(false);
        }
      },
    );
    return () => {
      active = false;
    };
  }, [loadAttempt]);
  useEffect(() => {
    const onHash = () => {
      if (saving.current) {
        window.history.replaceState(null, "", lastHash.current || "#/projects");
        return;
      }
      if (dirty.current && !window.confirm("Discard unsaved changes?")) {
        window.history.replaceState(null, "", lastHash.current || "#/projects");
        return;
      }
      dirty.current = false;
      lastHash.current = window.location.hash;
      setRoute(readRoute());
      setEditing(false);
      setActionError("");
      setNotice("");
    };
    const onUnload = (event: BeforeUnloadEvent) => {
      if (dirty.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("hashchange", onHash);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, []);
  const go = (next: Route) => {
    if (
      saving.current ||
      deleting ||
      (dirty.current && !window.confirm("Discard unsaved changes?"))
    )
      return;
    dirty.current = false;
    setEditing(false);
    setActionError("");
    setNotice("");
    const hash = routeHash(next);
    if (window.location.hash !== hash) window.history.pushState(null, "", hash);
    lastHash.current = hash;
    setRoute(next);
  };
  const selected =
    route.kind === "project"
      ? route.id === demoProject.id
        ? demoProject
        : (projects.find((project) => project.id === route.id) ?? null)
      : null;
  const screen: Screen = route.kind === "project" ? route.screen : "Projects";
  const navigate = (next: Screen) =>
    go(
      next === "Projects" || !selected
        ? { kind: "projects" }
        : { kind: "project", id: selected.id, screen: next },
    );
  const save = async (project: BrandProject, expected?: string) => {
    saving.current = true;
    try {
      await saveProject(project, expected);
    } finally {
      saving.current = false;
    }
    setProjects((current) => [
      project,
      ...current.filter((item) => item.id !== project.id),
    ]);
    dirty.current = false;
    go({ kind: "project", id: project.id, screen: "Overview" });
    setNotice(
      expected
        ? "Changes saved to this browser."
        : "Project created and saved to this browser.",
    );
  };
  let content;
  if (loading && selected?.id !== demoProject.id)
    content = <p role="status">Loading local projects…</p>;
  else if (loadError && selected?.id !== demoProject.id)
    content = (
      <section className="feature-panel">
        <h2>Local projects could not be loaded</h2>
        <p role="alert">{loadError}</p>
        <button className="primary-button" onClick={() => void reload()}>
          Retry
        </button>
        <button
          className="secondary-button"
          onClick={() =>
            go({ kind: "project", id: demoProject.id, screen: "Overview" })
          }
        >
          View sample instead
        </button>
      </section>
    );
  else if (route.kind === "projects")
    content = (
      <>
        <ProjectList
          projects={projects}
          onCreate={() => go({ kind: "new" })}
          onOpen={(id) => go({ kind: "project", id, screen: "Overview" })}
        />
        <RestoreBackup
          onBusy={(value) => {
            saving.current = value;
            dirty.current = value;
          }}
          onRestored={(project) => {
            setProjects((current) => [project, ...current]);
            go({ kind: "project", id: project.id, screen: "Overview" });
            setNotice("Backup restored as a new project in this browser.");
          }}
        />
      </>
    );
  else if (route.kind === "new")
    content = (
      <ProjectForm
        key="new"
        onSave={save}
        onCancel={() => go({ kind: "projects" })}
        onDirtyChange={setDirty}
      />
    );
  else if (!selected)
    content = (
      <section className="feature-panel">
        <h2>Project not found</h2>
        <p>
          This link is invalid, or the project is not stored in this browser.
        </p>
        <button
          className="primary-button"
          onClick={() => go({ kind: "projects" })}
        >
          Back to projects
        </button>
      </section>
    );
  else if (selected.id !== demoProject.id) {
    if (screen === "Overview")
      content = editing ? (
        <ProjectForm
          key={selected.id}
          project={selected}
          onSave={save}
          onDirtyChange={setDirty}
          onCancel={() => {
            if (!dirty.current || window.confirm("Discard unsaved changes?")) {
              dirty.current = false;
              setEditing(false);
            }
          }}
        />
      ) : (
        <section className="feature-panel project-detail">
          <span className="project-initial">
            {Array.from(selected.name)[0]}
          </span>
          <h2>{selected.name}</h2>
          <p className="project-description">
            {selected.description ||
              "Add a description to introduce this brand."}
          </p>
          <div className="form-actions">
            <button
              className="primary-button"
              onClick={() => {
                setNotice("");
                setEditing(true);
              }}
            >
              Edit project
            </button>
            <button
              className="danger-button"
              disabled={deleting}
              onClick={async () => {
                if (
                  !window.confirm(
                    `Delete “${selected.name}”? This removes this local project permanently and cannot be undone.`,
                  )
                )
                  return;
                setDeleting(true);
                setActionError("");
                try {
                  await deleteProject(selected);
                  setProjects((current) =>
                    current.filter((item) => item.id !== selected.id),
                  );
                  const next: Route = { kind: "projects" };
                  const hash = routeHash(next);
                  window.history.pushState(null, "", hash);
                  lastHash.current = hash;
                  setRoute(next);
                  setNotice("Project deleted.");
                } catch (error) {
                  setActionError(storageMessage(error));
                } finally {
                  setDeleting(false);
                }
              }}
            >
              {deleting ? "Deleting…" : "Delete project"}
            </button>
          </div>
          <dl className="project-metadata">
            <div>
              <dt>Created</dt>
              <dd>{new Date(selected.createdAt).toLocaleString()}</dd>
            </div>
            <div>
              <dt>Last saved</dt>
              <dd>{new Date(selected.updatedAt).toLocaleString()}</dd>
            </div>
          </dl>
          <div className="phase-note">
            <div>
              <strong>Ready for your brand assets</strong>
              <p>
                Your project information is saved. Open Brand assets to upload
                your logos, then use Colors and Typography to configure your
                brand system.
              </p>
            </div>
          </div>
        </section>
      );
    else if (screen === "Brand assets")
      content = (
        <AssetsPanel
          key={selected.id}
          project={selected}
          onBusy={(value) => {
            saving.current = value;
            dirty.current = value;
          }}
          onSaved={(next) =>
            setProjects((current) =>
              current.map((item) => (item.id === next.id ? next : item)),
            )
          }
        />
      );
    else if (screen === "Colors" || screen === "Typography")
      content = (
        <BrandSystemEditor
          key={`${selected.id}-${screen}`}
          project={selected}
          section={screen}
          onDraft={setPreviewDraft}
          onDirty={setDirty}
          onSave={async (next) => {
            saving.current = true;
            try {
              await saveProject(next, selected.updatedAt);
              setProjects((current) =>
                current.map((item) => (item.id === next.id ? next : item)),
              );
            } finally {
              saving.current = false;
            }
          }}
        />
      );
    else if (screen === "Guidelines")
      content = (
        <GuidelinesEditor
          key={selected.id}
          project={selected}
          onDirty={setDirty}
          onSave={async (next) => {
            saving.current = true;
            try {
              await saveProject(next, selected.updatedAt);
              setProjects((current) =>
                current.map((item) => (item.id === next.id ? next : item)),
              );
            } finally {
              saving.current = false;
            }
          }}
        />
      );
    else if (screen === "Export")
      content = (
        <ExportPanel
          key={selected.id}
          project={selected}
          onBusy={(value) => {
            saving.current = value;
            dirty.current = value;
          }}
        />
      );
    else
      content = (
        <section className="feature-panel">
          <h2>{`${screen} is coming soon`}</h2>
          <p>
            This workspace will use your own brand identity. Export arrives in
            Phase 6.
          </p>
        </section>
      );
  }
  return (
    <Workspace
      project={previewDraft?.id === selected?.id ? previewDraft : selected}
      screen={screen}
      onNavigate={navigate}
    >
      {content && (
        <>
          {notice && (
            <p className="success-message" role="status">
              {notice}
            </p>
          )}
          {actionError && (
            <p className="error-message" role="alert">
              {actionError}
            </p>
          )}
          {content}
        </>
      )}
    </Workspace>
  );
}
