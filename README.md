<p align="center">
  <img src="https://github.com/7nohe/figram/raw/main/images/logo.svg" width="300" alt="figram">
</p>

# figram

YAML-driven architecture diagrams for FigJam. Define your infrastructure as code and sync it live to FigJam.

## Features

- **Diagram as Code**: Define cloud architecture diagrams in YAML
- **Multi-Provider Support**: AWS, GCP, and Azure icons
- **Live Sync**: Edit YAML and watch FigJam update in real-time
- **Incremental Updates**: Only changed elements are updated (preserves manual adjustments)
- **Containers**: VPC/Subnet/VNet as nested frames
- **Custom Icons**: Bring your own icon sets

## Quick Start

### 1. Install CLI

```bash
npm install -g figram
```

Or run directly with npx:

```bash
npx figram <command>
```

### 2. Create a diagram

```bash
npx figram init
```

This creates a `diagram.yaml` template.

### 3. Install FigJam Plugin

1. Install from [Figma Community](https://www.figma.com/community/plugin/figram) (coming soon)
2. Open a FigJam file
3. Run the figram plugin from the plugins menu

### 4. Start live sync

```bash
npx figram diagram.yaml
```

In the FigJam plugin:
1. Enter the `docId` from your YAML
2. Connect to `ws://127.0.0.1:3456`

Your diagram will appear and sync automatically when you edit the YAML!

## Example Diagram

```yaml
version: 1
docId: "my-architecture"
title: "Production Environment"

nodes:
  - id: vpc
    provider: aws
    kind: network.vpc
    label: "VPC 10.0.0.0/16"
    layout: { x: 0, y: 0, w: 800, h: 500 }

  - id: alb
    provider: aws
    kind: compute.lb.alb
    label: "ALB"
    parent: vpc
    layout: { x: 100, y: 100 }

  - id: ecs
    provider: aws
    kind: compute.container.ecs_service
    label: "ECS Service"
    parent: vpc
    layout: { x: 100, y: 250 }

  - id: rds
    provider: aws
    kind: database.rds
    label: "RDS PostgreSQL"
    parent: vpc
    layout: { x: 300, y: 250 }

edges:
  - id: alb_to_ecs
    from: alb
    to: ecs
    label: "HTTP:80"

  - id: ecs_to_rds
    from: ecs
    to: rds
    label: "TCP:5432"
```

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

### `figram serve <file>` (default)

Start WebSocket server with file watching. This is the default command, so you can omit `serve`:

```bash
npx figram diagram.yaml
# or explicitly:
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

## Supported Providers

| Provider | Description |
|----------|-------------|
| `aws` | Amazon Web Services |
| `gcp` | Google Cloud Platform |
| `azure` | Microsoft Azure |

## Supported Kinds

**Containers (with w/h):**
- AWS: `network.vpc`, `network.subnet`
- GCP: `network.vpc`
- Azure: `network.vnet`

**AWS Resources:**
- `compute.ec2`, `compute.lambda`, `compute.lb.alb`, `compute.lb.nlb`
- `compute.container.ecs`, `compute.container.ecs_service`, `compute.container.eks`
- `database.rds`, `database.aurora`, `database.dynamodb`
- `storage.s3`, `storage.efs`
- `network.route53`, `network.cloudfront`, `network.api_gateway`
- and more...

**GCP Resources:**
- `compute.gce`, `compute.functions`, `compute.cloudrun`
- `compute.container.gke`
- `database.cloudsql`, `database.firestore`, `database.spanner`
- `storage.gcs`
- and more...

**Azure Resources:**
- `compute.vm`, `compute.functions`, `compute.appservice`
- `compute.container.aks`, `compute.container.aci`
- `database.sql`, `database.cosmosdb`
- `storage.blob`, `storage.files`
- and more...

See [docs/en/yaml-specs.md](docs/en/yaml-specs.md) for the complete list of supported kinds.

## Custom Icons

You can use your own icons by creating a `figram-icons.yaml`:

```yaml
version: 1
icons:
  my-service:
    path: "./icons/my-service.png"
  another-service:
    path: "./icons/another.png"
```

Then reference them in your diagram:

```yaml
nodes:
  - id: custom
    kind: my-service
    label: "My Custom Service"
    layout: { x: 0, y: 0 }
```

Start the server with the icons file:

```bash
npx figram serve diagram.yaml --icons figram-icons.yaml
```

## Development

### VS Code Extension Debugging

To debug the VS Code extension, follow these steps:

#### 1. Debug Configuration

Create `.vscode/launch.json` at the project root with the following configuration:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Run Extension",
      "type": "extensionHost",
      "request": "launch",
      "args": [
        "--extensionDevelopmentPath=${workspaceFolder}/packages/vscode"
      ],
      "outFiles": [
        "${workspaceFolder}/packages/vscode/dist/**/*.js"
      ],
      "preLaunchTask": "build:dev"
    },
    {
      "name": "Extension Tests",
      "type": "extensionHost",
      "request": "launch",
      "args": [
        "--extensionDevelopmentPath=${workspaceFolder}/packages/vscode",
        "--extensionTestsPath=${workspaceFolder}/packages/vscode/dist/test"
      ],
      "outFiles": [
        "${workspaceFolder}/packages/vscode/dist/**/*.js"
      ],
      "preLaunchTask": "build:dev"
    }
  ]
}
```

Create `.vscode/tasks.json` for the build task:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "build:dev",
      "type": "shell",
      "command": "bun",
      "args": ["run", "build:dev"],
      "options": {
        "cwd": "${workspaceFolder}/packages/vscode"
      },
      "problemMatcher": [],
      "group": {
        "kind": "build",
        "isDefault": true
      }
    }
  ]
}
```

#### 2. Start Debugging

1. Press **F5** or select "Run Extension" from the debug panel (Cmd+Shift+D)
2. A new "Extension Development Host" window will open
3. The extension will run in this window

#### 3. Setting Breakpoints

- Set breakpoints in source files like `packages/vscode/src/extension.ts`
- When you execute extension commands, execution will stop at breakpoints

#### 4. Viewing Logs

- **Debug Console**: Inspect variable values
- **Output Panel**: View logs in the "figram" channel
- **Command Palette**: Run "figram: Show Output" to display output

#### 5. Watch Mode for Development

Run the following in a separate terminal to enable automatic builds on file changes:

```bash
cd packages/vscode
bun run dev
```

#### Available Debug Configurations

- **Run Extension**: Run the extension in debug mode
- **Extension Tests**: Run tests

## Documentation

- [YAML Specification](docs/en/yaml-specs.md)
- [API Reference](docs/en/api-reference.md)
- [Architecture](docs/en/architecture.md)

## License

MIT
