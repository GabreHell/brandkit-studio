import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { Workspace } from "./Workspace";
import { demoProject } from "../features/projects/demo";
afterEach(cleanup);
it("moves focus into mobile navigation, loops Tab, and restores focus on Escape", () => {
  render(
    <Workspace project={demoProject} screen="Overview" onNavigate={vi.fn()}>
      <p>Test workspace</p>
    </Workspace>,
  );
  const trigger = screen.getByRole("button", { name: "Open menu" });
  trigger.focus();
  fireEvent.click(trigger);
  const close = within(screen.getByRole('complementary', {name:'Project navigation'})).getByRole("button", { name: "Close menu" });
  expect(close).toHaveFocus();
  expect(document.querySelector(".app-body")).toHaveAttribute("inert");
  fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
  expect(screen.getByRole("button", { name: "Export" })).toHaveFocus();
  fireEvent.keyDown(document, { key: "Tab" });
  expect(close).toHaveFocus();
  fireEvent.keyDown(document, { key: "Escape" });
  expect(trigger).toHaveFocus();
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  expect(document.querySelector(".app-body")).not.toHaveAttribute("inert");
  expect(document.body.style.overflow).toBe("");
});
it("updates page title and focuses the workspace after section navigation", () => {
  const view = render(
    <Workspace project={demoProject} screen="Overview" onNavigate={vi.fn()}>
      <p>Content</p>
    </Workspace>,
  );
  view.rerender(
    <Workspace project={demoProject} screen="Colors" onNavigate={vi.fn()}>
      <p>Palette</p>
    </Workspace>,
  );
  expect(document.title).toBe("Colors · Forma | BrandKit Studio");
  expect(screen.getByRole("main")).toHaveFocus();
});
