import { useEffect, useState } from "react";
import type { BrandProject } from "../../types/brand";
import { createProject, storageMessage, validateDetails } from "./model";
export function ProjectForm({
  project,
  onSave,
  onCancel,
  onDirtyChange,
}: {
  project?: BrandProject;
  onSave: (project: BrandProject, expected?: string) => Promise<void>;
  onCancel: () => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const dirty =
    name !== (project?.name ?? "") ||
    description !== (project?.description ?? "");
  useEffect(() => {
    onDirtyChange(dirty || busy);
    return () => onDirtyChange(false);
  }, [dirty, busy, onDirtyChange]);
  return (
    <form
      className="project-form feature-panel"
      onSubmit={async (event) => {
        event.preventDefault();
        setError("");
        try {
          validateDetails(name, description);
          setBusy(true);
          const next = project
            ? {
                ...project,
                name: name.trim(),
                description: description.trim(),
                updatedAt: new Date(
                  Math.max(Date.now(), Date.parse(project.updatedAt) + 1),
                ).toISOString(),
              }
            : createProject(name, description);
          await onSave(next, project?.updatedAt);
        } catch (failure) {
          setError(storageMessage(failure));
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2>{project ? "Edit project information" : "Create a brand project"}</h2>
      <p>
        Start with the identity you already created. You can add its assets in
        the next milestone.
      </p>
      <fieldset disabled={busy}>
        <label htmlFor="brand-name">
          Brand name <span>(required)</span>
        </label>
        <input
          id="brand-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={80}
          required
          autoFocus
          aria-describedby="name-hint"
        />
        <small id="name-hint">Up to 80 characters.</small>
        <label htmlFor="brand-description">
          Description <span>(optional)</span>
        </label>
        <textarea
          id="brand-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={2000}
          rows={5}
          aria-describedby="description-hint"
        />
        <small id="description-hint">
          {description.length.toLocaleString()} / 2,000 characters
        </small>
        {error && (
          <p role="alert" className="error-message">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button
            type="submit"
            className="primary-button"
            disabled={!!project && !dirty}
          >
            {busy ? "Saving…" : project ? "Save changes" : "Create project"}
          </button>
          <button type="button" className="secondary-button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </fieldset>
      {busy && <p role="status">Saving to this browser…</p>}
    </form>
  );
}
