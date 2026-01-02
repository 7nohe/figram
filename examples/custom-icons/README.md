# Custom Icons Example

This example demonstrates how to use custom icons with figram - ideal for FigJam Free Plan users who don't have access to built-in FigJam component icons.

## Quick Start

```bash
# Navigate to this directory
cd examples/custom-icons

# Start the server
npx figram serve diagram.yaml --watch
```

Then open FigJam and connect to the WebSocket server.

## File Structure

```
custom-icons/
├── diagram.yaml         # Main diagram with inline icons
├── figram-icons.yaml    # External icons file (auto-discovered)
├── icons/
│   ├── server.svg       # Custom EC2 icon
│   ├── database.svg     # Custom RDS icon
│   └── bucket.svg       # Custom S3 icon
└── README.md
```

## Three Ways to Use Custom Icons

### 1. Inline in diagram.yaml

```yaml
version: 1
docId: "my-diagram"
icons:
  aws:
    "compute.ec2": "./icons/server.svg"
nodes:
  - id: web
    provider: aws
    kind: compute.ec2
```

### 2. External figram-icons.yaml (auto-discovered)

Place a `figram-icons.yaml` file in the same directory as your diagram:

```yaml
# figram-icons.yaml
version: 1
icons:
  aws:
    "compute.ec2": "./icons/server.svg"
```

### 3. Explicit --icons flag

```bash
npx figram serve diagram.yaml --icons ./path/to/icons.yaml
```

## Priority Order

When multiple icon sources are available, inline icons take priority:

1. **Inline icons** in `diagram.yaml` (highest priority)
2. **External file** (`figram-icons.yaml` or `--icons` flag)

This allows you to define shared icons in an external file and override specific ones inline.

## Supported Image Formats

- PNG (recommended)
- JPG/JPEG
- GIF
- WebP

**Note:** SVG is NOT supported by FigJam's image API. Use raster formats only.

## Icon Resolution

Icons are matched hierarchically:

1. `compute.ec2.t3` (exact match)
2. `compute.ec2` (category match)
3. `compute` (parent category)

This allows you to define a single icon for all EC2 instance types.

## Getting Official AWS Icons

Download official AWS Architecture Icons from:
https://aws.amazon.com/architecture/icons/

Extract and reference them in your icons configuration.
