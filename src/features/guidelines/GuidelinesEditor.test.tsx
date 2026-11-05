import { afterEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { GuidelinesEditor } from "./GuidelinesEditor";
import { GuidelinesDocument } from "./GuidelinesDocument";
import { validateGuidelines } from "./model";
import { createProject } from "../projects/model";
afterEach(cleanup);
it("shows honest empty states and no invented logo restrictions", () => {
  render(<GuidelinesDocument project={createProject("Lume", "")} />);
  expect(
    screen.getByText("No usage rules provided by the designer."),
  ).toBeInTheDocument();
  expect(screen.getByText(/No primary logo selected/)).toBeInTheDocument();
  expect(screen.getByText(/No brand colors defined/)).toBeInTheDocument();
  expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(8);
});
it("updates the document immediately and retains text when saving fails", async () => {
  const save = vi
    .fn()
    .mockRejectedValueOnce(new Error("Storage failed"))
    .mockResolvedValueOnce(undefined);
  render(
    <GuidelinesEditor
      project={createProject("Lume", "")}
      onSave={save}
      onDirty={vi.fn()}
    />,
  );
  fireEvent.change(screen.getByLabelText("Logo usage"), {
    target: {
      value: "Use only the approved primary artwork.\nDo not stretch.",
    },
  });
  expect(
    within(screen.getByRole("article")).getByText(/Use only the approved/),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Save guidelines" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Storage failed");
  expect(screen.getByLabelText("Logo usage")).toHaveValue(
    "Use only the approved primary artwork.\nDo not stretch.",
  );
  fireEvent.click(screen.getByRole("button", { name: "Save guidelines" }));
  expect(
    await screen.findByText("Guidelines saved to this browser."),
  ).toBeInTheDocument();
});
it("reflects updated project colors and typography and treats notes as plain text", () => {
  const project = createProject("Lume", "");
  const view = render(<GuidelinesDocument project={project} />);
  view.rerender(
    <GuidelinesDocument
      project={{
        ...project,
        colors: [{ id: "a", name: "Forest", hex: "#123456", role: "primary" }],
        guidelines: {
          ...project.guidelines,
          introduction: "<script>not executable</script>",
        },
        typography: {
          ...project.typography,
          heading: { ...project.typography.heading, family: "Georgia" },
        },
      }}
    />,
  );
  expect(screen.getByText("Forest")).toBeInTheDocument();
  expect(screen.getByText(/rgb\(18, 52, 86\)/)).toBeInTheDocument();
  expect(screen.getByText(/Georgia ·/)).toBeInTheDocument();
  expect(view.container.querySelector("script")).toBeNull();
  expect(
    screen.getByText("<script>not executable</script>"),
  ).toBeInTheDocument();
});
it("validates optional notes and rejects oversized values", () => {
  const notes = createProject("Test", "").guidelines;
  expect(validateGuidelines(notes)).toEqual(notes);
  expect(() =>
    validateGuidelines({ ...notes, logoUsage: "x".repeat(5001) }),
  ).toThrow("5,000");
});
