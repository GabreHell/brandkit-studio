import { describe, expect, it } from "vitest";
import { safeSvg, prepareAsset, MAX_FILE_SIZE } from "./validation";
const wrap = (body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${body}</svg>`;
describe("static SVG boundary", () => {
  it("preserves geometry and local gradients", () => {
    const value = wrap(
      '<defs><linearGradient id="paint"><stop offset="0" stop-color="#123456"/></linearGradient></defs><path d="M0 0L10 10" fill="url(#paint)"/>',
    );
    expect(safeSvg(value)).toContain('fill="url(#paint)"');
  });
  it.each([
    "<script>alert(1)</script>",
    "<foreignObject/>",
    '<image href="https://example.com/x"/>',
    '<rect onload="alert(1)"/>',
    '<rect fill="url(https://example.com/x)"/>',
    "<style>path{fill:red}</style>",
    '<use href="#x"/>',
    '<animate attributeName="fill"/>',
    "<text>Unoutlined</text>",
  ])("rejects unsafe or unsupported content: %s", (body) => {
    expect(() => safeSvg(wrap(body))).toThrow();
  });
  it("rejects malformed XML and entity declarations", () => {
    expect(() => safeSvg("<svg>")).toThrow();
    expect(() =>
      safeSvg('<!DOCTYPE svg [<!ENTITY x SYSTEM "file:///x">]>' + wrap("")),
    ).toThrow();
  });
  it("rejects empty and oversized files before decoding", async () => {
    await expect(prepareAsset(new File([], "x.png"))).rejects.toThrow("10 MB");
    await expect(
      prepareAsset(new File([new Uint8Array(MAX_FILE_SIZE + 1)], "x.png")),
    ).rejects.toThrow("10 MB");
  });
});
