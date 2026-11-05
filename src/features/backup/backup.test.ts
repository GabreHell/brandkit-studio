import { Blob as NodeBlob, File as NodeFile } from "node:buffer";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { createBackup, restoreBackup, MAX_BACKUP_SIZE } from "./backup";
import { createProject } from "../projects/model";
import { listProjects, readAsset, restoreProject } from "../../lib/projects-db";

beforeEach(() => {
  vi.stubGlobal("indexedDB", new IDBFactory());
  vi.stubGlobal("Blob", NodeBlob);
  vi.stubGlobal("File", NodeFile);
  vi.stubGlobal(
    "Image",
    class {
      naturalWidth = 100;
      naturalHeight = 100;
      onload?: () => void;
      set src(value: string) {
        if (value) queueMicrotask(() => this.onload?.());
      }
    },
  );
  URL.createObjectURL = vi.fn(() => "blob:test");
  URL.revokeObjectURL = vi.fn();
});
afterEach(() => vi.unstubAllGlobals());
const svg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="25"/></svg>';
async function fixture() {
  const project = createProject("My brand", "Existing identity");
  project.guidelines.logoUsage = "Keep the original proportions.";
  project.colors = [
    { id: "green", name: "Green", hex: "#123456", role: "primary" },
  ];
  project.assets = [
    {
      id: "logo",
      blobId: "image",
      name: "logo.svg",
      category: "primary",
      mimeType: "image/svg+xml",
      size: svg.length,
      alt: "Brand logo",
      placement: { scale: 50, x: 100, y: 0 },
    },
  ];
  await restoreProject(project, {
    image: new Blob([svg], { type: "image/svg+xml" }),
  });
  return project;
}
it("round trips all content and images as independent copies, leaving the original intact", async () => {
  const original = await fixture();
  const backup = await createBackup(original);
  const file = new File([backup], "backup.json");
  const restored = await restoreBackup(file);
  const another = await restoreBackup(file);
  expect(new Set([original.id, restored.id, another.id]).size).toBe(3);
  expect(restored.guidelines).toEqual(original.guidelines);
  expect(restored.typography).toEqual(original.typography);
  expect(restored.exportSettings).toEqual(original.exportSettings);
  expect(restored.colors[0]).toMatchObject({
    name: "Green",
    hex: "#123456",
    role: "primary",
  });
  expect(restored.assets[0]).toMatchObject({
    name: "logo.svg",
    placement: { scale: 50, x: 100, y: 0 },
  });
  expect(restored.assets[0].blobId).not.toBe(original.assets[0].blobId);
  expect(await (await readAsset(restored.assets[0].blobId)).text()).toBe(svg);
  expect(await listProjects()).toHaveLength(3);
  expect((await listProjects()).find((p) => p.id === original.id)).toEqual(
    original,
  );
});
it.each([
  "missing-image",
  "unsafe-svg",
  "bad-placement",
  "future-version",
  "bad-color",
])("rejects %s without partial writes", async (kind) => {
  const original = await fixture();
  const data = JSON.parse(await (await createBackup(original)).text());
  if (kind === "missing-image") data.images = [];
  if (kind === "unsafe-svg")
    data.images[0].data = btoa(
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
    );
  if (kind === "bad-placement") data.project.assets[0].placement.scale = 900;
  if (kind === "future-version") data.version = 2;
  if (kind === "bad-color") data.project.colors[0].hex = "broken";
  await expect(
    restoreBackup(new File([JSON.stringify(data)], "bad.json")),
  ).rejects.toThrow();
  expect(await listProjects()).toEqual([original]);
});
it("rejects palette exports, malformed JSON and oversized files", async () => {
  for (const content of ['{"colors":[]}', "{broken"])
    await expect(
      restoreBackup(new File([content], "bad.json")),
    ).rejects.toThrow();
  await expect(
    restoreBackup({ size: MAX_BACKUP_SIZE + 1 } as File),
  ).rejects.toThrow("75 MB");
  expect(await listProjects()).toEqual([]);
});
it("fails a backup rather than silently omitting missing images", async () => {
  const project = createProject("Missing", "");
  project.assets = [
    {
      id: "missing",
      blobId: "absent",
      name: "logo.png",
      category: "primary",
      mimeType: "image/png",
      size: 1,
      alt: "Logo",
    },
  ];
  await expect(createBackup(project)).rejects.toThrow("missing");
});
