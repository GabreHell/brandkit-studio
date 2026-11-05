import { useEffect, useState } from "react";
import type { BrandGuidelines, BrandProject } from "../../types/brand";
import { storageMessage } from "../projects/model";
import { NOTE_LIMIT, validateGuidelines } from "./model";
import { GuidelinesDocument } from "./GuidelinesDocument";
const fields: { key: keyof BrandGuidelines; label: string; hint: string }[] = [
  {
    key: "introduction",
    label: "Introduction",
    hint: "Describe the identity in your own words.",
  },
  {
    key: "logoUsage",
    label: "Logo usage",
    hint: "Add only rules you have defined, such as clear space, minimum size or restrictions. Leave blank if undecided.",
  },
  {
    key: "applicationNotes",
    label: "Application notes",
    hint: "Document your guidance for using this identity in real applications.",
  },
];
export function GuidelinesEditor({
  project,
  onSave,
  onDirty,
}: {
  project: BrandProject;
  onSave: (next: BrandProject) => Promise<void>;
  onDirty: (value: boolean) => void;
}) {
  const [notes, setNotes] = useState(project.guidelines);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const dirty = JSON.stringify(notes) !== JSON.stringify(project.guidelines);
  useEffect(() => {
    onDirty(dirty || busy);
    return () => onDirty(false);
  }, [dirty, busy, onDirty]);
  return (
    <div className="guidelines-workspace">
      <form
        className="project-form feature-panel"
        onSubmit={async (event) => {
          event.preventDefault();
          setError("");
          setStatus("");
          try {
            validateGuidelines(notes);
            setBusy(true);
            await onSave({
              ...project,
              guidelines: notes,
              updatedAt: new Date(
                Math.max(Date.now(), Date.parse(project.updatedAt) + 1),
              ).toISOString(),
            });
            setStatus("Guidelines saved to this browser.");
          } catch (failure) {
            setError(storageMessage(failure));
          } finally {
            setBusy(false);
          }
        }}
      >
        <h2>Your guidance, in your words</h2>
        <p>
          The document below assembles your saved assets, palette and
          typography. Text edits appear immediately; save to keep them. Change
          visual elements in their respective workspaces.
        </p>
        <fieldset disabled={busy}>
          {fields.map((field) => (
            <div key={field.key}>
              <label htmlFor={`guide-${field.key}`}>{field.label}</label>
              <textarea
                id={`guide-${field.key}`}
                rows={4}
                maxLength={NOTE_LIMIT}
                value={notes[field.key]}
                aria-describedby={`hint-${field.key}`}
                onChange={(event) => {
                  setNotes({ ...notes, [field.key]: event.target.value });
                  setStatus("");
                  setError("");
                }}
              />
              <small id={`hint-${field.key}`}>
                {field.hint} {notes[field.key].length.toLocaleString()} / 5,000
              </small>
            </div>
          ))}
          <div className="form-actions">
            <button type="submit" disabled={!dirty} className="primary-button">
              {busy ? "Saving…" : "Save guidelines"}
            </button>
            <button
              type="button"
              disabled={!dirty}
              className="secondary-button"
              onClick={() => {
                if (window.confirm("Discard unsaved guideline edits?")) {
                  setNotes(project.guidelines);
                  setError("");
                  setStatus("Changes discarded.");
                }
              }}
            >
              Discard changes
            </button>
          </div>
        </fieldset>
        {error && (
          <p role="alert" className="error-message">
            {error}
          </p>
        )}
        {status && (
          <p role="status" className="success-message">
            {status}
          </p>
        )}
      </form>
      <div className="section-heading">
        <h2>Document preview</h2>
        <span>{dirty ? "Unsaved text edits" : "Saved project content"}</span>
      </div>
      <p className="system-help">
        Download the saved document from Export. This working document includes
        placeholders wherever content has not been provided.
      </p>
      <GuidelinesDocument project={{ ...project, guidelines: notes }} />
    </div>
  );
}
