import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { AssetPlacementEditor } from "./AssetPlacementEditor";
vi.mock("./AssetImage", () => ({ AssetImage: () => <div>Image preview</div> }));
it("previews adjustments and saves them only on explicit save", () => {
  const asset = {
    id: "logo",
    name: "logo.png",
    category: "primary" as const,
    mimeType: "image/png" as const,
    blobId: "blob",
    size: 1,
    alt: "Logo",
  };
  const onSave = vi.fn().mockResolvedValue(undefined);
  render(<AssetPlacementEditor asset={asset} busy={false} onSave={onSave} />);
  fireEvent.click(screen.getByText("Adjust size & position"));
  fireEvent.change(screen.getByLabelText(/Size:/), { target: { value: "50" } });
  fireEvent.change(screen.getByLabelText(/Horizontal position:/), {
    target: { value: "100" },
  });
  expect(onSave).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText("Save placement"));
  expect(onSave).toHaveBeenCalledWith({
    ...asset,
    placement: { scale: 50, x: 100, y: 50 },
  });
});
