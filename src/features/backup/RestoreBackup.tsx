import { useRef, useState } from "react";
import type { BrandProject } from "../../types/brand";
import { restoreBackup } from "./backup";
import { storageMessage } from "../projects/model";

export function RestoreBackup({
  onRestored,
  onBusy,
}: {
  onRestored: (project: BrandProject) => void;
  onBusy: (busy: boolean) => void;
}) {
  const locked = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function restore(file: File) {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    onBusy(true);
    setError("");
    let restored: BrandProject | undefined;
    try {
      restored = await restoreBackup(file);
    } catch (failure) {
      setError(storageMessage(failure));
    } finally {
      locked.current = false;
      setBusy(false);
      onBusy(false);
    }
    if (restored) onRestored(restored);
  }
  return (
    <section className="feature-panel">
      <h2>Restore a project backup</h2>
      <p>
        Import a complete BrandKit backup as a new project, including images and
        saved settings. Existing projects stay unchanged. Maximum 75 MB; palette
        and token exports cannot be restored.
      </p>
      <label htmlFor="restore-backup">Choose project backup</label>
      <input
        id="restore-backup"
        type="file"
        accept=".json"
        disabled={busy}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void restore(file);
        }}
      />
      {busy && <p role="status">Validating images and restoring project…</p>}
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
    </section>
  );
}
