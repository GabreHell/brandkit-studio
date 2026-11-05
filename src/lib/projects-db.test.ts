import { beforeEach, describe, expect, it } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import {
  listProjects,
  saveProject,
  deleteProject,
  openProjectsDatabase,
  DATABASE_VERSION,
} from "./projects-db";
import { createProject } from "../features/projects/model";
beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});
describe("local project transactions", () => {
  it("initializes version 1 once and preserves records across reopening", async () => {
    const db = await openProjectsDatabase();
    expect(db.version).toBe(DATABASE_VERSION);
    expect(db.objectStoreNames.contains("projects")).toBe(true);
    db.close();
    const project = createProject("  Studio Lume  ", "Existing identity");
    await saveProject(project);
    expect(await listProjects()).toEqual([project]);
    const reopened = await openProjectsDatabase();
    reopened.close();
    expect((await listProjects())[0].name).toBe("Studio Lume");
  });
  it("updates one project without touching another and deletes persistently", async () => {
    const a = createProject("A", "");
    const b = createProject("B", "");
    await saveProject(a);
    await saveProject(b);
    const edited = {
      ...a,
      name: "Revised",
      updatedAt: "2030-01-01T00:00:00.000Z",
    };
    await saveProject(edited, a.updatedAt);
    expect(await listProjects()).toEqual([edited, b]);
    await deleteProject(edited);
    expect(await listProjects()).toEqual([b]);
  });
  it("rejects stale edits and stale deletion without changing the latest record", async () => {
    const a = createProject("Original", "");
    await saveProject(a);
    const latest = {
      ...a,
      name: "Other tab",
      updatedAt: "2030-01-01T00:00:00.000Z",
    };
    await saveProject(latest, a.updatedAt);
    await expect(
      saveProject({ ...a, name: "Stale" }, a.updatedAt),
    ).rejects.toThrow("another tab");
    await expect(deleteProject(a)).rejects.toThrow("another tab");
    expect(await listProjects()).toEqual([latest]);
  });
  it("rejects blank names and never stores the sample identity", async () => {
    expect(() => createProject("   ", "")).toThrow("brand name");
    expect(() => createProject("x".repeat(81), "")).toThrow("80");
    expect(() => createProject("Valid", "x".repeat(2001))).toThrow("2,000");
    await expect(
      saveProject({ ...createProject("Sample", ""), id: "demo-forma" }),
    ).rejects.toThrow("read-only");
    expect(await listProjects()).toEqual([]);
  });
  it("reports unsupported record versions without overwriting them", async () => {
    const db = await openProjectsDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("projects", "readwrite");
      tx.objectStore("projects").put({
        ...createProject("Future", ""),
        schemaVersion: 99,
      });
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error);
    });
    db.close();
    await expect(listProjects()).rejects.toThrow("unsupported");
  });
});
