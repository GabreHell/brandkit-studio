import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { BrandPreview } from "./BrandPreview";
import { createProject } from "../features/projects/model";
afterEach(cleanup);
it("renders empty palettes and responds to roles and typography without demo claims", () => {
  const project = createProject("Lume", "Designer description");
  const view = render(<BrandPreview project={project} mode="Cover" />);
  expect(screen.getByText("Lume")).toBeInTheDocument();
  expect(screen.queryByText("®")).not.toBeInTheDocument();
  view.rerender(
    <BrandPreview
      project={{
        ...project,
        colors: [{ id: "a", name: "Blue", role: "primary", hex: "#123456" }],
        typography: {
          ...project.typography,
          heading: {
            family: "Georgia",
            size: 60,
            weight: 700,
            lineHeight: 1.4,
          },
        },
      }}
      mode="Cover"
    />,
  );
  expect(screen.getByText("Lume")).toHaveStyle({
    fontSize: "33px",
    fontWeight: "700",
    lineHeight: "1.4",
  });
  expect(view.container.firstChild).toHaveStyle({
    background: "#123456",
    fontFamily: "Georgia",
  });
});
