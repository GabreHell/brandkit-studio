import type {
  BrandAsset,
  BrandProject,
  TypographyStyle,
} from "../../types/brand";
import { readAsset, restoreProject } from "../../lib/projects-db";
import { createProject, validateDetails } from "../projects/model";
import { validateColors, validateTypography } from "../brand-system/model";
import { validateGuidelines } from "../guidelines/model";
import { MAX_FILE_SIZE, prepareAsset } from "../assets/validation";

export const MAX_BACKUP_SIZE = 75 * 1024 * 1024;
const MAX_IMAGES_SIZE = 50 * 1024 * 1024;
const invalid = () =>
  new Error(
    "Invalid or unsupported BrandKit backup. No projects were changed.",
  );
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw invalid();
  return value as Record<string, unknown>;
}
function string(value: unknown, max = 5000): string {
  if (typeof value !== "string" || value.length > max) throw invalid();
  return value;
}
function list(value: unknown, max: number): unknown[] {
  if (!Array.isArray(value) || value.length > max) throw invalid();
  return value;
}
function number(value: unknown, min: number, max: number): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < min ||
    value > max
  )
    throw invalid();
  return value;
}
function typography(value: unknown): TypographyStyle {
  const v = record(value);
  return {
    family: string(v.family, 100),
    size: number(v.size, 8, 120),
    weight: number(v.weight, 400, 700),
    lineHeight: number(v.lineHeight, 1, 2.5),
  };
}
export async function createBackup(project: BrandProject): Promise<Blob> {
  if (project.assets.length > 100 || project.colors.length > 1000)
    throw new Error(
      "Backup supports up to 100 images and 1,000 colors per project.",
    );
  const images = [];
  let total = 0;
  for (const asset of project.assets) {
    const blob = await readAsset(asset.blobId);
    total += blob.size;
    if (total > MAX_IMAGES_SIZE)
      throw new Error("Backup supports up to 50 MB of images per project.");
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = "";
    for (let i = 0; i < bytes.length; i += 8192)
      binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    images.push({ assetId: asset.id, data: btoa(binary) });
  }
  const blob = new Blob(
    [
      JSON.stringify({
        format: "brandkit-project-backup",
        version: 1,
        project,
        images,
      }),
    ],
    { type: "application/json" },
  );
  if (blob.size > MAX_BACKUP_SIZE)
    throw new Error("Backup exceeds the 75 MB file limit.");
  return blob;
}

export async function restoreBackup(file: File): Promise<BrandProject> {
  if (!file.size || file.size > MAX_BACKUP_SIZE)
    throw new Error("Choose a BrandKit backup no larger than 75 MB.");
  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw invalid();
  }
  const root = record(parsed);
  if (root.format !== "brandkit-project-backup" || root.version !== 1)
    throw invalid();
  const p = record(root.project);
  if (p.schemaVersion !== 1) throw invalid();
  const name = string(p.name, 80),
    description = string(p.description, 2000);
  validateDetails(name, description);
  const project = createProject(name, description);
  const type = record(p.typography),
    notes = record(p.guidelines),
    settings = record(p.exportSettings);
  project.typography = validateTypography({
    heading: typography(type.heading),
    body: typography(type.body),
  });
  project.guidelines = {
    introduction: string(notes.introduction),
    logoUsage: string(notes.logoUsage),
    applicationNotes: string(notes.applicationNotes),
  };
  validateGuidelines(project.guidelines);
  if (
    !["A4", "Letter"].includes(String(settings.pageSize)) ||
    typeof settings.includeAssets !== "boolean"
  )
    throw invalid();
  project.exportSettings = {
    pageSize: settings.pageSize as "A4" | "Letter",
    includeAssets: settings.includeAssets,
  };
  project.colors = validateColors(
    list(p.colors, 1000).map((value) => {
      const color = record(value);
      return {
        id: crypto.randomUUID(),
        name: string(color.name, 60),
        hex: string(color.hex, 7),
        role: string(color.role, 20) as BrandProject["colors"][number]["role"],
      };
    }),
  );
  const assets = list(p.assets, 100),
    images = list(root.images, 100);
  if (assets.length !== images.length) throw invalid();
  const imageData = new Map<string, string>();
  for (const value of images) {
    const image = record(value),
      id = string(image.assetId, 100);
    if (imageData.has(id)) throw invalid();
    imageData.set(id, string(image.data, Math.ceil(MAX_FILE_SIZE / 3) * 4));
  }
  const blobs: Record<string, Blob> = {};
  let total = 0;
  for (const value of assets) {
    const asset = record(value),
      id = string(asset.id, 100);
    const data = imageData.get(id);
    if (!data || data.length % 4 !== 0 || /[^A-Za-z0-9+/=]/.test(data))
      throw invalid();
    imageData.delete(id);
    let binary: string;
    try {
      binary = atob(data);
    } catch {
      throw invalid();
    }
    total += binary.length;
    if (binary.length > MAX_FILE_SIZE || total > MAX_IMAGES_SIZE)
      throw invalid();
    const category = string(asset.category, 30) as BrandAsset["category"];
    const mimeType = string(asset.mimeType, 30) as BrandAsset["mimeType"];
    if (
      ![
        "primary",
        "secondary",
        "horizontal",
        "vertical",
        "monochrome",
        "symbol",
        "supporting",
      ].includes(category) ||
      !["image/png", "image/jpeg", "image/webp", "image/svg+xml"].includes(
        mimeType,
      )
    )
      throw invalid();
    const assetName = string(asset.name, 255);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const prepared = await prepareAsset(
      new File([bytes], assetName, { type: mimeType }),
    );
    if (prepared.mimeType !== mimeType) throw invalid();
    const restored: BrandAsset = {
      id: crypto.randomUUID(),
      blobId: crypto.randomUUID(),
      name: assetName,
      category,
      mimeType,
      alt: string(asset.alt),
      size: prepared.blob.size,
    };
    if (asset.placement !== undefined) {
      const placement = record(asset.placement);
      restored.placement = {
        scale: number(placement.scale, 25, 100),
        x: number(placement.x, 0, 100),
        y: number(placement.y, 0, 100),
      };
    }
    blobs[restored.blobId] = prepared.blob;
    project.assets.push(restored);
  }
  await restoreProject(project, blobs);
  return project;
}
