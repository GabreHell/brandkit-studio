import { useEffect, useState } from "react";
import type {
  BrandColor,
  BrandProject,
  TypographyStyle,
} from "../../types/brand";
import {
  colorRoles,
  fontFamilies,
  normalizeHex,
  rgbValue,
  validateColors,
  validateTypography,
} from "./model";
import { storageMessage } from "../projects/model";
export function BrandSystemEditor({
  project,
  section,
  onSave,
  onDraft,
  onDirty,
}: {
  project: BrandProject;
  section: "Colors" | "Typography";
  onSave: (next: BrandProject) => Promise<void>;
  onDraft: (next: BrandProject | null) => void;
  onDirty: (value: boolean) => void;
}) {
  const [draft, setDraft] = useState(project);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const dirty =
    JSON.stringify(draft.colors) !== JSON.stringify(project.colors) ||
    JSON.stringify(draft.typography) !== JSON.stringify(project.typography);
  useEffect(() => {
    onDirty(dirty || busy);
    return () => onDirty(false);
  }, [dirty, busy, onDirty]);
  useEffect(() => () => onDraft(null), [onDraft]);
  function update(next: BrandProject) {
    setDraft(next);
    setStatus("");
    setError("");
    try {
      onDraft({
        ...next,
        colors: validateColors(next.colors),
        typography: validateTypography(next.typography),
      });
    } catch {
      /* Keep the last valid preview while the input is incomplete. */
    }
  }
  function changeColor(id: string, patch: Partial<BrandColor>) {
    update({
      ...draft,
      colors: draft.colors.map((color) =>
        color.id === id ? { ...color, ...patch } : color,
      ),
    });
  }
  function changeType(
    key: "heading" | "body",
    patch: Partial<TypographyStyle>,
  ) {
    update({
      ...draft,
      typography: {
        ...draft.typography,
        [key]: { ...draft.typography[key], ...patch },
      },
    });
  }
  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setStatus(`Copied ${value}`);
    } catch {
      setError(
        "Clipboard access failed. Select and copy the displayed value manually.",
      );
    }
  }
  return (
    <form
      className="system-editor"
      onSubmit={async (event) => {
        event.preventDefault();
        setError("");
        setStatus("");
        try {
          const next = {
            ...draft,
            colors: validateColors(draft.colors),
            typography: validateTypography(draft.typography),
            updatedAt: new Date(
              Math.max(Date.now(), Date.parse(project.updatedAt) + 1),
            ).toISOString(),
          };
          setBusy(true);
          await onSave(next);
          setDraft(next);
          onDraft(null);
          setStatus("Brand system saved to this browser.");
        } catch (failure) {
          setError(storageMessage(failure));
        } finally {
          setBusy(false);
        }
      }}
    >
      <p className="system-help">
        {section === "Colors"
          ? "Define your palette. The first color assigned to each role is used in previews; unassigned roles use neutral preview defaults."
          : "Define headings and body text. These system fonts use installed versions and may look different across devices."}{" "}
        Valid changes appear immediately. Save to keep them after reloading.
      </p>
      <fieldset disabled={busy}>
        {section === "Colors" ? (
          <>
            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  update({
                    ...draft,
                    colors: [
                      ...draft.colors,
                      {
                        id: crypto.randomUUID(),
                        name: "New color",
                        hex: "#808080",
                        role: "accent",
                      },
                    ],
                  })
                }
              >
                Add color
              </button>
            </div>
            {!draft.colors.length && (
              <p className="empty-assets">
                No colors yet. Add the colors from your existing identity.
              </p>
            )}
            <div className="color-editor-list">
              {draft.colors.map((color) => {
                let hex = "";
                try {
                  hex = normalizeHex(color.hex);
                } catch {
                  /* Invalid partial input. */
                }
                return (
                  <section className="color-editor-card" key={color.id}>
                    <div
                      className="color-chip"
                      style={{ background: hex || "transparent" }}
                    />
                    <label htmlFor={`name-${color.id}`}>Color name</label>
                    <input
                      id={`name-${color.id}`}
                      maxLength={60}
                      required
                      value={color.name}
                      onChange={(e) =>
                        changeColor(color.id, { name: e.target.value })
                      }
                    />
                    <label htmlFor={`hex-${color.id}`}>HEX</label>
                    <input
                      id={`hex-${color.id}`}
                      value={color.hex}
                      required
                      aria-invalid={!hex}
                      maxLength={7}
                      onChange={(e) =>
                        changeColor(color.id, { hex: e.target.value })
                      }
                    />
                    {!hex && <small>Use 3 or 6 hexadecimal digits.</small>}
                    <label htmlFor={`role-${color.id}`}>Role</label>
                    <select
                      id={`role-${color.id}`}
                      value={color.role}
                      onChange={(e) =>
                        changeColor(color.id, {
                          role: e.target.value as BrandColor["role"],
                        })
                      }
                    >
                      {colorRoles.map((role) => (
                        <option key={role}>{role}</option>
                      ))}
                    </select>
                    <code>{hex ? rgbValue(hex) : "Invalid HEX"}</code>
                    <div className="form-actions">
                      <button
                        type="button"
                        disabled={!hex}
                        className="secondary-button"
                        onClick={() => void copy(hex)}
                      >
                        Copy HEX
                      </button>
                      <button
                        type="button"
                        disabled={!hex}
                        className="secondary-button"
                        onClick={() => void copy(rgbValue(hex))}
                      >
                        Copy RGB
                      </button>
                      <button
                        type="button"
                        className="danger-button"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Remove “${color.name}” from this palette? Save changes to confirm the removal.`,
                            )
                          )
                            update({
                              ...draft,
                              colors: draft.colors.filter(
                                (item) => item.id !== color.id,
                              ),
                            });
                        }}
                      >
                        Remove color
                      </button>
                    </div>
                  </section>
                );
              })}
            </div>
          </>
        ) : (
          <div className="type-editor-list">
            {(["heading", "body"] as const).map((key) => {
              const style = draft.typography[key];
              return (
                <section className="feature-panel" key={key}>
                  <h2>{key === "heading" ? "Headings" : "Body text"}</h2>
                  <label htmlFor={`${key}-font`}>Font family</label>
                  <select
                    id={`${key}-font`}
                    value={style.family}
                    onChange={(e) =>
                      changeType(key, { family: e.target.value })
                    }
                  >
                    {fontFamilies.map((font) => (
                      <option key={font}>{font}</option>
                    ))}
                  </select>
                  <label htmlFor={`${key}-size`}>Size (px)</label>
                  <input
                    id={`${key}-size`}
                    type="number"
                    min={8}
                    max={120}
                    step="any"
                    required
                    value={Number.isNaN(style.size) ? "" : style.size}
                    onChange={(e) =>
                      changeType(key, { size: e.target.valueAsNumber })
                    }
                  />
                  <label htmlFor={`${key}-weight`}>Weight</label>
                  <select
                    id={`${key}-weight`}
                    value={style.weight}
                    onChange={(e) =>
                      changeType(key, { weight: Number(e.target.value) })
                    }
                  >
                    <option value={400}>Regular (400)</option>
                    <option value={700}>Bold (700)</option>
                  </select>
                  <label htmlFor={`${key}-line`}>Line height</label>
                  <input
                    id={`${key}-line`}
                    type="number"
                    min={1}
                    max={2.5}
                    step="any"
                    required
                    value={
                      Number.isNaN(style.lineHeight) ? "" : style.lineHeight
                    }
                    onChange={(e) =>
                      changeType(key, { lineHeight: e.target.valueAsNumber })
                    }
                  />
                  <div
                    className="type-live-specimen"
                    style={{
                      fontFamily: style.family,
                      fontWeight: style.weight,
                      fontSize: Number.isFinite(style.size)
                        ? Math.min(120, Math.max(8, style.size))
                        : 16,
                      lineHeight: Number.isFinite(style.lineHeight)
                        ? Math.min(2.5, Math.max(1, style.lineHeight))
                        : 1.5,
                    }}
                  >
                    {key === "heading"
                      ? project.name
                      : project.description ||
                        "A clear and readable voice for your brand."}
                  </div>
                </section>
              );
            })}
          </div>
        )}
        <div className="form-actions">
          <button className="primary-button" disabled={!dirty} type="submit">
            {busy ? "Saving…" : "Save changes"}
          </button>
          <button
            className="secondary-button"
            disabled={!dirty}
            type="button"
            onClick={() => {
              if (window.confirm("Discard unsaved brand system changes?")) {
                setDraft(project);
                onDraft(null);
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
  );
}
