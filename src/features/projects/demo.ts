import type { BrandProject } from "../../types/brand";
// Fictional, read-only fixture. It is never presented as a saved user project.
export const demoProject: BrandProject = {
  schemaVersion: 1,
  id: "demo-forma",
  name: "Forma",
  description:
    "Thoughtful essentials. Naturally made. A considered identity for a botanical skincare brand.",
  createdAt: "2026-10-29T00:00:00Z",
  updatedAt: "2026-10-29T00:00:00Z",
  assets: [],
  colors: [
    { id: "forest", name: "Forest", hex: "#234D3C", role: "primary" },
    { id: "sage", name: "Sage", hex: "#B8C7AB", role: "secondary" },
    { id: "linen", name: "Linen", hex: "#F2EFE6", role: "background" },
    { id: "ink", name: "Ink", hex: "#242C28", role: "text" },
  ],
  typography: {
    heading: { family: "Georgia", size: 48, weight: 400, lineHeight: 1.1 },
    body: { family: "Arial", size: 16, weight: 400, lineHeight: 1.6 },
  },
  guidelines: {
    introduction: "Everyday rituals, rooted in nature.",
    logoUsage: "",
    applicationNotes: "",
  },
  exportSettings: { pageSize: "A4", includeAssets: false },
};
