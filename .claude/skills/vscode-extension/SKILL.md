---
name: vscode-extension
description: VS Code extension development workflow. Use when working on completion providers, diagnostics, CLI integration, or building the extension.
---

# VS Code Extension Development

## Architecture

Single-thread VS Code extension:

- `packages/vscode/src/extension.ts` - Entry point, command registration
- `packages/vscode/src/completion/` - Autocomplete providers
- `packages/vscode/src/diagnostics/` - YAML validation and error highlighting
- `packages/vscode/src/ops/` - CLI detection, server management

## Key Components

### Completion Providers

- `KindCompletionProvider` - Suggests icon kinds based on provider context
- `ProviderCompletionProvider` - Suggests aws/azure/gcp with icon counts
- Icons data generated from `scripts/generate-icons-data.ts`

### Diagnostics

- `DiagnosticsManager` - Debounced analysis with VS Code events
- `analyzeDocument()` - YAML parsing and semantic validation
- Validates: provider values, kind existence, duplicate IDs, required fields

### Server Management

- `ServerManager` - Manages figram serve process lifecycle
- Status bar integration showing server state
- Quick pick menu for server actions

### CLI Integration

- `detectCli()` - Priority: workspace node_modules > PATH > config > npx fallback
- `runCli()` - Spawns CLI process with stdout/stderr handling

## Build

```bash
cd packages/vscode

# Development build with sourcemaps
bun run build:dev

# Watch mode
bun run dev

# Production build
bun run build

# Package as .vsix
bun run package
```

## Debugging

1. Create `.vscode/launch.json` with "Run Extension" configuration
2. Press F5 to launch Extension Development Host
3. Set breakpoints in source files
4. View logs in "figram" output channel

## Commands

| Command ID | Title |
|------------|-------|
| `figram.init` | figram: Init diagram.yaml |
| `figram.build` | figram: Build JSON (current file) |
| `figram.serve.start` | figram: Start Serve |
| `figram.serve.stop` | figram: Stop Serve |
| `figram.serve.restart` | figram: Restart Serve |
| `figram.serve.quickPick` | figram: Serve Actions |
| `figram.showOutput` | figram: Show Output |
| `figram.refreshDiagnostics` | figram: Refresh Diagnostics |

## Configuration

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `figram.cli.command` | string[] | null | Custom CLI command |
| `figram.serve.host` | string | 127.0.0.1 | Server host |
| `figram.serve.port` | number | 3456 | Server port |
| `figram.serve.allowRemote` | boolean | false | Allow remote connections |
| `figram.serve.secret` | string | "" | Authentication secret |
| `figram.serve.noWatch` | boolean | false | Disable file watching |
| `figram.serve.iconsPath` | string | "" | Custom icons file path |
| `figram.diagnostics.enabled` | boolean | true | Enable diagnostics |
| `figram.diagnostics.debounceMs` | number | 300 | Debounce delay |

## Key Files

- `package.json` - Extension manifest with commands, settings, snippets
- `src/extension.ts` - Activation and command registration
- `src/completion/icons-data.ts` - Generated icons data for completion
- `src/diagnostics/analyzer.ts` - Document analysis logic
- `src/ops/serverManager.ts` - Server lifecycle management
- `snippets/figram.json` - YAML snippets

## Adding New Features

### New Command

1. Add command in `package.json` under `contributes.commands`
2. Register handler in `extension.ts` using `vscode.commands.registerCommand()`
3. Add to context subscriptions for proper disposal

### New Configuration

1. Add property in `package.json` under `contributes.configuration.properties`
2. Read with `vscode.workspace.getConfiguration("figram.xxx")`

### New Completion Provider

1. Create provider class implementing `vscode.CompletionItemProvider`
2. Register in `extension.ts` with `vscode.languages.registerCompletionItemProvider()`
3. Export from `src/completion/index.ts`

### New Snippet

1. Add to `snippets/figram.json`
2. Update `docs/en/vscode-extension.md` and `docs/ja/vscode-extension.md`
