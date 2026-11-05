import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { BrandSystemEditor } from "./BrandSystemEditor";
import { createProject } from "../projects/model";
afterEach(cleanup);
it("previews valid color drafts and submits normalized values", async () => {
  const save = vi.fn().mockResolvedValue(undefined);
  const preview = vi.fn();
  render(
    <BrandSystemEditor
      project={createProject("Test", "")}
      section="Colors"
      onSave={save}
      onDraft={preview}
      onDirty={vi.fn()}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Add color" }));
  fireEvent.change(screen.getByLabelText("HEX"), { target: { value: "#abc" } });
  expect(screen.getByText("rgb(170, 187, 204)")).toBeInTheDocument();
  expect(preview.mock.lastCall?.[0].colors[0].hex).toBe("#AABBCC");
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  expect(
    await screen.findByText("Brand system saved to this browser."),
  ).toBeInTheDocument();
  expect(save.mock.calls[0][0].colors[0].hex).toBe("#AABBCC");
});
it("retains typography draft after save failure", async () => {
  render(
    <BrandSystemEditor
      project={createProject("Test", "")}
      section="Typography"
      onSave={vi.fn().mockRejectedValue(new Error("Storage failed"))}
      onDraft={vi.fn()}
      onDirty={vi.fn()}
    />,
  );
  fireEvent.change(screen.getAllByLabelText("Font family")[0], {
    target: { value: "Georgia" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Storage failed");
  expect(screen.getAllByLabelText("Font family")[0]).toHaveValue("Georgia");
});
