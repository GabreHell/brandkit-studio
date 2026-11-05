import { expect, it } from "vitest";
import {
  exportColors,
  exportTokens,
  downloadName,
  exportWarnings,
} from "./data";
import { wrapText } from "./layout";
import { createProject } from "../projects/model";
it("exports matching colors, RGB, units and stable IDs without modifying the project", () => {
  const project = createProject("A/B: Marca", "");
  project.colors = [
    { id: "a", name: "Same", role: "primary", hex: "#abc" },
    { id: "b", name: "Same", role: "primary", hex: "#123456" },
  ];
  const before = JSON.stringify(project);
  const colors = exportColors(project);
  const tokens = exportTokens(project);
  expect(colors.colors[0]).toMatchObject({
    hex: "#AABBCC",
    rgb: "rgb(170, 187, 204)",
  });
  expect(Object.keys(tokens.colors)).toEqual(["a", "b"]);
  expect(tokens.typography.heading).toMatchObject({
    size: 48,
    sizeUnit: "px",
    lineHeightUnit: "unitless",
  });
  expect(JSON.parse(JSON.stringify(tokens))).toEqual(tokens);
  expect(JSON.stringify(project)).toBe(before);
  expect(downloadName(project.name, "tokens.json")).toBe(
    "A-B-Marca-tokens.json",
  );
});
it("exports empty palettes without inventing colors and flags incomplete projects", () => {
  const project = createProject("Empty", "");
  expect(exportColors(project).colors).toEqual([]);
  expect(exportTokens(project).colors).toEqual({});
  expect(exportWarnings(project)).toHaveLength(3);
});
it("wraps long words, accents and explicit newlines without losing characters", () => {
  const lines = wrapText(
    "ABCDEFGHIJKLMN\n\nAção clara",
    5,
    (value) => Array.from(value).length,
  );
  expect(lines).toEqual(["ABCDE", "FGHIJ", "KLMN", "", "Ação", "clara"]);
  expect(lines.every((line) => Array.from(line).length <= 5)).toBe(true);
});
