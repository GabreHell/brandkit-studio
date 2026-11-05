import { expect, it } from "vitest";
import { assetBounds, assetPlacement } from "./placement";
import type { BrandAsset } from "../../types/brand";

const asset: BrandAsset = {
  id: "logo",
  name: "logo.png",
  category: "primary",
  mimeType: "image/png",
  blobId: "blob",
  size: 1,
  alt: "Logo",
};
it("keeps old projects centered and preserves image proportions", () => {
  expect(assetBounds(asset, 400, 100, 200, 100)).toEqual({
    x: 0,
    y: 25,
    width: 200,
    height: 50,
  });
});
it("resizes and positions within bounds without cropping", () => {
  expect(
    assetBounds(
      { ...asset, placement: { scale: 50, x: 100, y: 0 } },
      400,
      100,
      200,
      100,
    ),
  ).toEqual({ x: 100, y: 0, width: 100, height: 25 });
  expect(
    assetPlacement({ ...asset, placement: { scale: NaN, x: -10, y: 200 } }),
  ).toEqual({ scale: 100, x: 0, y: 100 });
});
