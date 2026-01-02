# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Figram is a YAML-driven architecture diagram tool for FigJam. It allows defining AWS infrastructure diagrams in YAML and syncing them live to FigJam via WebSocket.

## Commands

```bash
# Install dependencies
bun install

# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run a single test file
bun test packages/core/src/diff.test.ts

# Run tests for specific package
bun test packages/core/

# Type check
bun run typecheck

# Lint and format check
bun run check

# Lint and format fix
bun run check:fix

# Build all packages
bun run build

# Build FigJam plugin
cd packages/plugin && bun run build

# Run CLI directly (dev)
bun run packages/cli/src/index.ts <command>
```

## Architecture

Three-package monorepo using Bun workspaces:

### @figram/core (packages/core/)
Dependency-free library for DSL processing:
- `types.ts` - DSL (YAML input), IR (normalized), Patch, and WebSocket protocol types
- `validate.ts` - YAML validation with descriptive errors
- `normalize.ts` - DSL → IR conversion (array to Record, defaults)
- `diff.ts` - IR diff calculation producing Patch operations

Data flow: **DSL (YAML) → validate → normalize → IR → diff → Patch**

### @figram/cli (packages/cli/)
CLI commands using Bun APIs:
- `init` - Create diagram.yaml template
- `build` - Convert YAML to IR JSON
- `serve` - WebSocket server with file watching

### @figram/plugin (packages/plugin/)
FigJam plugin with two threads:
- `code.ts` - Main thread (Figma API, renderer) - no browser APIs
- `ui.ts` - UI iframe (WebSocket client)

Communication: CLI ↔ WebSocket ↔ Plugin UI ↔ postMessage ↔ Plugin Main

## Key Patterns

**Testing**: Tests use `bun:test` and are co-located with source files (`*.test.ts`).

**Patch Operations**: Incremental updates use `upsertNode`, `removeNode`, `upsertEdge`, `removeEdge` ops.

**Plugin Development**: Import plugin via Figma Desktop → Plugins → Development → Import from manifest (`packages/plugin/manifest.json`).

## CI

GitHub Actions runs on push/PR to main: build, lint (`bun run check`), typecheck, test.

## Code Style

- Biome for linting/formatting (2-space indent, double quotes, semicolons, trailing commas)
- Files: `kebab-case.ts`, Types: `PascalCase`, Functions: `camelCase`, Constants: `UPPER_SNAKE_CASE`

## Plugin Constraints

**code.ts (main thread)**:
- NO browser APIs: `window`, `document`, `fetch`, `WebSocket` are unavailable
- Use only `figma.*` API
- Communication with UI only via `figma.ui.postMessage()`

**ui.ts (UI iframe)**:
- Browser APIs available
- Must serialize all data to main thread via `postMessage`

## PR Checklist

Before creating a PR:
1. `bun run build` passes
2. `bun run check` passes (or run `check:fix`)
3. `bun run typecheck` passes
4. `bun test` passes
5. New features have corresponding tests

## Adding Tests

- Co-locate tests: `foo.ts` → `foo.test.ts`
- Use descriptive test names matching behavior
- Test edge cases for validation/normalization

## Documentation Sync (IMPORTANT)

When modifying the following files, **automatically update related documentation** using the `doc-sync` agent:

| Source File | Documentation to Update |
|-------------|------------------------|
| `packages/core/src/types.ts` | `docs/*/yaml-specs.md`, `docs/*/api-reference.md`, `.claude/skills/yaml-authoring/`, `.claude/skills/core-development/` |
| `packages/core/src/validate.ts` | `docs/*/yaml-specs.md` (Validation Rules), `.claude/skills/yaml-authoring/` |
| `packages/cli/src/commands/*.ts` | `CLAUDE.md` (Commands), `docs/*/installation.md` |
| `packages/plugin/src/code.ts` | `.claude/skills/figjam-plugin/`, `CLAUDE.md` (Plugin Constraints) |
| `packages/plugin/src/ui.ts` | `.claude/skills/figjam-plugin/`, `.claude/skills/debug-connection/` |

### Sync Checklist

After changing specs or APIs:
1. Update English docs (`docs/en/`)
2. Update Japanese docs (`docs/ja/`)
3. Update relevant `.claude/skills/`
4. Update `CLAUDE.md` if commands or constraints changed
5. Verify consistency across all updated files
