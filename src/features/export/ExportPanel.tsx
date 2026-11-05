import { useRef, useState } from "react";
import type { BrandProject } from "../../types/brand";
import {
  downloadBlob,
  downloadName,
  exportColors,
  exportTokens,
  exportWarnings,
  jsonBlob,
} from "./data";
import { storageMessage } from "../projects/model";
import { createBackup } from "../backup/backup";
export function ExportPanel({
  project,
  onBusy,
}: {
  project: BrandProject;
  onBusy: (value: boolean) => void;
}) {
  const [pageSize, setPageSize] = useState<"A4" | "Letter">(
    project.exportSettings.pageSize,
  );
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const warnings = exportWarnings(project);
  const running = useRef(false);
  async function generate(kind: "pdf" | "colors" | "tokens" | "backup") {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    onBusy(true);
    setError("");
    setStatus("Preparing export…");
    try {
      if (kind === "backup") {
        downloadBlob(
          await createBackup(project),
          downloadName(project.name, "brandkit-backup.json"),
        );
      } else if (kind === "pdf") {
        const [{ createGuidelinesPdf }, { loadExportImage }] =
          await Promise.all([import("./pdf"), import("./images")]);
        const bytes = await createGuidelinesPdf(project, {
          pageSize,
          loadImage: loadExportImage,
          onProgress: (pages) => setStatus(`Rendered ${pages} pages…`),
        });
        downloadBlob(
          new Blob([new Uint8Array(bytes)], { type: "application/pdf" }),
          downloadName(project.name, "guidelines.pdf"),
        );
      } else
        downloadBlob(
          jsonBlob(
            kind === "colors" ? exportColors(project) : exportTokens(project),
          ),
          downloadName(project.name, `${kind}.json`),
        );
      setStatus(
        "File generated. Download requested; check your browser downloads.",
      );
    } catch (failure) {
      setError(storageMessage(failure));
      setStatus("");
    } finally {
      running.current = false;
      setBusy(false);
      onBusy(false);
    }
  }
  return (
    <section className="feature-panel export-panel">
      <h2>Prepare your brand handoff</h2>
      <p>
        Exports use this project's saved content. Assets remain stored in this
        browser. Use the complete project backup below to transfer them.
      </p>
      {!!warnings.length && (
        <div className="phase-note">
          <div>
            <strong>Review before handoff</strong>
            <ul>
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
            <p>
              You can export an incomplete project. Missing content will be
              labeled.
            </p>
          </div>
        </div>
      )}
      <fieldset disabled={busy}>
        <h3>Complete project backup</h3>
        <p>
          Includes saved images, their placement, colors, typography and
          guidelines. Restore it from All projects on another browser or site
          address. Up to 100 images and 50 MB of image data. Keep this file
          private if your project is confidential.
        </p>
        <button
          className="primary-button"
          onClick={() => void generate("backup")}
        >
          Download project backup
        </button>
        <h3>Brand guidelines PDF</h3>
        <p>
          A structured, multi-page document at 216 dpi. Fonts and logos are
          rendered as images to preserve their appearance on this device. Text
          is not selectable, searchable, or tagged for screen readers. File size
          grows with the document.
        </p>
        <label htmlFor="export-page-size">Paper size for this download</label>
        <select
          id="export-page-size"
          value={pageSize}
          onChange={(e) => setPageSize(e.target.value as "A4" | "Letter")}
        >
          <option>A4</option>
          <option>Letter</option>
        </select>
        <button className="primary-button" onClick={() => void generate("pdf")}>
          Download guidelines PDF
        </button>
        <h3>Reusable brand data</h3>
        <p>
          Palette JSON includes HEX and RGB. Tokens JSON includes stable color
          IDs, roles, and typography units in the BrandKit schema.
        </p>
        <div className="form-actions">
          <button
            className="secondary-button"
            onClick={() => void generate("colors")}
          >
            Download colors JSON
          </button>
          <button
            className="secondary-button"
            onClick={() => void generate("tokens")}
          >
            Download tokens JSON
          </button>
        </div>
      </fieldset>
      {status && (
        <p role="status" className="success-message">
          {status}
        </p>
      )}
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
    </section>
  );
}
