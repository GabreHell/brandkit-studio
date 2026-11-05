// The backup tests use Node's standards-compatible Blob/File implementations
// because jsdom does not implement Blob.text() or Blob.arrayBuffer().
declare module "node:buffer" {
  export const Blob: typeof globalThis.Blob;
  export const File: typeof globalThis.File;
}
