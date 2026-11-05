import type { BrandAsset } from "../../types/brand";

export function assetPlacement(asset: BrandAsset) {
  const clamp = (
    value: number | undefined,
    fallback: number,
    min: number,
    max: number,
  ) =>
    Number.isFinite(value) ? Math.min(max, Math.max(min, value!)) : fallback;
  return {
    scale: clamp(asset.placement?.scale, 100, 25, 100),
    x: clamp(asset.placement?.x, 50, 0, 100),
    y: clamp(asset.placement?.y, 50, 0, 100),
  };
}

export function assetBounds(
  asset: BrandAsset,
  imageWidth: number,
  imageHeight: number,
  width: number,
  height: number,
) {
  const placement = assetPlacement(asset);
  const ratio =
    (Math.min(width / imageWidth, height / imageHeight) * placement.scale) /
    100;
  const w = imageWidth * ratio;
  const h = imageHeight * ratio;
  return {
    x: ((width - w) * placement.x) / 100,
    y: ((height - h) * placement.y) / 100,
    width: w,
    height: h,
  };
}
