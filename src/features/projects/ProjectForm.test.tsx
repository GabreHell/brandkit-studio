import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ProjectForm } from "./ProjectForm";
afterEach(cleanup);
it("keeps the draft after failed storage and permits retry", async () => {
  const save = vi
    .fn()
    .mockRejectedValueOnce(new DOMException("Quota", "QuotaExceededError"))
    .mockResolvedValueOnce(undefined);
  render(
    <ProjectForm onSave={save} onCancel={vi.fn()} onDirtyChange={vi.fn()} />,
  );
  fireEvent.change(screen.getByLabelText(/Brand name/), {
    target: { value: "Lume" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create project" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("storage is full");
  expect(screen.getByLabelText(/Brand name/)).toHaveValue("Lume");
  fireEvent.click(screen.getByRole("button", { name: "Create project" }));
  expect(save).toHaveBeenCalledTimes(2);
});
