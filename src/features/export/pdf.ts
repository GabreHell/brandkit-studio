import { PDFDocument, PageSizes } from "pdf-lib";
import type { BrandProject, BrandAsset } from "../../types/brand";
import {
  rgbValue,
  validateColors,
  validateTypography,
} from "../brand-system/model";
import { validateGuidelines } from "../guidelines/model";
import { wrapText } from "./layout";
import { assetBounds } from "../assets/placement";
type Raster = {
  source: CanvasImageSource;
  width: number;
  height: number;
  release: () => void;
};
type Options = {
  pageSize: "A4" | "Letter";
  loadImage: (asset: BrandAsset) => Promise<Raster>;
  onProgress?: (pages: number) => void;
  canvasFactory?: () => HTMLCanvasElement;
};
export async function createGuidelinesPdf(
  project: BrandProject,
  options: Options,
): Promise<Uint8Array> {
  validateColors(project.colors);
  validateTypography(project.typography);
  validateGuidelines(project.guidelines);
  if (typeof document !== "undefined" && document.fonts)
    await document.fonts.ready;
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${project.name} - Brand guidelines`);
  pdf.setAuthor("BrandKit Studio");
  pdf.setSubject("Designer-authored brand identity reference");
  const [width, height] = PageSizes[options.pageSize];
  const margin = 42;
  const contentWidth = width - margin * 2;
  const bottom = height - 54;
  const canvas = options.canvasFactory?.() ?? document.createElement("canvas");
  canvas.width = Math.ceil(width * 3);
  canvas.height = Math.ceil(height * 3);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas rendering is unavailable in this browser.");
  let y = margin;
  let pageNumber = 0;
  function reset() {
    ctx!.setTransform(3, 0, 0, 3, 0, 0);
    ctx!.fillStyle = "#FFFFFF";
    ctx!.fillRect(0, 0, width, height);
    ctx!.textBaseline = "top";
    y = margin;
  }
  reset();
  async function flush() {
    pageNumber++;
    ctx!.fillStyle = "#606A64";
    ctx!.font = "9px Arial";
    ctx!.fillText("BrandKit Studio / Brand guidelines", margin, height - 30);
    ctx!.fillText(String(pageNumber), width - margin - 15, height - 30);
    const image = await pdf.embedPng(canvas.toDataURL("image/png"));
    pdf
      .addPage([width, height])
      .drawImage(image, { x: 0, y: 0, width, height });
    options.onProgress?.(pageNumber);
    if (pageNumber >= 200)
      throw new Error(
        "This document exceeds 200 pages. Reduce the asset count or text before exporting.",
      );
    reset();
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  async function ensure(space: number) {
    if (y + space > bottom) await flush();
  }
  async function text(
    value: string,
    size = 11,
    family = "Arial",
    weight = 400,
    lineHeight = 1.5,
    color = "#252C28",
  ) {
    const font = `${weight} ${size}px "${family}"`;
    ctx!.font = font;
    const lines = wrapText(
      value,
      contentWidth,
      (line) => ctx!.measureText(line).width,
    );
    for (const line of lines) {
      await ensure(size * lineHeight);
      ctx!.font = font;
      ctx!.fillStyle = color;
      ctx!.fillText(line, margin, y);
      y += size * lineHeight;
    }
    y += 10;
  }
  async function section(title: string) {
    if (y > margin) await flush();
    await text(title, 23, "Arial", 700, 1.25);
    y += 10;
  }
  async function asset(asset: BrandAsset) {
    await ensure(230);
    const image = await options.loadImage(asset);
    try {
      const bounds = assetBounds(
        asset,
        image.width,
        image.height,
        contentWidth,
        190,
      );
      ctx!.drawImage(
        image.source,
        margin + bounds.x,
        y + bounds.y,
        bounds.width,
        bounds.height,
      );
      y += 200;
      await text(`${asset.name} / ${asset.category}`, 10);
    } finally {
      image.release();
    }
  }
  await text("Brand guidelines", 12, "Arial", 700);
  y += 35;
  await text(
    project.name,
    42,
    project.typography.heading.family,
    project.typography.heading.weight,
    1.2,
  );
  await text(project.description || "Brand identity reference", 14);
  y += 25;
  await text(
    "Working reference assembled from the saved project. Missing content is explicitly marked; review before client handoff.",
    10,
  );
  await text(
    "Rendered at 216 dpi using this device’s fonts. Text and vector artwork are rasterized; this PDF is not a selectable-text or tagged-accessible document.",
    9,
  );
  await section("Introduction");
  await text(
    project.guidelines.introduction ||
      "No introduction provided by the designer.",
  );
  await section("Logo system");
  const primary = project.assets.find((a) => a.category === "primary");
  if (primary) await asset(primary);
  else await text("No primary logo assigned.");
  for (const item of project.assets.filter((a) => a.id !== primary?.id))
    await asset(item);
  await section("Logo usage");
  await text(
    project.guidelines.logoUsage || "No usage rules provided by the designer.",
  );
  await section("Color palette");
  if (!project.colors.length) await text("No brand colors defined.");
  for (const color of project.colors) {
    await ensure(145);
    ctx.fillStyle = color.hex;
    ctx.fillRect(margin, y, contentWidth, 50);
    ctx.strokeStyle = "#D9DEDA";
    ctx.strokeRect(margin, y, contentWidth, 50);
    y += 62;
    await text(`${color.name} / ${color.role}`, 13, "Arial", 700);
    await text(`${color.hex}   ${rgbValue(color.hex)}`, 11);
  }
  await section("Typography");
  await text(
    "Current project settings. Initial system-font defaults require designer review; fonts may differ between devices.",
    10,
  );
  for (const key of ["heading", "body"] as const) {
    const style = project.typography[key];
    await ensure(110);
    await text(key === "heading" ? "Headings" : "Body text", 13, "Arial", 700);
    await text(
      key === "heading"
        ? project.name
        : project.description || "A clear and readable voice for your brand.",
      style.size * 0.75,
      style.family,
      style.weight,
      style.lineHeight,
    );
    await text(
      `${style.family} / ${style.size}px / Weight ${style.weight} / Line height ${style.lineHeight}`,
      10,
    );
  }
  await section("Brand applications");
  await text(
    "Illustrative compositions, not prescribed layouts. Missing roles use neutral preview defaults. Full project description appears on the cover.",
    10,
  );
  const role = (name: string, fallback: string) =>
    project.colors.find((c) => c.role === name)?.hex ?? fallback;
  const logo = primary ?? project.assets[0];
  const logoImage = logo ? await options.loadImage(logo) : null;
  try {
    for (const mode of ["Cover", "Business card", "Social post", "Website"]) {
      await ensure(280);
      await text(mode, 13, "Arial", 700);
      const cardY = y;
      const dark = mode === "Cover";
      const cardHeight = mode === "Business card" ? 160 : 210;
      ctx.fillStyle = dark
        ? role("primary", "#36413C")
        : role(mode === "Social post" ? "secondary" : "background", "#F5F6F5");
      ctx.fillRect(margin, cardY, contentWidth, cardHeight);
      if (logoImage && logo) {
        const bounds = assetBounds(
          logo,
          logoImage.width,
          logoImage.height,
          contentWidth - 40,
          45,
        );
        ctx.drawImage(
          logoImage.source,
          margin + 20 + bounds.x,
          cardY + 15 + bounds.y,
          bounds.width,
          bounds.height,
        );
      }
      ctx.fillStyle = dark
        ? role("background", "#FFFFFF")
        : role("text", "#242C28");
      let size = Math.min(28, project.typography.heading.size * 0.6);
      let lines: string[] = [];
      do {
        ctx.font = `${project.typography.heading.weight} ${size}px "${project.typography.heading.family}"`;
        lines = wrapText(
          project.name,
          contentWidth - 40,
          (line) => ctx.measureText(line).width,
        );
        if (lines.length <= 2 && lines.length * size * 1.25 <= cardHeight - 110)
          break;
        size -= 1;
      } while (size > 8);
      lines
        .slice(0, 2)
        .forEach((line, index) =>
          ctx.fillText(line, margin + 20, cardY + 75 + index * size * 1.25),
        );
      ctx.font = `${project.typography.body.weight} 10px "${project.typography.body.family}"`;
      ctx.fillText(
        "Brand application example",
        margin + 20,
        cardY + cardHeight - 25,
      );
      y = cardY + cardHeight + 22;
    }
  } finally {
    logoImage?.release();
  }
  await section("Application notes");
  await text(
    project.guidelines.applicationNotes ||
      "No application notes provided by the designer.",
  );
  await flush();
  const bytes = await pdf.save();
  canvas.width = 1;
  canvas.height = 1;
  return bytes;
}
