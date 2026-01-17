---
name: vscode-extension
description: VS Code extension development workflow. Use when adding/modifying completion providers, diagnostics, CLI integration, server management, snippets, or building/packaging the extension.
---

# VS Code Extension Development

## Architecture

| Directory | Purpose |
|-----------|---------|
| `src/extension.ts` | Entry point, command registration |
| `src/completion/` | Autocomplete for `provider:` and `kind:` |
| `src/diagnostics/` | YAML validation, error highlighting |
| `src/ops/` | CLI detection, server management |
| `snippets/figram.json` | YAML snippets |

## Build

```bash
cd packages/vscode
bun run build:dev    # Development with sourcemaps
bun run dev          # Watch mode
bun run build        # Production
bun run package      # Create .vsix
```

Debug: F5 in VS Code → Extension Development Host

## Commands

| ID | Title |
|----|-------|
| `figram.init` | Init diagram.yaml |
| `figram.build` | Build JSON |
| `figram.serve.start` | Start Serve |
| `figram.serve.stop` | Stop Serve |
| `figram.serve.restart` | Restart Serve |
| `figram.serve.quickPick` | Serve Actions |
| `figram.refreshDiagnostics` | Refresh Diagnostics |

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `figram.cli.command` | null | Custom CLI command |
| `figram.serve.host` | 127.0.0.1 | Server host |
| `figram.serve.port` | 3456 | Server port |
| `figram.serve.allowRemote` | false | Allow remote |
| `figram.serve.secret` | "" | Auth secret |
| `figram.diagnostics.enabled` | true | Enable diagnostics |
| `figram.diagnostics.debounceMs` | 300 | Debounce delay |

## Adding Features

### New Command

1. Add to `package.json` → `contributes.commands`
2. Register in `extension.ts` with `vscode.commands.registerCommand()`
3. Add to `context.subscriptions`

### New Configuration

1. Add to `package.json` → `contributes.configuration.properties`
2. Read with `vscode.workspace.getConfiguration("figram.xxx")`

### New Completion Provider

1. Create class implementing `vscode.CompletionItemProvider`
2. Register with `vscode.languages.registerCompletionItemProvider()`

### New Snippet

1. Add to `snippets/figram.json`
2. Update docs (`docs/en/vscode-extension.md`, `docs/ja/vscode-extension.md`)
