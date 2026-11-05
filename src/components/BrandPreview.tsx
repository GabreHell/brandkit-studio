import type { CSSProperties } from "react";
import type { BrandProject } from "../types/brand";
import { AssetImage } from "../features/assets/AssetImage";
export type PreviewMode = "Cover" | "Business card" | "Social post" | "Website";
export function BrandPreview({
  project,
  mode,
}: {
  project: BrandProject;
  mode: PreviewMode;
}) {
  const isDemo = project.id === "demo-forma";
  const color = (role: string, fallback: string) =>
    project.colors.find((item) => item.role === role)?.hex ?? fallback;
  const logo =
    project.assets.find((asset) => asset.category === "primary") ??
    project.assets[0];
  const heading = project.typography.heading;
  const body = project.typography.body;
  const light = mode !== "Cover";
  const style = {
    "--brand-primary": color("primary", "#36413C"),
    "--brand-background": color("background", "#F5F6F5"),
    "--brand-accent": color("accent", color("secondary", "#DDE3DE")),
    fontFamily: project.typography.heading.family,
    ...(!isDemo
      ? {
          background: light
            ? color(
                mode === "Social post" ? "secondary" : "background",
                "#F5F6F5",
              )
            : color("primary", "#36413C"),
          color: light
            ? color("text", "#242C28")
            : color("background", "#FFFFFF"),
        }
      : {}),
  } as CSSProperties;
  return (
    <div
      className={`brand-preview preview-${mode.toLowerCase().replace(" ", "-")}`}
      style={style}
    >
      {mode === "Website" && (
        <div className="mini-nav">
          <span>{project.name}</span>
          <span>Our story &nbsp; Shop</span>
        </div>
      )}
      {!isDemo && logo && <AssetImage key={logo.blobId} asset={logo} />}
      <div
        className="preview-wordmark"
        style={
          !isDemo
            ? {
                fontSize: heading.size * 0.55,
                fontWeight: heading.weight,
                lineHeight: heading.lineHeight,
                letterSpacing: 0,
                overflowWrap: "anywhere",
              }
            : undefined
        }
      >
        {isDemo ? project.name.toLowerCase() : project.name}
        {isDemo && <span>®</span>}
      </div>
      <p
        style={
          !isDemo
            ? {
                fontFamily: body.family,
                fontSize: body.size * 0.55,
                fontWeight: body.weight,
                lineHeight: body.lineHeight,
                maxWidth: "100%",
                overflowWrap: "anywhere",
              }
            : undefined
        }
      >
        {!isDemo
          ? project.description || "Brand application preview"
          : mode === "Business card"
            ? "Made with intention."
            : project.guidelines.introduction}
      </p>
      <div className="brand-orbit" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="preview-footer">
        <span>
          {isDemo
            ? mode === "Cover"
              ? "Brand identity / 2026"
              : "Botanical essentials"
            : "Application example"}
        </span>
        {isDemo && <span>forma</span>}
      </div>
    </div>
  );
}
