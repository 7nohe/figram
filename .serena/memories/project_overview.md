Project: figram (monorepo). Purpose: YAML-driven architecture diagrams for FigJam; CLI parses/validates YAML, normalizes to IR, diffs, and syncs to FigJam via WebSocket; plugin renders nodes/edges.

Structure:
- packages/core: DSL types, validation, normalization, diff.
- packages/cli: commands (init/build/serve), WebSocket server, file watching.
- packages/plugin: FigJam plugin (main thread code.ts + UI ui.ts), rendering.
- docs/, examples/.

Tech stack:
- TypeScript, Bun (workspaces), Node >=18 for CLI runtime.
- tsup for builds, ws/commander/yaml deps.
- Figma/FigJam plugin APIs.
- Lint/format with Biome; tests with bun:test.

Architecture summary: DSL YAML -> validate -> normalize -> IR -> diff/patch -> WebSocket -> plugin UI -> main thread render.