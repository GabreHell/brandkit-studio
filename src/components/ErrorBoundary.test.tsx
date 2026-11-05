import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ErrorBoundary } from "./ErrorBoundary";
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it("shows recovery without claiming unsaved drafts are safe", () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  function Broken(): never {
    throw new Error("Rendering failed");
  }
  render(
    <ErrorBoundary>
      <Broken />
    </ErrorBoundary>,
  );
  expect(
    screen.getByRole("heading", {
      name: "This workspace could not be displayed",
    }),
  ).toBeInTheDocument();
  expect(screen.getByText(/Unsaved edits may be lost/)).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Reload workspace" }),
  ).toBeInTheDocument();
});
