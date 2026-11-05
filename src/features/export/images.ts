import type { BrandAsset } from "../../types/brand";
import { readAsset } from "../../lib/projects-db";
export async function loadExportImage(asset: BrandAsset) {
  const blob = await readAsset(asset.blobId);
  const url = URL.createObjectURL(blob);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      const timer = window.setTimeout(() => {
        img.src = "";
        reject(new Error(`Image loading timed out: ${asset.name}`));
      }, 10000);
      img.onload = () => {
        clearTimeout(timer);
        resolve(img);
      };
      img.onerror = () => {
        clearTimeout(timer);
        reject(
          new Error(
            `Could not decode ${asset.name}. Replace it before exporting.`,
          ),
        );
      };
      img.src = url;
    });
    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      release: () => URL.revokeObjectURL(url),
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}
