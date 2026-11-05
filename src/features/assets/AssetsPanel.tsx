import { useRef, useState } from "react";
import type {
  AssetCategory,
  BrandAsset,
  BrandProject,
} from "../../types/brand";
import { saveAssets } from "../../lib/projects-db";
import { storageMessage } from "../projects/model";
import { prepareAsset } from "./validation";
import { AssetPlacementEditor } from "./AssetPlacementEditor";
const categories: AssetCategory[] = [
  "primary",
  "secondary",
  "horizontal",
  "vertical",
  "monochrome",
  "symbol",
  "supporting",
];
export function AssetsPanel({
  project,
  onSaved,
  onBusy,
}: {
  project: BrandProject;
  onSaved: (next: BrandProject) => void;
  onBusy: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<AssetCategory>("primary");
  const locked = useRef(false);
  async function perform(operation: () => Promise<void>) {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    onBusy(true);
    setError("");
    setMessage("");
    try {
      await operation();
      setMessage("Assets saved to this browser.");
    } catch (failure) {
      setError(storageMessage(failure));
    } finally {
      locked.current = false;
      setBusy(false);
      onBusy(false);
    }
  }
  async function commit(
    assets: BrandAsset[],
    blobs: Record<string, Blob> = {},
  ) {
    const next = {
      ...project,
      assets,
      updatedAt: new Date(
        Math.max(Date.now(), Date.parse(project.updatedAt) + 1),
      ).toISOString(),
    };
    await saveAssets(next, project.updatedAt, blobs);
    onSaved(next);
  }
  async function upload(file: File, previous?: BrandAsset) {
    await perform(async () => {
      const { blob, mimeType } = await prepareAsset(file);
      const blobId = crypto.randomUUID();
      const asset: BrandAsset = {
        id: previous?.id ?? crypto.randomUUID(),
        name: file.name,
        category: previous?.category ?? category,
        mimeType,
        blobId,
        size: blob.size,
        alt: file.name,
        placement: previous?.placement,
      };
      await commit(
        previous
          ? project.assets.map((item) =>
              item.id === previous.id ? asset : item,
            )
          : [...project.assets, asset],
        { [blobId]: blob },
      );
    });
  }
  return (
    <section className="assets-panel">
      <div className="feature-panel upload-panel">
        <h2>Add your existing brand assets</h2>
        <p>
          PNG, JPG, WebP or static SVG. Up to 10 MB per file. SVG text should be
          outlined; embedded images and styles are not supported.
        </p>
        <fieldset disabled={busy}>
          <label htmlFor="upload-category">Category for new uploads</label>
          <select
            id="upload-category"
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as AssetCategory)
            }
          >
            {categories.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
          <label htmlFor="asset-upload">
            Upload a logo or supporting graphic
          </label>
          <input
            id="asset-upload"
            type="file"
            accept=".png,.jpg,.jpeg,.webp,.svg"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void upload(file);
            }}
          />
        </fieldset>
      </div>
      {busy && <p role="status">Validating and saving…</p>}
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="success-message" role="status">
          {message}
        </p>
      )}
      {!project.assets.length && (
        <p className="empty-assets">
          No uploaded assets yet. Choose an existing logo to get started.
        </p>
      )}
      <div className="assets-grid">
        {project.assets.map((asset) => (
          <article className="asset-card" key={asset.id}>
            <AssetPlacementEditor
              key={`${asset.blobId}-${JSON.stringify(asset.placement)}`}
              asset={asset}
              busy={busy}
              onSave={(updated) =>
                perform(() =>
                  commit(
                    project.assets.map((item) =>
                      item.id === updated.id ? updated : item,
                    ),
                  ),
                )
              }
            />
            <h2>{asset.name}</h2>
            <small>
              {asset.mimeType.replace("image/", "")} ·{" "}
              {(asset.size / 1024).toFixed(1)} KB
            </small>
            <fieldset disabled={busy}>
              <label htmlFor={`category-${asset.id}`}>Category</label>
              <select
                id={`category-${asset.id}`}
                value={asset.category}
                onChange={(event) => {
                  const value = event.target.value as AssetCategory;
                  void perform(() =>
                    commit(
                      project.assets.map((item) =>
                        item.id === asset.id
                          ? { ...item, category: value }
                          : item,
                      ),
                    ),
                  );
                }}
              >
                {categories.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
              <label htmlFor={`replace-${asset.id}`}>Replace file</label>
              <input
                id={`replace-${asset.id}`}
                type="file"
                accept=".png,.jpg,.jpeg,.webp,.svg"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (
                    file &&
                    window.confirm(
                      `Replace “${asset.name}”? The previous file will be removed after the replacement is saved.`,
                    )
                  )
                    void upload(file, asset);
                }}
              />
              <button
                className="danger-button"
                onClick={() => {
                  if (
                    window.confirm(
                      `Remove “${asset.name}”? This cannot be undone.`,
                    )
                  )
                    void perform(() =>
                      commit(
                        project.assets.filter((item) => item.id !== asset.id),
                      ),
                    );
                }}
              >
                Remove asset
              </button>
            </fieldset>
          </article>
        ))}
      </div>
    </section>
  );
}
