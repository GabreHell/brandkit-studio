import type { BrandProject } from "../types/brand";
import { validateDetails } from "../features/projects/model";
import { validateGuidelines } from "../features/guidelines/model";
import {
  validateColors,
  validateTypography,
} from "../features/brand-system/model";
export const DATABASE_NAME = "brandkit-studio";
export const DATABASE_VERSION = 2;

// The first migration creates the store. Future migrations belong in this callback.
export function openProjectsDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) {
      reject(
        new Error(
          "IndexedDB is unavailable. Enable browser storage to use local projects.",
        ),
      );
      return;
    }
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    let blocked = false;
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains("assets"))
        request.result.createObjectStore("assets");
      if (!request.result.objectStoreNames.contains("projects"))
        request.result.createObjectStore("projects", { keyPath: "id" });
    };
    request.onblocked = () => {
      blocked = true;
      reject(
        new Error(
          "Close other BrandKit tabs so the local database can be upgraded, then retry.",
        ),
      );
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      if (blocked) {
        db.close();
        return;
      }
      db.onversionchange = () => db.close();
      resolve(db);
    };
  });
}
function assertReadable(value: unknown): asserts value is BrandProject {
  const record = value as Partial<BrandProject> | null;
  if (
    !record ||
    record.schemaVersion !== 1 ||
    typeof record.id !== "string" ||
    typeof record.name !== "string" ||
    typeof record.description !== "string" ||
    typeof record.updatedAt !== "string" ||
    !Number.isFinite(Date.parse(record.updatedAt)) ||
    typeof record.createdAt !== "string" ||
    !Array.isArray(record.assets) ||
    !Array.isArray(record.colors) ||
    !record.typography ||
    !record.guidelines ||
    !record.exportSettings
  ) {
    throw new Error(
      "A stored project has an unsupported or damaged format. No data was changed. Restore a compatible app version or backup before continuing.",
    );
  }
}
export async function listProjects(): Promise<BrandProject[]> {
  const db = await openProjectsDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("projects", "readonly");
    const request = tx.objectStore("projects").getAll();
    tx.oncomplete = () => {
      db.close();
      try {
        const values: unknown[] = request.result;
        values.forEach(assertReadable);
        resolve(
          (values as BrandProject[]).sort((a, b) =>
            b.updatedAt.localeCompare(a.updatedAt),
          ),
        );
      } catch (error) {
        reject(error);
      }
    };
    tx.onabort = () => {
      db.close();
      reject(
        tx.error ?? new Error("Could not load local projects. Please retry."),
      );
    };
  });
}
// Read + compare + write share a transaction: another tab cannot overwrite silently.
export async function saveProject(
  project: BrandProject,
  expectedUpdatedAt?: string,
): Promise<void> {
  validateDetails(project.name, project.description);
  validateGuidelines(project.guidelines);
  validateColors(project.colors);
  validateTypography(project.typography);
  assertReadable(project);
  if (project.id === "demo-forma")
    throw new Error("The sample project is read-only.");
  await mutateProject(project.id, expectedUpdatedAt, project);
}
export async function deleteProject(project: BrandProject): Promise<void> {
  await mutateProject(project.id, project.updatedAt);
}
export async function restoreProject(
  project: BrandProject,
  blobs: Record<string, Blob>,
) {
  validateDetails(project.name, project.description);
  validateGuidelines(project.guidelines);
  validateColors(project.colors);
  validateTypography(project.typography);
  assertReadable(project);
  if (project.assets.some((asset) => !blobs[asset.blobId]))
    throw new Error("The backup is missing an image.");
  await mutateProject(project.id, undefined, project, blobs);
}
async function mutateProject(
  id: string,
  expectedUpdatedAt?: string,
  value?: BrandProject,
  blobs: Record<string, Blob> = {},
): Promise<void> {
  const db = await openProjectsDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(["projects", "assets"], "readwrite");
    const store = tx.objectStore("projects");
    let failure: Error | null = null;
    const request = store.get(id);
    request.onsuccess = () => {
      const current = request.result as BrandProject | undefined;
      if (
        expectedUpdatedAt ? current?.updatedAt !== expectedUpdatedAt : !!current
      ) {
        failure = new Error(
          "This project changed or was removed in another tab. Copy any unsaved text, then reload to get the latest version.",
        );
        tx.abort();
        return;
      }
      const assetStore = tx.objectStore("assets");
      for (const asset of current?.assets ?? []) {
        if (!value?.assets.some((next) => next.blobId === asset.blobId))
          assetStore.delete(asset.blobId);
      }
      for (const [key, blob] of Object.entries(blobs))
        assetStore.put(blob, key);
      if (value) store.put(value);
      else store.delete(id);
    };
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onabort = () => {
      db.close();
      reject(
        failure ??
          tx.error ??
          new Error("Could not save changes. Please retry."),
      );
    };
  });
}
export async function saveAssets(
  project: BrandProject,
  expected: string,
  blobs: Record<string, Blob> = {},
) {
  if (project.id === "demo-forma")
    throw new Error("The sample project is read-only.");
  assertReadable(project);
  await mutateProject(project.id, expected, project, blobs);
}
export async function readAsset(id: string): Promise<Blob> {
  const db = await openProjectsDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("assets", "readonly");
    const request = tx.objectStore("assets").get(id);
    tx.oncomplete = () => {
      db.close();
      if (request.result instanceof Blob) resolve(request.result);
      else
        reject(
          new Error(
            "Asset file is missing. Replace this file to restore its preview.",
          ),
        );
    };
    tx.onabort = () => {
      db.close();
      reject(tx.error ?? new Error("Could not load this asset."));
    };
  });
}
