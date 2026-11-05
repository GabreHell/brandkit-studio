import type { BrandAsset } from "../../types/brand";
export const MAX_FILE_SIZE = 10 * 1024 * 1024;
// A deliberately restricted static SVG subset. Reject unsupported content rather
// than silently stripping it and changing a designer's artwork.
const elements = new Set(
  "svg g path rect circle ellipse line polyline polygon defs linearGradient radialGradient stop clipPath title desc".split(
    " ",
  ),
);
const attributes = new Set(
  "xmlns id viewBox width height x y x1 y1 x2 y2 cx cy r rx ry d points transform fill fill-rule fill-opacity stroke stroke-width stroke-linecap stroke-linejoin stroke-miterlimit stroke-dasharray stroke-dashoffset stroke-opacity opacity clip-path clip-rule offset stop-color stop-opacity gradientUnits gradientTransform spreadMethod fx fy fr preserveAspectRatio".split(
    " ",
  ),
);
export function safeSvg(source: string): string {
  if (/<!DOCTYPE|<!ENTITY|<\?/i.test(source.replace(/^\s*<\?xml[^?]*\?>/i, "")))
    throw new Error(
      "SVG declarations and external entities are not supported. Export a static SVG with outlined text.",
    );
  const doc = new DOMParser().parseFromString(source, "image/svg+xml");
  if (
    doc.querySelector("parsererror") ||
    doc.documentElement.localName !== "svg"
  )
    throw new Error("This SVG is malformed. Export it again.");
  const nodes = Array.from(doc.querySelectorAll("*"));
  if (nodes.length > 10000)
    throw new Error("This SVG is too complex. Simplify it before uploading.");
  for (const node of nodes) {
    if (
      node.namespaceURI !== "http://www.w3.org/2000/svg" ||
      !elements.has(node.localName)
    )
      throw new Error(
        "Unsupported SVG content. Export a static SVG with outlined text and no embedded images, styles, links, or scripts.",
      );
    for (const attr of Array.from(node.attributes)) {
      if (
        !attributes.has(attr.name) ||
        (/javascript:|data:|https?:|\/\/|\\|[<>]/i.test(attr.value) &&
          attr.name !== "xmlns")
      )
        throw new Error(
          "SVG active content or external references are not allowed.",
        );
      if (
        /url\s*\(/i.test(attr.value) &&
        !/^url\(#[a-zA-Z_][\w.-]*\)$/.test(attr.value)
      )
        throw new Error(
          "Only local SVG paint and clipping references are supported.",
        );
      if (attr.name === "xmlns" && attr.value !== "http://www.w3.org/2000/svg")
        throw new Error("Invalid SVG namespace.");
    }
  }
  return new XMLSerializer().serializeToString(doc.documentElement);
}
export async function prepareAsset(
  file: File,
): Promise<{ blob: Blob; mimeType: BrandAsset["mimeType"] }> {
  if (!file.size || file.size > MAX_FILE_SIZE)
    throw new Error("Choose a non-empty image no larger than 10 MB.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  let mimeType: BrandAsset["mimeType"];
  const starts = (...values: number[]) =>
    values.every((value, index) => bytes[index] === value);
  if (starts(137, 80, 78, 71, 13, 10, 26, 10)) mimeType = "image/png";
  else if (starts(255, 216, 255)) mimeType = "image/jpeg";
  else if (
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  )
    mimeType = "image/webp";
  else if (/\.svg$/i.test(file.name) || file.type === "image/svg+xml")
    mimeType = "image/svg+xml";
  else throw new Error("Choose a valid PNG, JPG, WebP, or SVG file.");
  const blob =
    mimeType === "image/svg+xml"
      ? new Blob([safeSvg(await file.text())], { type: mimeType })
      : new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  try {
    await new Promise<void>((resolve, reject) => {
      const image = new Image();
      const timer = window.setTimeout(() => {
        image.src = "";
        reject(new Error("Image decoding timed out. Try a smaller file."));
      }, 10000);
      image.onload = () => {
        clearTimeout(timer);
        if (
          !image.naturalWidth ||
          !image.naturalHeight ||
          image.naturalWidth * image.naturalHeight > 40_000_000
        )
          reject(
            new Error(
              "Image dimensions must be valid and below 40 megapixels.",
            ),
          );
        else resolve();
      };
      image.onerror = () => {
        clearTimeout(timer);
        reject(new Error("The image cannot be decoded. Export it again."));
      };
      image.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
  return { blob, mimeType };
}
