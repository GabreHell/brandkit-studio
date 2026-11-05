import type { BrandProject } from "../../types/brand";
import { normalizeHex, rgbValue } from "../brand-system/model";
export function exportColors(project: BrandProject) {
  return {
    schemaVersion: 1,
    project: { id: project.id, name: project.name },
    colors: project.colors.map((color) => ({
      ...color,
      hex: normalizeHex(color.hex),
      rgb: rgbValue(color.hex),
    })),
  };
}
export function exportTokens(project: BrandProject) {
  return {
    schemaVersion: 1,
    format: "brandkit-studio-tokens",
    project: { id: project.id, name: project.name },
    // IDs avoid collisions when colors share names or roles. These are app tokens, not a DTCG claim.
    colors: Object.fromEntries(
      project.colors.map((color) => [
        color.id,
        {
          name: color.name,
          role: color.role,
          value: normalizeHex(color.hex),
          type: "color",
        },
      ]),
    ),
    typography: Object.fromEntries(
      Object.entries(project.typography).map(([role, style]) => [
        role,
        { ...style, sizeUnit: "px", lineHeightUnit: "unitless" },
      ]),
    ),
  };
}
export function downloadName(name: string, suffix: string) {
  const base =
    name
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9_-]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 70) || "brand";
  return `${base}-${suffix}`;
}
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  try {
    link.click();
  } finally {
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
}
export function jsonBlob(value: unknown) {
  return new Blob([JSON.stringify(value, null, 2) + "\n"], {
    type: "application/json;charset=utf-8",
  });
}
export function exportWarnings(project: BrandProject): string[] {
  return [
    !project.assets.some((a) => a.category === "primary") &&
      "No primary logo is assigned.",
    !project.colors.length && "The color palette is empty.",
    !project.guidelines.logoUsage.trim() &&
      "No designer-defined logo usage rules were provided.",
  ].filter((value): value is string => !!value);
}
