# Release checks — Phase 7

Status: code polish implemented; browser and assistive-technology validation incomplete. No deployment performed.

Release preparation: see `docs/publicacao.md` for the Portuguese handoff guide. The candidate ZIP in `output/release` contains only the production build, with SHA-256 hashes stored separately. Browser access was retried and returned `browser.user is unavailable`; manual acceptance remains pending. Asset placement controls and transparent-background PDF rendering were added after the initial phase: 47 automated tests pass, and a transparent PNG with saved placement was checked through the PDF renderer and Poppler. This is not a substitute for browser download testing.

## Automated evidence

### Final review — 2026-10-30

- `pnpm test`: 56 tests passed across 17 files, including project backup restoration.
- `pnpm lint`: passed.
- `pnpm build`: passed (TypeScript and Vite production build).
- All five files in `output/release/brandkit-studio-0.7.0-candidate.zip` match the rebuilt `dist` files by SHA-256; no repackaging was needed.
- The shell needed the bundled Node directory added to its process-local PATH. Tests and build required execution outside the sandbox after esbuild reported `Access is denied` loading the Vite configuration.
- Browser access was attempted again; Computer Use returned `Computer Use app approval timed out` before page inspection. No browser acceptance checks were completed in this review. Keyboard, responsive layout, downloads, cross-browser and NVDA acceptance remain pending.
- No deployment performed; this is still a release candidate.

Run `pnpm test`, `pnpm lint`, and `pnpm build`. Tests cover project CRUD, database migration, conflicts, SVG rejection, brand-system and guideline persistence, JSON exports, PDF failure feedback, mobile focus management, and error-boundary recovery. Unit tests run in jsdom with fake IndexedDB and are not browser end-to-end tests.

PDF A4/Letter rendering was verified with native Canvas and Poppler in Phase 6. The PDF is rasterized and is not tagged or text-selectable; it does not meet accessible-PDF requirements.

## Pending manual acceptance

Backup acceptance: Export → Download project backup, then All projects → Choose project backup on the destination origin. Compare notes, colors, typography, image transparency and placement after reload. Import twice: both copies must coexist. Invalid or unsupported backups must leave existing projects unchanged. Automated coverage includes round trips with image bytes, repeated restores, invalid versions, unsafe SVG, missing images, invalid settings, size limits and the application import flow. Native image decoding and real browser download/file selection still require manual verification.

Use a disposable project named “QA — disposable” and an image you own. Keep the same origin and browser to preserve IndexedDB data.

1. Create a project, upload a valid logo, assign categories, then reload and check both metadata and preview. Try invalid images, an unsupported SVG and a file over 10 MB; the old assets must survive failures.
2. Edit palette and typography, save, navigate away and return. Check that the guideline document and all previews match. Cancel a discard prompt and verify the draft remains.
3. Add multiline guideline notes, save and reload. Download both JSON formats and verify values. Export A4 and Letter PDFs with a long name and notes; inspect every page and browser download completion.
4. At viewport widths 320, 375, 768, 1024 and 1440 px, inspect all screens for horizontal overflow, clipped labels, overlapping previews and reachable controls. Repeat at 200% zoom.
5. Navigate using only Tab, Shift+Tab, Enter, Space and Escape. Check skip link, mobile-menu focus loop, backdrop dismissal, resize behavior, section focus and native confirmation dialogs. Check that denied navigation does not lose input.
6. Use NVDA with a supported browser: check headings, landmarks, labels, validation errors and status announcements. Check colors/contrast with a browser audit tool, including input borders and focus indicators. User-defined brand colors require a separate contrast assessment.
7. Test two tabs editing the same project: stale save/deletion must fail without deleting current assets. Inspect quota/storage-disabled behavior where browser tooling permits. Verify missing-asset recovery and long lists.
8. Repeat the main workflow on Chromium and Firefox; test Safari/iOS before claiming support. System-font availability and browser download behavior may vary.

Browser automation is currently blocked: the Windows Computer Use tool could not confidently identify the active browser URL. No unsupported browser-automation workaround was used. These checks remain pending, not passed.

## Build and deployment preparation

`pnpm build` produces the static `dist/` directory. Run `pnpm preview` for local production-build review. Deploy only `dist/` to an HTTPS static host after acceptance; do not publish source, temporary QA files, or local project data. Hash routing needs no route-rewrite configuration. The PDF module is lazy-loaded on export.

Keep the production origin stable. Moving from localhost to hosting does not migrate projects: IndexedDB is browser/origin-specific, and palette/token JSON exports are not backups. Use the complete project backup to transfer saved content and images manually, restoring it as a new project. There is no service worker or offline-install guarantee. Do not delete browser data during upgrades. No hosting provider, authentication, analytics or cloud storage has been configured.

Full selectable/vector PDF, bundled licensed fonts and cross-tab live synchronization remain known limitations outside this polish pass.

