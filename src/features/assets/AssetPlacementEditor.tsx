import { useState } from "react";
import type { BrandAsset } from "../../types/brand";
import { assetPlacement } from "./placement";
import { AssetImage } from "./AssetImage";

export function AssetPlacementEditor({
  asset,
  busy,
  onSave,
}: {
  asset: BrandAsset;
  busy: boolean;
  onSave: (asset: BrandAsset) => Promise<void>;
}) {
  const [placement, setPlacement] = useState(() => assetPlacement(asset));
  const saved = assetPlacement(asset);
  const dirty = Object.keys(saved).some(
    (key) =>
      saved[key as keyof typeof saved] !==
      placement[key as keyof typeof placement],
  );
  return (
    <>
      <AssetImage asset={{ ...asset, placement }} />
      <details>
        <summary>Adjust size & position</summary>
        <p>
          Adjust within the image area. Save to apply to guidelines, previews
          and PDF. Original file stays unchanged.
        </p>
        <fieldset disabled={busy}>
          {(["scale", "x", "y"] as const).map((key) => (
            <label key={key}>
              {key === "scale"
                ? "Size"
                : key === "x"
                  ? "Horizontal position"
                  : "Vertical position"}
              : {placement[key]}%
              <input
                type="range"
                min={key === "scale" ? 25 : 0}
                max={100}
                value={placement[key]}
                onChange={(event) =>
                  setPlacement({
                    ...placement,
                    [key]: Number(event.target.value),
                  })
                }
              />
            </label>
          ))}
          <button
            type="button"
            onClick={() => setPlacement({ scale: 100, x: 50, y: 50 })}
          >
            Reset position
          </button>
          <button
            type="button"
            disabled={!dirty}
            onClick={() => void onSave({ ...asset, placement })}
          >
            Save placement
          </button>
          {dirty && <p role="status">Placement preview — save to apply.</p>}
        </fieldset>
      </details>
    </>
  );
}
