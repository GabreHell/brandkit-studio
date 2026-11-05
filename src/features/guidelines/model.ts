import type { BrandGuidelines } from "../../types/brand";
export const NOTE_LIMIT = 5000;
export function validateGuidelines(notes: BrandGuidelines) {
  for (const key of [
    "introduction",
    "logoUsage",
    "applicationNotes",
  ] as const) {
    if (typeof notes[key] !== "string" || notes[key].length > NOTE_LIMIT)
      throw new Error(
        "Each guideline field must contain at most 5,000 characters.",
      );
  }
  return notes;
}
