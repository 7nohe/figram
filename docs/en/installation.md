# Installation

This guide covers how to install and set up Figram.

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later (or [Bun](https://bun.sh/))
- [Figma Desktop](https://www.figma.com/downloads/)

## Quick Start

### 1. Install CLI

```bash
npm install -g figram
```

Or run directly with npx (no install needed):

```bash
npx figram <command>
```

### 2. Create a Diagram

```bash
npx figram init
```

This creates a `diagram.yaml` template in your current directory.

### 3. Install FigJam Plugin

1. Install from [Figma Community](https://www.figma.com/community/plugin/figram) (coming soon)
2. Open a FigJam file
3. Run the figram plugin from the plugins menu

### 4. Start Live Sync

```bash
npx figram serve diagram.yaml
```

In the FigJam plugin:
1. Enter the `docId` from your YAML file
2. Connect to `ws://127.0.0.1:3456`

Your diagram will appear and sync automatically when you edit the YAML!

## CLI Commands

### `figram init`

Create a `diagram.yaml` template.

```bash
npx figram init
```

### `figram build <file>`

Convert YAML to JSON format.

```bash
npx figram build diagram.yaml
# Output: diagram.json
```

### `figram serve <file>`

Start WebSocket server with file watching.

```bash
npx figram serve diagram.yaml
```

Options:

| Option | Description |
|--------|-------------|
| `--port, -p` | Port number (default: 3456) |
| `--host` | Host to bind (default: 127.0.0.1) |
| `--no-watch` | Disable file watching |
| `--allow-remote` | Allow remote connections |
| `--secret` | Require secret for connection |
| `--icons` | Path to custom icons file |

## Icon Rendering

Figram uses **FigJam's built-in cloud provider shapes** when available. This requires:
- FigJam Pro, Organization, or Enterprise plan (includes standard shapes library)

### Free Plan Users (Custom Icons)

If you're on a free plan and don't have access to FigJam's standard shapes, nodes will render as simple rectangles with labels. You can add custom icons using one of the following methods:

#### Option 1: figram-icons.yaml (Recommended)

Create a `figram-icons.yaml` file in the same directory as your diagram:

```yaml
version: 1
icons:
  aws:
    "compute.ec2": "./icons/ec2.png"
    "database.rds": "./icons/rds.png"
    "compute.lambda": "./icons/lambda.png"
```

Place your icon files (PNG, JPG, etc.) in an `icons/` folder:

```
project/
  diagram.yaml
  figram-icons.yaml
  icons/
    ec2.png
    rds.png
    lambda.png
```

Start the server - icons are automatically discovered:

```bash
npx figram serve diagram.yaml
```

#### Option 2: Inline Icons in diagram.yaml

Add icons directly to your diagram file:

```yaml
version: 1
docId: "prod"
icons:
  aws:
    "compute.ec2": "./icons/ec2.png"
    "database.rds": "./icons/rds.png"
nodes:
  - id: web
    provider: aws
    kind: compute.ec2
    # ...
```

#### Option 3: Explicit Icons File

Specify a custom icons file path:

```bash
npx figram serve diagram.yaml --icons path/to/my-icons.yaml
```

#### Priority Order

When multiple icon sources are available, they are merged with the following priority (highest first):

1. **Inline icons** in `diagram.yaml`
2. **External file** (`figram-icons.yaml` or `--icons` flag)

This allows you to define common icons in an external file and override specific icons inline.

#### Downloading Official Icons

You can download official cloud provider icons from:
- **AWS**: https://aws.amazon.com/architecture/icons/
- **GCP**: https://cloud.google.com/icons
- **Azure**: https://learn.microsoft.com/en-us/azure/architecture/icons/

#### Icon Path Resolution

- Relative paths are resolved from the YAML file location
- Absolute paths are used as-is
- Supported formats: PNG, JPG, JPEG, GIF, WebP
- **Note:** SVG is NOT supported by FigJam's image API

#### Hierarchical Fallback

Icons support hierarchical matching. For example, if you define an icon for `compute.ec2`, it will also be used for `compute.ec2.t3` or `compute.ec2.custom` unless more specific icons are defined.

## Remote Access

By default, the server binds to `127.0.0.1` (localhost only). To allow connections from other machines:

```bash
npx figram serve diagram.yaml --allow-remote
```

For security, use `--secret` to require authentication:

```bash
npx figram serve diagram.yaml --allow-remote --secret my-secret
```

Clients must enter the secret in the plugin to connect.

## Troubleshooting

### WebSocket Connection Issues

- Ensure the CLI server is running (`npx figram serve`)
- Check that the port (default: 3456) is not in use
- Verify the `docId` in the plugin matches the YAML file

### Plugin Not Loading

- Make sure you're using **Figma Desktop**, not the web version
- Check the console (View > Developer > Console) for errors

### YAML Validation Errors

- Run `npx figram build diagram.yaml` to see detailed error messages
- Ensure all required fields are present (see [YAML Specs](./yaml-specs.md))
