import type { BrandColor, BrandTypography } from "../../types/brand";
export const colorRoles: BrandColor["role"][] = [
  "primary",
  "secondary",
  "accent",
  "background",
  "text",
];
export const fontFamilies = [
  "Arial",
  "Georgia",
  "Verdana",
  "Trebuchet MS",
  "Times New Roman",
  "Courier New",
];
export function normalizeHex(value: string): string {
  const hex = value.trim().replace(/^#/, "");
  if (!/^(?:[\da-f]{3}|[\da-f]{6})$/i.test(hex))
    throw new Error("Enter a valid 3- or 6-digit HEX color.");
  return (
    "#" +
    (hex.length === 3 ? [...hex].map((c) => c + c).join("") : hex).toUpperCase()
  );
}
export function rgbValue(hex: string) {
  const value = normalizeHex(hex).slice(1);
  return `rgb(${[0, 2, 4].map((index) => parseInt(value.slice(index, index + 2), 16)).join(", ")})`;
}
export function validateColors(colors: BrandColor[]): BrandColor[] {
  return colors.map((color) => {
    if (!color.name.trim() || color.name.trim().length > 60)
      throw new Error("Each color needs a name between 1 and 60 characters.");
    if (!colorRoles.includes(color.role))
      throw new Error("Choose a valid color role.");
    return { ...color, name: color.name.trim(), hex: normalizeHex(color.hex) };
  });
}
export function validateTypography(value: BrandTypography): BrandTypography {
  for (const style of [value.heading, value.body]) {
    if (!fontFamilies.includes(style.family))
      throw new Error("Choose a font from the available families.");
    if (!Number.isFinite(style.size) || style.size < 8 || style.size > 120)
      throw new Error("Font sizes must be between 8 and 120 px.");
    if (![400, 700].includes(style.weight))
      throw new Error("Choose regular or bold weight.");
    if (
      !Number.isFinite(style.lineHeight) ||
      style.lineHeight < 1 ||
      style.lineHeight > 2.5
    )
      throw new Error("Line height must be between 1 and 2.5.");
  }
  return value;
}
