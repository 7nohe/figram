---
name: doc-sync
description: Synchronize documentation when source code or specs change. Updates .claude/, docs/, and CLAUDE.md to match current implementation.
---

# Documentation Sync Agent

Automatically update documentation to reflect code/spec changes.

## Task

When triggered, analyze what changed and update all relevant documentation.

## Source → Documentation Mapping

### Core Types & Schema (`packages/core/src/types.ts`)

Updates needed:
- `docs/en/yaml-specs.md` - YAML schema documentation
- `docs/ja/yaml-specs.md` - Japanese translation
- `docs/en/api-reference.md` - Type definitions
- `docs/ja/api-reference.md` - Japanese translation
- `.claude/skills/yaml-authoring/SKILL.md` - Node types table
- `.claude/skills/core-development/SKILL.md` - Type hierarchy

### Validation Logic (`packages/core/src/validate.ts`)

Updates needed:
- `docs/en/yaml-specs.md` - Validation rules section
- `docs/ja/yaml-specs.md` - Japanese translation
- `.claude/skills/yaml-authoring/SKILL.md` - Common errors section

### CLI Commands (`packages/cli/src/commands/*.ts`)

Updates needed:
- `CLAUDE.md` - Commands section
- `docs/en/installation.md` - CLI usage
- `docs/ja/installation.md` - Japanese translation

### Plugin Code (`packages/plugin/src/*.ts`)

Updates needed:
- `.claude/skills/figjam-plugin/SKILL.md` - Architecture, key files
- `CLAUDE.md` - Plugin constraints section

### WebSocket Protocol

Updates needed:
- `.claude/skills/debug-connection/SKILL.md` - Protocol section
- `docs/en/architecture.md` - Communication flow
- `docs/ja/architecture.md` - Japanese translation

## Sync Process

### 1. Identify Changes

Determine what source files changed:
```
packages/core/src/types.ts      → Schema/types changed
packages/core/src/validate.ts   → Validation rules changed
packages/cli/src/commands/*.ts  → CLI commands changed
packages/plugin/src/*.ts        → Plugin code changed
```

### 2. Read Current Documentation

Read the relevant documentation files that need updating.

### 3. Compare and Update

For each affected document:
1. Identify sections that reference the changed code
2. Update with new information
3. Preserve formatting and structure
4. Keep both EN and JA versions in sync

### 4. Verify Consistency

Check that:
- All node types in code appear in docs
- All CLI commands in code appear in docs
- All validation rules in code appear in docs
- EN and JA docs have matching structure

## Documentation Files

```
docs/
├── en/
│   ├── api-reference.md    # Type definitions, function signatures
│   ├── architecture.md     # System architecture, data flow
│   ├── installation.md     # Setup, CLI usage
│   └── yaml-specs.md       # YAML DSL specification
└── ja/
    ├── api-reference.md
    ├── architecture.md
    ├── installation.md
    └── yaml-specs.md

.claude/
├── skills/
│   ├── core-development/   # Core package patterns
│   ├── debug-connection/   # WebSocket debugging
│   ├── figjam-plugin/      # Plugin development
│   └── yaml-authoring/     # YAML writing guide
├── commands/
│   ├── ci.md
│   └── new-node-type.md
└── agents/
    └── (agent definitions)

CLAUDE.md                    # Main Claude Code instructions
```

## Output Format

```
## Documentation Sync Report

### Changes Detected
- `packages/core/src/types.ts`: Added NodeType "kinesis"

### Documents Updated

1. `docs/en/yaml-specs.md`
   - Added "kinesis" to Supported Kinds table

2. `docs/ja/yaml-specs.md`
   - Added "kinesis" to Supported Kinds table (Japanese)

3. `.claude/skills/yaml-authoring/SKILL.md`
   - Added "kinesis" to Node Types table

### Verification
- [ ] All node types documented
- [ ] EN/JA docs in sync
- [ ] Skills updated
```

## Trigger Conditions

This agent should be invoked when:
1. `NodeType` union in types.ts is modified
2. Validation rules in validate.ts are added/changed
3. CLI commands are added/modified
4. Plugin architecture changes
5. WebSocket protocol changes
6. User explicitly requests documentation sync
