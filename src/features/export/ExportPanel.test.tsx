import { afterEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { ExportPanel } from "./ExportPanel";
import { createProject } from "../projects/model";
import { downloadBlob } from "./data";
vi.mock("./data", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./data")>()),
  downloadBlob: vi.fn(),
}));
vi.mock("./pdf", () => ({
  createGuidelinesPdf: vi.fn().mockRejectedValue(new Error("Missing asset")),
}));
vi.mock("./images", () => ({ loadExportImage: vi.fn() }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
it("downloads JSON with a safe filename and reports download requested", async () => {
  render(<ExportPanel project={createProject("Lume", "")} onBusy={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Download tokens JSON" }));
  expect(await screen.findByRole("status")).toHaveTextContent(
    "Download requested",
  );
  expect(downloadBlob).toHaveBeenCalledWith(
    expect.any(Blob),
    "Lume-tokens.json",
  );
});
it("does not request a download after failed PDF generation and releases the busy state", async () => {
  const busy = vi.fn();
  render(<ExportPanel project={createProject("Lume", "")} onBusy={busy} />);
  fireEvent.change(screen.getByLabelText("Paper size for this download"), {
    target: { value: "Letter" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Download guidelines PDF" }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent("Missing asset");
  expect(downloadBlob).not.toHaveBeenCalled();
  await waitFor(() => expect(busy).toHaveBeenLastCalledWith(false));
  expect(
    screen.getByRole("button", { name: "Download guidelines PDF" }),
  ).toBeEnabled();
});
