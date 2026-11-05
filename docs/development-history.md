# BrandKit Studio

Phase 7: release preparation for a designer-owned brand documentation tool. No branding generation or AI features. See [publication guide](docs/publicacao.md) for packaging, local production review, updates and storage limitations. Manual browser acceptance remains pending.

## Run

Use Node.js 22.12+ (Node 24 recommended) and pnpm:

```sh
pnpm install
pnpm dev
pnpm build
pnpm test
pnpm lint
```

Open the local URL printed by Vite. `pnpm format` formats source and documentation. Dependencies are pinned by `pnpm-lock.yaml`.

## Current milestone

React, strict TypeScript, Vite, Tailwind CSS v4, Lucide icons, ESLint, Prettier, and Vitest/React Testing Library. Create, list, edit, and delete local projects. IndexedDB writes are acknowledged only after the transaction commits. Deletion requires confirmation, and navigation warns before discarding unsaved edits.

The landing screen lists real projects; Forma remains an explicitly read-only sample. New projects have no sample colors or logos. Upload, categorize, replace, and remove PNG/JPG/WebP/static SVG assets. Color and typography editors now update saved projects and live application previews. A structured guideline document now assembles the identity and designer-authored notes. PDF, palette JSON, and design-token JSON exports are available. System typography values are starter metadata, not designer-approved rules.

## Try Phase 2

1. Open `http://127.0.0.1:5173/#/projects` and choose **New project**.
2. Enter a name and optional description, then **Create project**.
3. Reload the page. The project should still be there.
4. Choose **Edit project**, rename it, and **Save changes**.
5. Return to **All projects**, create another project, and switch between them.
6. Try **Delete project**, first cancelling and then confirming on a disposable test project.
7. Edit without saving and navigate away: cancelling the discard prompt retains the draft.

Keep using the same browser and origin (hostname and port). `localhost` and `127.0.0.1` have separate browser storage. Local storage is not a backup: clearing browser data, eviction, or private browsing may remove it. There is no cloud sync. Export a complete project backup from Export and restore it from All projects to transfer saved content and images. Concurrent-tab conflicts are rejected; copy your draft and reload to see the latest version. Lists do not live-sync between tabs.

## Source map

- `src/app/App.tsx`: project state, navigation coordination, and storage feedback.
- `src/app/Workspace.tsx`: responsive shell and retained demo screens.
- `src/app/routing.ts`: hash-based project URLs and section parsing.
- `src/features/projects/ProjectList.tsx`: real-project list and separate sample entry.
- `src/features/projects/ProjectForm.tsx`: validated create/edit form with retained drafts on errors.
- `src/features/projects/model.ts`: project creation and input rules.
- `src/lib/projects-db.ts`: versioned IndexedDB repository and atomic conflict checks.
- `src/components/BrandPreview.tsx`: reusable preview renderer receiving project data through props.
- `src/features/projects/demo.ts`: clearly identified sample project.
- `src/types/brand.ts`: MVP domain interfaces.
- `src/styles/index.css`: interface tokens, component styles, and responsive layout.
- `src/app/App.test.tsx`: navigation and application-selection checks.
- `docs/architecture.md`: decisions, screen map, model semantics, and incremental plan.

Project state lives in `App` and is passed through props. The form keeps a temporary draft separate from saved data. Awaiting a repository operation before updating the UI prevents a failed save from appearing successful. IndexedDB is isolated behind three operations (`listProjects`, `saveProject`, `deleteProject`), so UI components do not manage transactions.

Hash URLs keep direct links usable on simple static hosting without adding a router dependency. They support reload and browser Back/Forward. A project URL only works where that project is locally stored; it is not a sharing feature.

## Verification limits

The initial checks do not establish full WCAG 2.2 AA compliance. Screen-reader testing, contrast audits, browser coverage, and end-to-end persistence/export testing remain milestone work. Automated checks cover local CRUD, reopening the database, conflicts, unsupported schema versions, failed-save retry, drafts, and routing. Browser visual review of Phase 2 was limited by the browser-control connection; manual mobile, keyboard, and screen-reader verification remains. The sample preview is not evidence that uploads or export work.

## Try Phase 3

Open a real project, choose **Brand assets**, select a category, and upload a file. Reload to verify that the image is still available. Category changes save immediately. Replace and Remove require confirmation. The right panel displays the first primary logo, or the first asset if no primary exists.

Files are limited to 10 MB and decoded images to 40 megapixels. Raster signatures are checked and browser decoding must succeed. SVGs use a strict static allowlist: geometry, gradients and clipping are supported; scripts, event handlers, external references, styles, embedded images, text, animation and use elements are rejected. Export outlined text and presentation attributes, or use PNG/WebP for unsupported SVG artwork. Rejected uploads do not change the stored identity.

`src/features/assets/AssetsPanel.tsx` owns upload and management UI; `validation.ts` validates files; `AssetImage.tsx` loads blob previews and revokes temporary URLs. Database version 2 adds the assets store without modifying version 1 projects. Asset metadata and blobs commit atomically, including replacement and deletion. Project deletion removes its blobs too. Tests cover the real v1-to-v2 migration, blob cleanup, conflicts and SVG rejection. Browser upload/visual QA remains a manual check; automated database and validation tests do not establish full browser compatibility.

## Try Phase 4

Open a real project and select **Colors**. Add a color, rename it, enter 3- or 6-digit HEX, assign a role, and use Copy HEX/RGB. Save changes, reload, and confirm the palette remains. Removing a color requires confirmation and saving. Multiple colors may share a role; previews use the first matching color. Missing roles use neutral display defaults, never persisted brand colors.

In **Typography**, configure heading/body family, size (8–120 px), weight (400/700), and unitless line height (1–2.5). Valid edits update the four application previews immediately; the specimen displays actual sizes, while miniature previews scale typography to 55%. Save changes persists both settings. Invalid intermediate inputs retain the last valid preview. Failed saves retain the draft, and leaving with edits requests confirmation.

Fonts are a curated system-font list, not downloaded web fonts. Availability and metrics may vary between devices; bundled licensed fonts remain future work. Uploaded logos retain their original colors. Preview combinations are demonstrations, not approved brand rules or contrast/accessibility guarantees. Clipboard copy needs browser permission; denied access shows a manual-copy message.

The implementation is in `src/features/brand-system/BrandSystemEditor.tsx`, validation in `model.ts`, and rendering in `src/components/BrandPreview.tsx`. Tests cover HEX conversion, typography bounds, valid draft previews, failed saves, neutral defaults and save/reload of both editors. Run `pnpm test`, `pnpm lint`, and `pnpm build`. Full visual, clipboard-permission and cross-device font QA remain manual.

## Try Phase 5

Open a real project and choose **Guidelines**. Edit Introduction, Logo usage, and Application notes (up to 5,000 characters each). Scroll to Document preview: text updates immediately. Select **Save guidelines**, reload, and confirm the text persists. Discard changes restores saved notes after confirmation; navigation warns about unsaved edits.

The document includes a cover, introduction, primary logo, additional assets, logo usage notes, HEX/RGB palette, heading/body specimens, four illustrative applications, and application notes. Visual identity changes are made in Brand assets, Colors, and Typography and reflected when you return to Guidelines. Blank notes and missing assets show explicit placeholders; no clear-space or minimum-size rules are invented. The first primary asset is the primary logo; remaining assets appear with their category.

This milestone provides a structured browser document, not PDF pagination or an export file. The layout is fixed; narrative content and the underlying brand identity are editable. Fonts are still system fonts, application examples use preview defaults for missing roles, and typography defaults require designer review. Full visual and screen-reader QA remains manual.

Main files: `src/features/guidelines/GuidelinesEditor.tsx`, `GuidelinesDocument.tsx`, and `model.ts`. Persistence reuses the existing project transaction and stale-tab protection; no schema migration is needed. Automated tests cover editing, save failures, reloading notes, absent content, derived colors, updated typography, and text escaping.

## Try Phase 6

Save your edits, open **Export**, choose A4 or Letter, and select **Download guidelines PDF**. Check the browser downloads panel. **Download colors JSON** exports palette IDs, names, roles, HEX, and derived RGB. **Download tokens JSON** exports color records keyed by stable IDs and heading/body settings with px and unitless line-height units. Both formats declare schemaVersion 1; these are BrandKit schemas, not a claim of DTCG compliance. Duplicate color names/roles remain separate records.

PDF pages are drawn in Canvas at 216 dpi and embedded as PNGs using pdf-lib (loaded on demand). This preserves the device's rendered font appearance and rasterized SVGs but does not preserve vector artwork, selectable/searchable text, font embedding, or PDF accessibility tags. PDFs may be larger than vector documents. The document has a separate paginated layout; application compositions are illustrative, not exact copies of the browser preview. Paper size is a per-download choice, not a saved preference. Original assets are not attached to the PDF. Palette and token JSON files are not backups; use Download project backup for a restorable file including images.

Export aborts if an asset is missing or cannot decode, instead of omitting it silently. Incomplete content is marked in the PDF, and the UI lists missing primary-logo/palette/usage information. Progress reports rendered pages; after generation the interface reports a download request, not a guarantee that the browser wrote the file. The renderer caps documents at fewer than 200 pages to avoid unbounded memory usage.

Implementation: `src/features/export/ExportPanel.tsx`, `pdf.ts`, `images.ts`, `layout.ts`, and `data.ts`. Tests cover JSON values/units, filename handling, empty palettes, long-word wrapping, and failed-export behavior. A4 and Letter QA files were generated through the actual PDF renderer with native Canvas, reopened with pdf-lib, and visually reviewed using Poppler: 10 pages each, with accents, an SVG logo and long notes. A business-card overlap was found and corrected. Browser download/clipboard behavior still needs an end-to-end manual check because the browser automation connection was unavailable. Rendering on native Canvas is not proof of pixel-identical rendering across browsers/devices.

Next: Phase 7 polish and accessibility/browser testing. Selectable vector PDF output with licensed embedded fonts is a separate improvement, not part of the current export.


## Phase 7: polish and release checks

The mobile menu now moves focus inside, cycles Tab/Shift+Tab, closes with Escape, restores trigger focus, locks background scroll and makes the background inert. It closes when resizing back to desktop. Section navigation updates the page title and focuses the main workspace. Small interface labels and touch targets were enlarged, low-contrast secondary text darkened, narrow layouts adjusted, and an error boundary provides a reload recovery screen. Export uses a synchronous lock to prevent duplicate generation requests.

Automated regression tests cover keyboard focus, inert state, focus restoration, document title and rendering-failure recovery. These are DOM-level checks; they do not prove screen-reader compatibility or visual reflow. Browser automation was stopped because the Windows tool could not reliably determine the active URL, so browser E2E and visual QA remain **pending**. Do not describe the app as WCAG 2.2 AA compliant or production-approved yet. See `docs/release-checklist.md`.

