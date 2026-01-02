# Contributing to figram

Thank you for your interest in contributing to figram!

## Development Setup

### Prerequisites

- [Bun](https://bun.sh/) v1.0+
- [Figma Desktop](https://www.figma.com/downloads/) (for plugin development)

### Getting Started

```bash
# Clone the repository
git clone https://github.com/7nohe/figram.git
cd figram

# Install dependencies
bun install

# Run tests to verify setup
bun run test
```

## Project Structure

```
figram/
├── packages/
│   ├── core/              # Core library (no dependencies)
│   │   └── src/
│   │       ├── types.ts      # DSL/IR/Patch type definitions
│   │       ├── validate.ts   # YAML validation
│   │       ├── normalize.ts  # DSL → IR conversion
│   │       ├── diff.ts       # IR diff calculation
│   │       └── *.test.ts     # Unit tests
│   │
│   ├── cli/               # CLI application
│   │   └── src/
│   │       ├── index.ts      # Entry point
│   │       └── commands/     # CLI commands
│   │
│   └── plugin/            # FigJam plugin
│       ├── manifest.json     # Plugin manifest
│       └── src/
│           ├── ui.ts         # UI iframe (WebSocket)
│           ├── ui.html       # UI template
│           └── code.ts       # Main thread (renderer)
│
├── examples/              # Example diagrams
├── biome.json            # Linter/formatter config
└── package.json          # Workspace root
```

## Development Workflow

### Running Tests

```bash
# Run all tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests for a specific package
cd packages/core && bun test
```

### Code Quality

We use [Biome](https://biomejs.dev/) for linting and formatting.

```bash
# Check for issues
bun run check

# Auto-fix issues
bun run check:fix

# Lint only
bun run lint

# Format only
bun run format
```

### Building

```bash
# Build all packages
bun run build

# Build specific package
cd packages/plugin && bun run build
```

## Code Style

- Use TypeScript for all source files
- Follow the existing code patterns
- Write tests for new functionality
- Keep functions small and focused

### Naming Conventions

- **Files**: `kebab-case.ts`
- **Types/Interfaces**: `PascalCase`
- **Functions/Variables**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`

### Import Order

Biome will auto-sort imports:

1. External modules
2. Internal modules (workspace packages)
3. Relative imports

## Testing Guidelines

### Unit Tests

Place test files next to source files with `.test.ts` suffix:

```
src/
├── validate.ts
├── validate.test.ts
├── normalize.ts
└── normalize.test.ts
```

### Test Structure

```typescript
import { describe, expect, it } from "bun:test";

describe("functionName", () => {
  it("should do something specific", () => {
    const result = functionName(input);
    expect(result).toBe(expected);
  });

  it("should handle edge case", () => {
    // ...
  });
});
```

## Making Changes

### Adding a New Feature

1. Create a branch: `git checkout -b feature/your-feature`
2. Write tests first (TDD encouraged)
3. Implement the feature
4. Ensure all tests pass: `bun run test`
5. Check code quality: `bun run check`
6. Commit with descriptive message
7. Open a pull request

### Bug Fixes

1. Create a branch: `git checkout -b fix/issue-description`
2. Write a failing test that reproduces the bug
3. Fix the bug
4. Verify the test passes
5. Open a pull request

## Package-Specific Guidelines

### @figram/core

- Keep it dependency-free (browser + Node compatible)
- All types should be exported from `types.ts`
- Validation errors should be descriptive

### @figram/cli

- Use Bun APIs where possible
- Commands should have `--help` support
- Error messages should be user-friendly

### @figram/plugin

- Remember: main thread has no browser APIs
- UI thread handles WebSocket connections
- Use `pluginData` for tracking elements
- Test manually in Figma Desktop

## Pull Request Guidelines

- Provide a clear description of changes
- Reference any related issues
- Include screenshots for UI changes
- Ensure CI checks pass
- Keep PRs focused and reasonably sized

## Questions?

Feel free to open an issue for:
- Bug reports
- Feature requests
- Questions about the codebase

Thank you for contributing!
