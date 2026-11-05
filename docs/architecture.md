# Architecture and delivery plan

## Product interpretation

BrandKit Studio organizes identities supplied by designers. A project is the source of truth for all editing, application examples, guideline content, and exports. Suggested colors must require confirmation. Usage rules must come from the designer; absence of a rule is not permission to invent one.

## Initial design system

Interface palette: canvas #F7F8FA, surface #FFFFFF, border #E5E7EB, text #25282C, muted text #697079, selection accent #3F6655. The interface uses a compact Arial/Helvetica system stack. The sample identity uses Georgia and Arial with forest, sage, linen, and ink colors. System fonts keep Phase 1 self-contained; later font selection requires tested, licensed assets.

Layout: left-aligned editing content with an independent preview panel. The sidebar has a stable location for each task. Below 950px the preview follows the workspace; below 600px navigation opens from a labeled menu button. Color belongs primarily to the brand content. Rounded containers distinguish editable content areas from the surrounding workspace, with restrained borders and no decorative dashboard metrics.

```text
Sidebar       | Project breadcrumb
              | Workspace / editing content | Brand application preview
Project       | Brand overview              | Mode selector
Sections      | Assets, palette, typography | Selected composition
```

## Decisions and trade-offs

1. React hooks first. A single project state owner will expose updates to feature editors. Add a reducer when update operations multiply; consider Zustand only when cross-feature subscriptions justify it.
2. IndexedDB for projects and blobs in Phase 2/3. Prefer a small wrapper such as `idb`, with versioned records and explicit migrations. Keep asset binaries separate from metadata, save related records transactionally, and use temporary object URLs only for rendering. Local storage is not a backup; browser eviction, private mode, quota failure, and device loss must be explained in the persistence UX.
3. Keep phase-one navigation in component state. It is not bookmarkable and browser Back does not navigate sections. Introduce URL routing in Phase 2 for project IDs and direct links, before saved project workflows depend on it.
4. SVG upload is a Phase 3 security boundary: enforce allowlisted MIME types, inspect decoded content and dimensions, limit size, sanitize SVG with a maintained library, reject active/external content, and display via image elements rather than injecting markup. Validate raster decoding too. File extension alone is insufficient. Set limits after representative designer assets are tested; a provisional 10 MB/file cap should be reviewed before upload ships.
5. PDF export: evaluate a structured renderer such as `@react-pdf/renderer` in Phase 6. Its separate layout model takes more effort than screenshots but supports selectable text, page breaks, and embedded typography. Verify SVG support or rasterize sanitized SVGs deliberately. Prototype a long multipage document before committing. Do not assume browser CSS or font metrics transfer directly to PDF.
6. Use licensed font files that can be embedded in both browser and PDF. Decide whether network font requests are acceptable; prefer bundled fonts for privacy and predictable offline behavior. Custom fonts remain out of scope.
7. HEX is the canonical sRGB color representation. Derive RGB, do not persist a second value that can become inconsistent. No CMYK or print color accuracy claims. Token exports should include a schema version and stable keys.

## Data model semantics

Interfaces live in `src/types/brand.ts`. They describe data, not validation: runtime input validation is required at editor, import, and persistence boundaries.

| Model               | Responsibility                                                                   |
| ------------------- | -------------------------------------------------------------------------------- |
| BrandProject        | Versioned aggregate, stable ID, name, description, ISO timestamps, child records |
| BrandAsset          | Stable metadata, category, MIME type, byte size, alt text, IndexedDB blob key    |
| BrandColor          | Stable ID, designer name, canonical HEX, semantic role                           |
| BrandTypography     | Heading/body family, pixel size, numeric weight, unitless line height            |
| BrandGuidelines     | Introduction and optional designer-authored logo/application notes               |
| BrandExportSettings | A4/Letter preference and optional asset inclusion intent                         |

Use UUIDs for user-created entities. Reject blank project names and malformed HEX; define sensible length and numeric bounds at editing time. Multiple colors can share a role; primary selection semantics need to be explicit before editors ship. The demo renderer currently uses fixture order. Future previews should resolve role assignments and missing values without assuming a complete palette. Empty guidelines fields mean no rule was provided. A richer reusable typography hierarchy can extend the versioned schema after heading/body is stable. `includeAssets` records future intent; it does not enable unsupported batch export.

## Screens

- Projects: create, browse, rename, describe, and delete with confirmation.
- Overview: project identity summary and synchronized previews.
- Brand assets: upload, categorize, preview, replace, and remove with confirmation.
- Colors: name, HEX/RGB, semantic roles, copy, edit, and remove.
- Typography: heading/body controls and readable specimens.
- Guidelines: assembled document with editable narrative and usage notes.
- Export: format choices, validation, progress, and downloadable output.

Phase 2 implements Projects and real-project information editing. Other feature destinations remain read-only placeholders. Avoid enabling controls for functionality not yet implemented.

## Incremental milestones and acceptance checks

| Phase            | Scope                                                                     | Completion check                                                                                           |
| ---------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 1 — Foundation   | Toolchain, shell, navigation, tokens, models, sample previews             | Build/typecheck pass; navigation and preview tests; responsive visual review                               |
| 2 — Projects     | Create/edit/list, URL routing, IndexedDB repository, storage errors       | A project survives reload; failed saves are visible; delete requires confirmation; migration test          |
| 3 — Assets       | Validated uploads, blob storage, categories, removal/replacement          | Supported files reload; malformed/active SVG rejected; object URLs revoked; quota failure handled          |
| 4 — Brand system | HEX validation, RGB/copy, roles, typography controls                      | A change updates every preview; invalid input cannot corrupt project; keyboard flow checked                |
| 5 — Guidelines   | Structured sections and designer-authored notes                           | Missing content has useful empty states; edits persist; no invented usage rules                            |
| 6 — Export       | Structured PDF, color values, JSON tokens                                 | Fonts embedded; long content paginates; exported values match project; downloads open correctly            |
| 7 — Polish       | Accessibility, browser testing, performance, docs, deployment preparation | Critical create/upload/edit/reload/export E2E path; manual keyboard/screen-reader checks; production build |

Basic raster color suggestions are optional after manual color editing is stable; advanced extraction remains outside MVP. Authentication, cloud storage, collaboration, template editors, custom fonts, asset versioning, Figma, and batch export are explicitly deferred.

## Folder evolution

Keep `app` for application composition, `components` for reused UI, `features/<domain>` for editors and domain-specific presentation, `types` for shared contracts, and `styles` for tokens/global styling. Introduce `lib/db.ts` for the IndexedDB boundary in Phase 2 and `hooks` only for reusable stateful behavior. Do not create empty modules for future phases. Move feature screens out of `App.tsx` as their forms and behavior arrive. Keep persistence and export logic independent from JSX so they can be tested with concrete inputs.

## Open requirements before their milestones

Confirm upload limits, supported browser baseline, offline expectations, expected project/asset volumes, export paper-size default, licensed font shortlist, and whether users need a portable project backup alongside tokens. These do not block the shell. Accessibility target is WCAG 2.2 AA; automated tests supplement but cannot replace manual evaluation.

## Phase 2 implementation decisions

- Native IndexedDB is encapsulated in `src/lib/projects-db.ts`. With one small store, a wrapper dependency was not necessary; every operation closes its connection and writes resolve on transaction completion. Version 1 creates the `projects` store. There was no prior persisted schema in Phase 1, so the initial migration is tested from a fresh database; no fictional upgrade migration was added.
- Records retain schemaVersion 1. Unsupported records surface a recoverable load error without silently deleting or rewriting them. Future field migrations and asset/blob stores belong in the version upgrade boundary.
- A save/delete compares the expected updatedAt inside the same read-write transaction. Stale tabs cannot overwrite or delete a newer project. This is conflict protection, not collaborative editing. Reload is currently required to see another tab's updates.
- Name: trimmed, required, at most 80 characters. Description: optional, at most 2,000 characters. Names need not be unique; stable UUIDs identify projects.
- Project URLs use `#/project/<id>/<section>`; `#/projects` is the entry screen, and `#/new` opens creation. Hash routing needs no server fallback configuration. The former Phase 1 limitation on browser Back is superseded.
- Forms explicitly save, retain input after failure, and warn before discarding edits. Database loading includes a retry action. Storage-full errors avoid claiming that changes were saved.
- New projects contain no brand colors or uploaded assets. The preview remains an honest empty state until those are provided in future phases. Forma is never inserted into the database.

Next milestone: Phase 3 asset uploads, validation/sanitization, blob persistence, categorization, removal, and replacement. Cloud storage, backup exports, and cross-tab live synchronization remain outside this milestone.

## Phase 3 delivery

Database v2 adds an assets object store; record schemaVersion stays at 1 because BrandAsset was already defined. All mutations use a transaction across both stores so rejected/stale replacements retain the previous file. Blob keys are UUIDs, and temporary object URLs are revoked on preview unmount and validation completion.

SVG handling deliberately accepts only a static allowlisted subset and rejects unsupported artwork rather than stripping it. This replaces the earlier proposed sanitization-library approach: no SVG is injected as markup, and references are restricted to local fragment paint/clipping URLs. Complex SVG features must be reexported as static geometry/presentation attributes or raster images. Limits are 10 MB, 10,000 SVG elements, 40 megapixels and a 10-second decode timeout.

Phase 3 delivers single-file uploads, categories, replacement/removal confirmation and a real uploaded-logo preview. Multi-file queues and drag-and-drop are not implemented. The next milestone is Phase 4: manual color palette and typography editors synchronized with application previews.

## Phase 4 delivery

Colors and heading/body typography use the existing project schema. Editors keep a local draft; valid updates publish a temporary preview project to App. Committed project state only changes after the IndexedDB transaction completes. Navigation guards protect unsaved drafts; malformed partial inputs never reach persisted records. The repository also validates brand-system values before saving.

HEX normalizes to six uppercase digits; RGB derives from it. Duplicate roles are allowed and resolved in array order (first match). Defaults are preview-only. System fonts and regular/bold weights avoid pretending unavailable font files exist. Specimens use configured sizes; miniatures scale them to 55%, preserve logo artwork, and use the current project's name/description. Future PDF font embedding needs a separate licensed-font decision.

No extraction, AI, custom font uploads, guideline generation or PDF export was added. Phase 5 is the next milestone: editable guideline content assembled from the saved identity.

## Phase 5 delivery

GuidelinesDocument is a read-only rendering of a BrandProject. GuidelinesEditor owns only a temporary BrandGuidelines draft, merged with the saved project for live document rendering. Save commits the project through the existing optimistic-concurrency transaction; errors preserve the text, and navigation protection follows the other editors. Text is rendered by React as plain text with preserved line breaks, never as HTML.

The existing three guideline fields are optional and limited to 5,000 characters each, validated both by the editor and repository. No schema change or migration is needed. The fixed layout includes all requested sections and explicit incomplete-content states. Editing visual identity uses the existing feature editors; drag-and-drop layout editing remains out of scope. Application layouts are examples, and missing-role preview defaults are disclosed.

Next: Phase 6, structured PDF and token/color export with font embedding, pagination and output verification. This browser document does not claim to provide those features.

## Phase 6 implementation and trade-off

The initial exporter uses pdf-lib's create/embedPng/addPage/save APIs (https://pdf-lib.js.org/docs/api/classes/pdfdocument). It draws a structured, independently paginated document using a reusable 3x Canvas and embeds each page. Fonts come from the current device, avoiding undisclosed substitution with unrelated bundled fonts. Unlike the earlier proposed structured text renderer, this implementation rasterizes all page content: no selectable text, embedded font programs, preserved SVG vectors, or tagged accessibility. This limitation is disclosed before download and on the PDF cover. A future selectable-text renderer requires a font licensing/embedding decision.

Text uses measured wrapping, including unbroken words, and page overflow triggers a new page before drawing. Asset bitmaps preserve aspect ratios and release object URLs. Missing assets fail the entire export. JSON outputs preserve stable IDs, roles and explicit units without exporting local blob keys. Data exports use the saved project snapshot, never preview defaults or unsaved editor text. Paper format is local to the export panel and does not mutate the project. Large PDF dependencies are dynamically imported.

QA generated A4 and Letter documents (10 pages each) with the production renderer and native Canvas, reopened them for page-size checks, and inspected Poppler-rendered pages. An application-card title/footer collision was corrected and rechecked. Full in-browser download and cross-device font QA remain outstanding. Phase 7 should prioritize that validation, keyboard/screen-reader flows and responsive behavior.
