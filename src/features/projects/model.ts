import type { BrandProject } from "../../types/brand";
export function validateDetails(name: string, description: string) {
  if (!name.trim()) throw new Error("Enter a brand name.");
  if (name.trim().length > 80)
    throw new Error("Use 80 characters or fewer for the brand name.");
  if (description.length > 2000)
    throw new Error("Use 2,000 characters or fewer for the description.");
}
export function createProject(name: string, description: string): BrandProject {
  validateDetails(name, description);
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    id: crypto.randomUUID(),
    name: name.trim(),
    description: description.trim(),
    createdAt: now,
    updatedAt: now,
    assets: [],
    colors: [],
    typography: {
      heading: { family: "Arial", size: 48, weight: 400, lineHeight: 1.1 },
      body: { family: "Arial", size: 16, weight: 400, lineHeight: 1.6 },
    },
    guidelines: { introduction: "", logoUsage: "", applicationNotes: "" },
    exportSettings: { pageSize: "A4", includeAssets: false },
  };
}
export function storageMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === "QuotaExceededError")
    return "Browser storage is full. Free some space and try again. Your changes have not been saved.";
  if (error instanceof Error) return error.message;
  return "Local storage is unavailable. Check browser permissions and try again.";
}
