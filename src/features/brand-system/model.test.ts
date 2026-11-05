import { expect, it } from "vitest";
import {
  normalizeHex,
  rgbValue,
  validateColors,
  validateTypography,
} from "./model";
import { createProject } from "../projects/model";
it("normalizes HEX and derives RGB without storing duplicate values", () => {
  expect(normalizeHex(" abc ")).toBe("#AABBCC");
  expect(rgbValue("#ff0080")).toBe("rgb(255, 0, 128)");
  expect(() => normalizeHex("#12345")).toThrow();
  expect(() => normalizeHex("red")).toThrow();
  expect(() =>
    validateColors([{ id: "x", name: " ", role: "primary", hex: "#fff" }]),
  ).toThrow();
});
it("rejects invalid typography numbers and unavailable families", () => {
  const type = createProject("Test", "").typography;
  expect(validateTypography(type)).toEqual(type);
  for (const patch of [
    { size: NaN },
    { size: 121 },
    { lineHeight: 0.5 },
    { family: "Unknown" },
    { weight: 550 },
  ])
    expect(() =>
      validateTypography({ ...type, heading: { ...type.heading, ...patch } }),
    ).toThrow();
});
