import { beforeEach, expect, it } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import {
  DATABASE_NAME,
  openProjectsDatabase,
  saveProject,
  listProjects,
  saveAssets,
  deleteProject,
} from "./projects-db";
import { createProject } from "../features/projects/model";
beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});
async function blobKeys() {
  const db = await openProjectsDatabase();
  return new Promise<IDBValidKey[]>((resolve, reject) => {
    const tx = db.transaction("assets");
    const request = tx.objectStore("assets").getAllKeys();
    tx.oncomplete = () => {
      db.close();
      resolve(request.result);
    };
    tx.onabort = () => {
      db.close();
      reject(tx.error);
    };
  });
}
it("migrates a real version 1 database without losing its project", async () => {
  const project = createProject("Existing", "");
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () =>
      request.result
        .createObjectStore("projects", { keyPath: "id" })
        .put(project);
    request.onsuccess = () => {
      request.result.close();
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
  expect(await listProjects()).toEqual([project]);
  expect(await blobKeys()).toEqual([]);
});
it("atomically adds, replaces, rejects stale edits and cleans up project blobs", async () => {
  const project = createProject("Assets", "");
  await saveProject(project);
  const asset = {
    id: "logo",
    name: "logo.png",
    category: "primary" as const,
    mimeType: "image/png" as const,
    blobId: "blob-one",
    size: 1,
    alt: "Logo",
    placement: { scale: 50, x: 100, y: 0 },
  };
  const uploaded = {
    ...project,
    assets: [asset],
    updatedAt: "2030-01-01T00:00:00.000Z",
  };
  await saveAssets(uploaded, project.updatedAt, {
    "blob-one": new Blob(["a"]),
  });
  expect(await blobKeys()).toEqual(["blob-one"]);
  expect((await listProjects())[0].assets).toEqual([asset]);
  const replaced = {
    ...uploaded,
    assets: [{ ...asset, blobId: "blob-two" }],
    updatedAt: "2030-01-02T00:00:00.000Z",
  };
  await saveAssets(replaced, uploaded.updatedAt, {
    "blob-two": new Blob(["b"]),
  });
  expect(await blobKeys()).toEqual(["blob-two"]);
  await expect(
    saveAssets(uploaded, uploaded.updatedAt, { orphan: new Blob(["c"]) }),
  ).rejects.toThrow("another tab");
  expect(await blobKeys()).toEqual(["blob-two"]);
  await deleteProject(replaced);
  expect(await blobKeys()).toEqual([]);
});
