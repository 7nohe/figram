---
title: Quick Start
description: Create your first diagram in 5 minutes
---

Get Figram running in 5 minutes.

## 1. Create a Diagram

```bash
npx figram init
```

This creates `diagram.yaml`:

```yaml
version: 1
docId: "my-architecture"
title: "My Architecture Diagram"

nodes:
  - id: vpc
    provider: aws
    kind: network.vpc
    label: "VPC 10.0.0.0/16"
    layout: { x: 0, y: 0, w: 800, h: 500 }

  - id: subnet_public
    provider: aws
    kind: network.subnet
    label: "Public Subnet"
    parent: vpc
    layout: { x: 40, y: 60, w: 360, h: 380 }

  - id: alb
    provider: aws
    kind: compute.lb.alb
    label: "ALB"
    parent: subnet_public
    layout: { x: 100, y: 120 }

edges:
  - id: alb_to_ecs
    from: alb
    to: ecs
    label: "HTTP:80"
```

## 2. Start Server

```bash
npx figram diagram.yaml
```

Output:
```
WebSocket server started on ws://127.0.0.1:3456
Watching diagram.yaml for changes...
```

## Import awsdac YAML (experimental)

If you already have an [AWS Diagram-as-Code (awsdac)](https://github.com/awslabs/diagram-as-code) YAML file, you can load it directly:

```bash
npx figram path/to/awsdac.yaml
```

Notes:
- Doc ID is derived from the filename (e.g., `vpc.yaml` -> `vpc`).
- Layout/stack direction and link styling are not preserved.
- Go template expansion is not supported (preprocess with `awsdac -t`).
- Unknown resource types fall back to a generic icon.

## 3. Connect FigJam Plugin

1. Open FigJam in Figma Desktop
2. Run the Figram plugin (Plugins menu)
3. Enter:
   - **Doc ID**: `my-architecture`
   - **URL**: `ws://127.0.0.1:3456`
4. Click **Connect**

Your diagram appears on the canvas!

## 4. Live Edit

Edit `diagram.yaml` and save. Changes sync automatically to FigJam.

Try adding a new node:

```yaml
  - id: rds
    provider: aws
    kind: database.rds
    label: "PostgreSQL"
    parent: subnet_public
    layout: { x: 100, y: 260 }
```

## Next Steps

- [YAML Specs](/en/yaml-specs/) - Full YAML syntax reference
- [Examples](/en/examples/) - Real-world architecture patterns
- [Installation](/en/installation/) - Custom icons, remote access, and more
