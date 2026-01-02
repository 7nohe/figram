# Architecture

This document describes the overall architecture of Figram.

## Overview

Figram is a YAML-driven architecture diagram tool for FigJam. It follows a three-package monorepo architecture with clear separation of concerns.

```
┌─────────────┐     YAML      ┌─────────────┐
│   Editor    │ ───────────▶  │    CLI      │
│  (VSCode)   │               │  (Node.js)  │
└─────────────┘               └──────┬──────┘
                                     │
                              parse/validate
                              normalize/diff
                                     │
                                     ▼
                              ┌─────────────┐
                              │  WebSocket  │
                              │   Server    │
                              └──────┬──────┘
                                     │
                              patch/full msg
                                     │
                                     ▼
┌─────────────┐               ┌─────────────┐
│   FigJam    │ ◀──────────── │  Plugin UI  │
│   Canvas    │   postMessage │  (iframe)   │
└─────────────┘               └─────────────┘
```

## Package Structure

```
figram/
├── packages/
│   ├── core/          # DSL types, validation, normalization, diff
│   ├── cli/           # CLI commands (init, build, serve)
│   └── plugin/        # FigJam plugin (UI + renderer)
├── examples/
│   └── diagram.yaml   # Example diagram
├── biome.json         # Linter/formatter config
└── package.json       # Workspace root
```

## Packages

### @figram/core

**Purpose:** Dependency-free library for DSL processing.

**Responsibilities:**
- Define DSL (YAML input) and IR (normalized) types
- Validate YAML documents against the schema
- Normalize DSL documents to IR format
- Calculate diffs between IR documents

**Key Files:**
- `types.ts` - All type definitions (DSL, IR, Patch, WebSocket protocol)
- `validate.ts` - YAML validation with descriptive errors
- `normalize.ts` - DSL to IR conversion
- `diff.ts` - IR diff calculation

**Design Principles:**
- Zero dependencies for maximum portability
- Pure functions for testability
- Clear separation between input (DSL) and normalized (IR) formats

### @figram/cli

**Purpose:** Command-line interface for Node.js.

**Commands:**
- `init` - Create a `diagram.yaml` template
- `build` - Convert YAML to IR JSON format
- `serve` - Start WebSocket server with file watching

**Key Features:**
- Uses `yaml` npm package for YAML parsing
- Uses `ws` npm package with Node.js `http` server for WebSocket
- File watching with debounce for live sync

**Server Architecture:**
```
                    ┌──────────────────────────────────┐
                    │          CLI Server              │
                    │                                  │
  YAML File ──────▶ │  ┌─────────┐    ┌────────────┐  │
                    │  │  File   │───▶│ validate() │  │
                    │  │ Watcher │    └─────┬──────┘  │
                    │  └─────────┘          │         │
                    │                       ▼         │
                    │               ┌────────────┐    │
                    │               │ normalize()│    │
                    │               └─────┬──────┘    │
                    │                     │           │
                    │                     ▼           │
                    │               ┌────────────┐    │
                    │               │   diff()   │    │
                    │               └─────┬──────┘    │
                    │                     │           │
                    │                     ▼           │
                    │  ┌─────────────────────────┐    │
  WebSocket ◀────── │  │  WebSocket Broadcast    │    │
  Clients           │  │  (patch/full messages)  │    │
                    │  └─────────────────────────┘    │
                    └──────────────────────────────────┘
```

### @figram/plugin

**Purpose:** FigJam plugin for rendering diagrams.

**Two-Thread Architecture:**

Figma plugins run in two separate threads:

1. **Main Thread** (`code.ts`)
   - Access to Figma API
   - Renders nodes/edges on the canvas
   - No browser APIs available

2. **UI Thread** (`ui.ts`)
   - Runs in an iframe
   - WebSocket client connection
   - Full browser APIs available

**Communication:**

```
┌─────────────────────────────────────────────────────────┐
│                     FigJam Plugin                       │
│                                                         │
│  ┌──────────────────┐         ┌────────────────────┐   │
│  │    Main Thread   │         │     UI Thread      │   │
│  │     (code.ts)    │         │      (ui.ts)       │   │
│  │                  │         │                    │   │
│  │  ┌────────────┐  │         │  ┌──────────────┐  │   │
│  │  │   Figma    │  │ ◀─────  │  │  WebSocket   │  │───│──▶ CLI Server
│  │  │    API     │  │ postMsg │  │    Client    │  │   │
│  │  └────────────┘  │ ─────▶  │  └──────────────┘  │   │
│  │                  │         │                    │   │
│  │  ┌────────────┐  │         │  ┌──────────────┐  │   │
│  │  │  Renderer  │  │         │  │   UI Form    │  │   │
│  │  └────────────┘  │         │  │ (docId/URL)  │  │   │
│  └──────────────────┘         └────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. DSL to IR Pipeline

```
YAML String
    │
    ▼ yaml.parse()
    │
Raw Object
    │
    ▼ validate()
    │
DSLDocument (or errors)
    │
    ▼ normalize()
    │
IRDocument
```

### 2. Incremental Sync Pipeline

```
Previous IR    New IR
    │            │
    └─────┬──────┘
          │
          ▼ diff()
          │
     PatchOp[]
          │
          ▼ broadcast()
          │
     WebSocket Message
          │
          ▼ postMessage()
          │
     Figma API Calls
```

### 3. Full Sync Flow

```
Plugin                  CLI Server
  │                        │
  │  hello { docId }       │
  ├───────────────────────▶│
  │                        │
  │  full { rev, ir }      │
  │◀───────────────────────┤
  │                        │
  ▼                        │
Render                     │
```

### 4. Incremental Update Flow

```
Plugin                  CLI Server               File Watcher
  │                        │                        │
  │                        │   File Changed         │
  │                        │◀───────────────────────┤
  │                        │                        │
  │                        ├── validate/normalize   │
  │                        ├── diff                 │
  │                        │                        │
  │  patch { ops }         │                        │
  │◀───────────────────────┤                        │
  │                        │                        │
  ▼                        │                        │
Apply Patch                │                        │
```

## Key Design Decisions

### Why IR (Intermediate Representation)?

1. **Order Independence**: DSL uses arrays; IR uses Records. This removes array order as a diff factor.
2. **Default Values**: IR has all optional fields filled with defaults, simplifying downstream code.
3. **Diff Efficiency**: Record-based lookups enable O(1) node/edge existence checks.

### Why Patch Operations?

1. **Minimal Updates**: Only changed elements are updated in FigJam.
2. **Preserved State**: Manual adjustments (positioning, styling) are not overwritten.
3. **Operation Ordering**: Parent-first for creates, child-first for deletes prevents orphan issues.

### Why WebSocket?

1. **Real-time**: Instant updates without polling.
2. **Bidirectional**: Plugin can request full state if needed.
3. **Efficient**: Only diffs are sent after initial sync.

### Why Two-Thread Plugin?

This is a Figma constraint:
- Main thread has Figma API but no browser APIs
- UI thread has browser APIs but no Figma API
- Communication is via `postMessage`

## Revision Management

The CLI server maintains a revision counter:

```
currentRev = 0

On file change:
  1. Parse and validate YAML
  2. Calculate diff from currentIR
  3. If changes exist:
     - prevRev = currentRev
     - currentRev++
     - Broadcast patch { baseRev: prevRev, nextRev: currentRev, ops }
```

Clients track their revision to detect missed updates and request full sync when needed.

## Security

### Secret-Based Authentication

The `serve` command supports optional secret authentication:

```bash
npx figram serve diagram.yaml --secret my-secret
```

Clients must include the secret in their `hello` message:

```json
{ "type": "hello", "docId": "my-doc", "secret": "my-secret" }
```

### Remote Access

By default, the server binds to `127.0.0.1`. Use `--allow-remote` to bind to `0.0.0.0`:

```bash
npx figram serve diagram.yaml --allow-remote
```

## Testing

Tests are co-located with source files:

```
packages/core/
├── src/
│   ├── types.ts
│   ├── validate.ts
│   ├── validate.test.ts
│   ├── normalize.ts
│   ├── normalize.test.ts
│   ├── diff.ts
│   └── diff.test.ts
```

Run with `bun test`.
