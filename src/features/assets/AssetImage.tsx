import { useEffect, useState } from "react";
import { readAsset } from "../../lib/projects-db";
import type { BrandAsset } from "../../types/brand";
import { assetPlacement } from "./placement";
export function AssetImage({ asset }: { asset: BrandAsset }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const placement = assetPlacement(asset);
  useEffect(() => {
    let active = true;
    let objectUrl = "";
    readAsset(asset.blobId).then(
      (blob) => {
        if (active) {
          objectUrl = URL.createObjectURL(blob);
          setUrl(objectUrl);
        }
      },
      () => {
        if (active)
          setError("Preview unavailable. Replace this file to restore it.");
      },
    );
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [asset.blobId]);
  return (
    <div className="asset-image">
      {error ? (
        <p role="alert">{error}</p>
      ) : url ? (
        <img
          src={url}
          alt={asset.alt || asset.name}
          style={{
            position: "absolute",
            width: `${placement.scale}%`,
            height: `${placement.scale}%`,
            maxWidth: "none",
            maxHeight: "none",
            left: `${placement.x}%`,
            top: `${placement.y}%`,
            transform: `translate(-${placement.x}%, -${placement.y}%)`,
            objectPosition: `${placement.x}% ${placement.y}%`,
          }}
        />
      ) : (
        <p role="status">Loading image…</p>
      )}
    </div>
  );
}
