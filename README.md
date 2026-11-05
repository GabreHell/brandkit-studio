# BrandKit Studio

A workspace for designers to organize an existing visual identity and turn it into practical brand documentation.

**Status: in development · v0.7.0 release candidate.** Core workflows are implemented; browser acceptance and assistive-technology testing are still pending. This is not a production-approved release.

Created by **Gabriel Valerio Alves / Gabre Studio**, connecting product design with front-end development.

## Why this project

Brand assets, color decisions, typography and usage notes often live in separate files. BrandKit Studio brings them into one local workspace so designers can document an identity they have already created. It does not generate branding or use AI.

## Implemented

- Create, edit and delete projects, with unsaved-change warnings and stale-tab conflict protection.
- Upload and manage PNG, JPG, WebP and validated static SVG assets, including placement controls.
- Edit HEX colors, color roles and system-font typography with live previews.
- Write brand guidelines and review a structured document.
- Export A4/Letter guidelines PDFs, palette JSON and design-token JSON.
- Export and restore complete project backups, including images.
- Persist projects and assets locally in IndexedDB; explore a separate read-only sample.

## Run locally

Use Node.js 22.12+ (Node 24 recommended) and pnpm.

```sh
git clone https://github.com/GabreHell/brandkit-studio.git
cd brandkit-studio
pnpm install --frozen-lockfile
pnpm dev
```

Open the local URL printed by Vite. Keep the same browser, hostname and port to access saved projects.

| Command | Purpose |
| --- | --- |
| `pnpm test` | Run Vitest and React Testing Library tests. |
| `pnpm lint` | Run ESLint. |
| `pnpm build` | Check TypeScript and build into `dist/`. |
| `pnpm preview` | Preview the production build locally. |

## Architecture

React, TypeScript, Vite, Tailwind CSS, Lucide and pdf-lib. Application state is coordinated in `src/app`; feature modules contain projects, assets, brand-system editing, guidelines, exports and backups. IndexedDB operations are isolated in `src/lib`. Hash routing supports static hosting.

## Current limitations

- No accounts, cloud sync, collaborative editing or hosted demo is configured by this repository.
- Browser data can be cleared or evicted. Download complete project backups; palette/token exports are not restorable backups.
- PDF pages are rasterized: text is not selectable, artwork is not vector and PDFs are not accessibility-tagged.
- Fonts depend on the user's system. Preview compositions and starter typography require designer review.
- Automated tests do not establish cross-browser compatibility or WCAG compliance. Browser uploads, downloads, responsive behavior and screen-reader acceptance remain pending.

## Next steps

Complete the [release checklist](docs/release-checklist.md), validate real-browser backup/export workflows and refine accessibility before a stable release. Vector, selectable PDF output is a separate future improvement.

See [architecture](docs/architecture.md), [development history](docs/development-history.md) and the [Portuguese publication guide](docs/publicacao.md) for implementation details and earlier validation notes.

[Gabre Studio](https://gabrestudio.com) · [GitHub profile](https://github.com/GabreHell)
