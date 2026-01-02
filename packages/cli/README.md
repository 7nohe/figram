# figram

YAML-driven architecture diagrams for FigJam.

## Install

```bash
npm install -g figram
# or
bun add -g figram
```

## Usage

```bash
figram init
figram build diagram.yaml
figram serve diagram.yaml
```

## Commands

- `figram init` - Create a `diagram.yaml` template
- `figram build <file>` - Convert YAML to IR JSON
- `figram serve <file>` - Start WebSocket server with file watching

## Serve Options

- `--port, -p` Port number (default: 3456)
- `--host` Host to bind (default: 127.0.0.1)
- `--no-watch` Disable file watching
- `--allow-remote` Allow remote connections
- `--secret` Require secret for connection
- `--icons` Path to icons configuration file (figram-icons.yaml)

## Notes

This CLI syncs diagrams to the FigJam plugin over a local WebSocket. See the project
README for plugin setup and the YAML reference.
