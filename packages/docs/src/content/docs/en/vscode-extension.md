---
title: VS Code Extension
description: Edit Figram diagrams with IntelliSense, diagnostics, and live sync
---

The Figram VS Code extension provides a rich editing experience for YAML diagram files with autocompletion, real-time validation, and integrated server management.

## Features

### Autocompletion

Get intelligent suggestions as you type:

- **`provider:`** - Suggests `aws`, `azure`, `gcp` with icon counts
- **`kind:`** - Suggests available icons filtered by the node's provider

```yaml
nodes:
  - id: my-ec2
    provider: aws      # Autocomplete: aws (873 icons), azure (636 icons), gcp (216 icons)
    kind: compute.ec2  # Autocomplete: Only AWS icons when provider is 'aws'
```

### Diagnostics

Real-time validation highlights errors and warnings:

| Issue | Severity | Example |
|-------|----------|---------|
| Invalid provider | Error | `provider: amazon` → "Invalid provider 'amazon'. Expected: aws, azure, gcp" |
| Unknown kind | Warning | `kind: invalid.thing` → "Unknown kind 'invalid.thing' for provider 'aws'" |
| Missing required fields | Warning | Missing `version` or `docId` |
| Duplicate node IDs | Error | Two nodes with same `id` |
| YAML syntax errors | Error | Invalid YAML structure |

### Snippets

Quickly scaffold diagrams with built-in snippets:

| Prefix | Description |
|--------|-------------|
| `figram-diagram`, `diagram` | Basic diagram template |
| `figram-vpc`, `aws-vpc` | AWS VPC architecture template |
| `figram-node-aws`, `node-aws` | AWS node |
| `figram-node-gcp`, `node-gcp` | GCP node |
| `figram-node-azure`, `node-azure` | Azure node |
| `figram-container`, `figram-section` | Container/Section node with width and height |
| `figram-node-parent`, `node-child` | Node inside a container (with parent) |
| `figram-edge`, `edge` | Edge connecting two nodes |
| `figram-edge-simple`, `edge-simple` | Simple edge without label |
| `figram-edges`, `edges` | Edges section with one edge |
| `figram-icons`, `icons` | Custom icons section |
| `figram-icons-file`, `icons-file` | figram-icons.yaml file template |
| `figram-three-tier`, `three-tier` | Three-tier architecture template |

### Server Management

Control the Figram WebSocket server directly from VS Code:

- **Status Bar** - Shows server state (stopped/running) and port
- **Commands**:
  - `figram: Start Serve` - Start the WebSocket server
  - `figram: Stop Serve` - Stop the server
  - `figram: Restart Serve` - Restart the server

## Installation

### From VS Code Marketplace

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "figram"
4. Click Install

### From VSIX

```bash
# Build the extension
cd packages/vscode
bun run package

# Install the generated .vsix file
code --install-extension figram-vscode-*.vsix
```

## Configuration

Configure the extension in VS Code settings (`settings.json`):

```json
{
  // CLI command (default: auto-detect or npx figram@latest)
  "figram.cli.command": ["bunx", "figram"],

  // Server settings
  "figram.serve.host": "127.0.0.1",
  "figram.serve.port": 3456,
  "figram.serve.allowRemote": false,
  "figram.serve.secret": "",
  "figram.serve.noWatch": false,
  "figram.serve.iconsPath": "",

  // Diagnostics settings
  "figram.diagnostics.enabled": true,
  "figram.diagnostics.debounceMs": 300
}
```

## Commands

| Command | Description |
|---------|-------------|
| `figram: Init diagram.yaml` | Create a new diagram template |
| `figram: Build JSON (current file)` | Convert current YAML to JSON |
| `figram: Start Serve` | Start WebSocket server |
| `figram: Stop Serve` | Stop WebSocket server |
| `figram: Restart Serve` | Restart WebSocket server |
| `figram: Serve Actions` | Quick pick menu for server actions |
| `figram: Show Output` | Show extension output channel |
| `figram: Refresh Diagnostics` | Force re-analyze current file |

## Supported Files

The extension activates for:

- `diagram.yaml` / `diagram.yml`
- `*.figram.yaml` / `*.figram.yml`
- `figram-icons.yaml` / `figram-icons.yml`
- Any YAML file containing `docId:` and `nodes:`
