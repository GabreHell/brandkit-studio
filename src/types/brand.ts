export type AssetCategory =
  | "primary"
  | "secondary"
  | "horizontal"
  | "vertical"
  | "monochrome"
  | "symbol"
  | "supporting";
export interface BrandAsset {
  id: string;
  name: string;
  category: AssetCategory;
  mimeType: "image/png" | "image/jpeg" | "image/svg+xml" | "image/webp";
  blobId: string; // IndexedDB blob record; never persist temporary object URLs.
  size: number;
  alt: string;
  placement?: { scale: number; x: number; y: number };
}
export interface BrandColor {
  id: string;
  name: string;
  hex: string;
  role: "primary" | "secondary" | "accent" | "background" | "text";
}
export interface TypographyStyle {
  family: string;
  size: number;
  weight: number;
  lineHeight: number;
}
export interface BrandTypography {
  heading: TypographyStyle;
  body: TypographyStyle;
}
export interface BrandGuidelines {
  introduction: string;
  logoUsage: string;
  applicationNotes: string;
}
export interface BrandExportSettings {
  pageSize: "A4" | "Letter";
  includeAssets: boolean;
}
export interface BrandProject {
  schemaVersion: 1;
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  assets: BrandAsset[];
  colors: BrandColor[];
  typography: BrandTypography;
  guidelines: BrandGuidelines;
  exportSettings: BrandExportSettings;
}
