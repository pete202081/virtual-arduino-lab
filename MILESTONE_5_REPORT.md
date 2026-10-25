# Milestone 5 — Persistence & Usability — Verification Report

**Status:** ✅ VERIFIED — versioned project persistence, saved-project picker, import/export, starter reset and duplicate are implemented. 10/10 M5 tests pass; all M2–M4 regressions and production build pass.  
**Date:** 24 Oct 2026  
**Depends on:** M1 workspace ✓ · M2 graph ✓ · M3 editor ✓ · M4 interpreter ✓

## Goal
Save and reopen reusable lab projects; export/import a portable JSON document; reject malformed/untrusted files before changing the workspace; keep transient simulation state out of saved files; add helpful project-management actions and a working example.

## Delivered
- `src/lib/projectPersistence.ts`
  - Versioned envelope `{ format: "virtual-arduino-lab", schemaVersion: 1, project: ... }`.
  - IndexedDB database with project records keyed by `project.id`; localStorage fallback for unavailable/blocked IndexedDB, plus migration from the previous M1–M3 localStorage shape.
  - List saved projects and load a selected project; the Open action displays a picker instead of silently selecting one.
  - Import validation limits: 5 MB file, 100 KB sketch, ≤200 components, ≤2,000 wires, ≤5,000 terminals; validates IDs, geometry, component/terminal types, settings, endpoint ownership, and wire colors before applying.
  - Normalizes imported terminal `connected` flags to false (graph-computed), and does not persist selected state, LED state, pin states, logs, timers, or simulation status.
  - JSON-only import; imported content is never evaluated.
- `src/circuit-engine/models/starterCircuit.ts` — pre-wired Blink D8→220Ω→LED→GND example for new users; validated as a valid circuit.
- `src/app/page.tsx` — IndexedDB-backed Save/Open, project picker, Import JSON file validation, Export JSON download, Duplicate project (creates a new saved record), blank New, Reset to Blink starter, persistence of wire-color setting, migration on load.
- `src/components/layout/TopBar.tsx` — More menu with Duplicate, Export JSON, Import JSON, and Reset to Blink starter.
- `tests/project-persistence.test.ts` — versioned round-trip, starter wiring validity, transient-state removal, dangling endpoint/schema rejection, legacy migration, size cap, dangerous properties, safe filename, and localStorage fallback/list/open.

## User flow
- **Save:** writes the current project to IndexedDB; automatically falls back to localStorage and reports the chosen store in Logs.
- **Open:** lists saved projects by most recent save, including component/wire counts and date; selection restores code, circuit, name, and wire color.
- **Export JSON…:** downloads a `.valab.json` file.
- **Import JSON…:** checks size and schema, verifies the complete circuit graph endpoints, then replaces the workspace only on successful validation.
- **Duplicate project:** makes and saves a separate named copy.
- **Reset to Blink starter:** confirmation, then replaces workspace with a pre-wired, ready-to-run example.

## Verification
Commands from `virtual-arduino-lab/`:

```sh
npx tsx tests/project-persistence.test.ts  # 10 passed
npx tsx tests/circuit-graph.test.ts        # 14 passed
npx tsx tests/sketch-validator.test.ts     # 7 passed
npx tsx tests/simulation-adapter.test.ts   # 6 passed
npm run build                             # passed
npm audit                                 # 0 vulnerabilities
```

Build output: optimized Next.js compile and TypeScript passed; all four static pages generated. Live preview smoke check: HTTP 200. M5 tests verify round-trip document integrity and actual localStorage save/list/open fallback in Node. IndexedDB code is implemented for browser use; full click-through persistence/import/export should be confirmed in the live preview.

## Accuracy and limits
- The browser stores projects locally; no server/account/cloud sync. IndexedDB can hold multiple projects; localStorage fallback retains one project.
- Open supports choosing among saved IndexedDB records. Exported files can be moved between browsers/devices.
- Project file schema version is 1; unsupported future versions are rejected, not guessed. Previous local M1–M3 records are migrated.
- Only project definition and settings are persisted. Runtime state and computed connectivity are reconstructed after opening.
- Browser storage can be cleared by the user or browser; export JSON for backup.

## Next: M6 — Quality & Release
Run end-to-end primary journey, tighten error handling/accessibility, confirm user preview interactions, finalize setup/limitations documentation, and perform final release checks.
