import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  act,
} from "@testing-library/react";
import { IDBFactory } from "fake-indexeddb";
import App from "./App";
import { listProjects, saveProject } from "../lib/projects-db";
import { createProject } from "../features/projects/model";
beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
  window.history.replaceState(null, "", "#/projects");
});
it("restores a backup from the project list and opens the saved copy", async () => {
  const original = createProject("Restored brand", "From another browser");
  const source = JSON.stringify({
    format: "brandkit-project-backup",
    version: 1,
    project: original,
    images: [],
  });
  const file = new File([source], "backup.json", { type: "application/json" });
  Object.defineProperty(file, "text", { value: async () => source });
  const view = render(<App />);
  fireEvent.change(await screen.findByLabelText("Choose project backup"), {
    target: { files: [file] },
  });
  expect(
    await screen.findByText(
      "Backup restored as a new project in this browser.",
    ),
  ).toBeInTheDocument();
  const stored = await listProjects();
  expect(stored).toHaveLength(1);
  expect(stored[0].id).not.toBe(original.id);
  view.unmount();
  render(<App />);
  expect(
    await screen.findByRole("heading", { name: "Restored brand" }),
  ).toBeInTheDocument();
});
it("saves and reopens designer-authored guideline notes", async () => {
  const project = createProject("Guideline test", "");
  await saveProject(project);
  window.history.replaceState(null, "", `#/project/${project.id}/Guidelines`);
  const view = render(<App />);
  fireEvent.change(await screen.findByLabelText("Introduction"), {
    target: { value: "A considered identity." },
  });
  fireEvent.change(screen.getByLabelText("Logo usage"), {
    target: { value: "Designer-defined rule." },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save guidelines" }));
  await screen.findByText("Guidelines saved to this browser.");
  view.unmount();
  render(<App />);
  expect(await screen.findByLabelText("Introduction")).toHaveValue(
    "A considered identity.",
  );
  expect(screen.getByLabelText("Logo usage")).toHaveValue(
    "Designer-defined rule.",
  );
  expect(
    screen.getByRole("button", { name: "Save guidelines" }),
  ).toBeDisabled();
});
it("saves colors and typography and restores both after remount", async () => {
  const project = createProject("Brand system test", "");
  await saveProject(project);
  window.history.replaceState(null, "", `#/project/${project.id}/Colors`);
  const view = render(<App />);
  fireEvent.click(await screen.findByRole("button", { name: "Add color" }));
  fireEvent.change(screen.getByLabelText("HEX"), {
    target: { value: "#123abc" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await screen.findByText("Brand system saved to this browser.");
  fireEvent.click(screen.getByRole("button", { name: "Typography" }));
  fireEvent.change(screen.getAllByLabelText("Font family")[0], {
    target: { value: "Georgia" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await screen.findByText("Brand system saved to this browser.");
  view.unmount();
  render(<App />);
  expect((await screen.findAllByLabelText("Font family"))[0]).toHaveValue(
    "Georgia",
  );
  fireEvent.click(screen.getByRole("button", { name: "Colors" }));
  expect(screen.getByLabelText("HEX")).toHaveValue("#123ABC");
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
describe("project workflow", () => {
  it("creates, reloads, edits, cancels deletion, then confirms deletion", async () => {
    const view = render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: "New project" }));
    fireEvent.change(screen.getByLabelText(/Brand name/), {
      target: { value: "Lume Studio" },
    });
    fireEvent.change(screen.getByLabelText(/Description/), {
      target: { value: "Original identity" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create project" }));
    expect(
      await screen.findByText("Project created and saved to this browser."),
    ).toBeInTheDocument();
    expect(window.location.hash).toContain("/Overview");
    view.unmount();
    render(<App />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Edit project" }),
    );
    expect(screen.getByLabelText(/Brand name/)).toHaveValue("Lume Studio");
    fireEvent.change(screen.getByLabelText(/Brand name/), {
      target: { value: "Lume Revised" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(
      await screen.findByText("Changes saved to this browser."),
    ).toBeInTheDocument();
    expect((await listProjects())[0].name).toBe("Lume Revised");
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    fireEvent.click(screen.getByRole("button", { name: "Delete project" }));
    expect(await listProjects()).toHaveLength(1);
    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: "Delete project" }));
    expect(await screen.findByText("Project deleted.")).toBeInTheDocument();
    expect(await listProjects()).toHaveLength(0);
  });
  it("protects unsaved edits when navigating and handles history changes", async () => {
    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: "New project" }));
    fireEvent.change(screen.getByLabelText(/Brand name/), {
      target: { value: "Draft" },
    });
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    fireEvent.click(screen.getByRole("button", { name: "All projects" }));
    expect(screen.getByLabelText(/Brand name/)).toHaveValue("Draft");
    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: "All projects" }));
    await act(async () => {
      window.history.back();
    });
    await waitFor(() =>
      expect(screen.getByLabelText(/Brand name/)).toHaveValue(""),
    );
  });
  it("keeps demo navigation and application selection working", async () => {
    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: "View Forma" }));
    fireEvent.click(screen.getByRole("button", { name: "Colors" }));
    expect(
      screen.getByRole("heading", { name: "Colors", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText("#234D3C")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Application"), {
      target: { value: "Business card" },
    });
    expect(screen.getByText("Made with intention.")).toBeInTheDocument();
    expect(await listProjects()).toHaveLength(0);
  });
  it("shows a recoverable missing-project screen", async () => {
    window.history.replaceState(null, "", "#/project/missing/Overview");
    render(<App />);
    expect(await screen.findByText("Project not found")).toBeInTheDocument();
  });
});
