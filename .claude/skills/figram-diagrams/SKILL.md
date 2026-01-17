---
name: figram-diagrams
description: Create and validate YAML diagram files for Figram (AWS/GCP/Azure architecture diagrams). Use when users want to create new architecture diagrams, add/modify nodes or edges, troubleshoot YAML validation errors, convert text descriptions to Figram YAML, or work with cloud infrastructure visualizations.
---

# Figram Diagram Authoring

## Structure

```yaml
version: 1
docId: "unique-id"      # WebSocket matching
title: "Diagram Title"  # Optional

nodes:
  - id: node-id         # Unique, descriptive (e.g., user-api)
    provider: aws       # aws | gcp | azure
    kind: compute.ec2   # See Icons Reference
    label: "Display"    # Optional, defaults to id
    layout: {x, y}      # Required for top-level nodes
    parent: vpc-id      # Optional, for nesting

edges:
  - id: edge-id
    from: node-a
    to: node-b
    label: "description"  # Optional
    color: "#3498DB"      # Optional, default: #666666
```

## Layout Rules

| Node Type | Layout |
|-----------|--------|
| Top-level | `{x, y}` required |
| Container (VPC, Subnet) | `{x, y, w, h}` required |
| Child (has parent) | Optional (auto-positioned in 3-column grid) |

## Edge Colors (Convention)

| Color | HEX | Use |
|-------|-----|-----|
| Blue | `#3498DB` | HTTP/HTTPS |
| Green | `#27AE60` | Database |
| Orange | `#E67E22` | Cache |
| Purple | `#9B59B6` | Container |
| Gray | `#666666` | Default |

## Icons Reference

Full lists: [AWS](https://figram.7nohe.dev/en/icons-aws/) | [GCP](https://figram.7nohe.dev/en/icons-gcp/) | [Azure](https://figram.7nohe.dev/en/icons-azure/)

### Common Kinds

**AWS:**
- Compute: `compute.ec2`, `compute.lambda`, `compute.lb.alb`, `compute.container.ecs`
- Database: `database.rds`, `database.dynamodb`, `database.aurora`
- Storage: `storage.s3`, `storage.efs`
- Network: `network.vpc`, `network.subnet`, `network.apigateway`, `network.cloudfront`
- Integration: `integration.sqs`, `integration.sns`, `integration.eventbridge`

**GCP:**
- Compute: `compute.gce`, `compute.functions`, `compute.cloudrun`, `compute.container.gke`
- Database: `database.cloudsql`, `database.firestore`, `database.spanner`
- Storage: `storage.gcs`
- Network: `network.vpc`, `network.cdn`, `network.apigateway`
- Integration: `integration.pubsub`, `integration.tasks`

**Azure:**
- Compute: `compute.vm`, `compute.functions`, `compute.appservice`, `compute.container.aks`
- Database: `database.sql`, `database.cosmosdb`, `database.redis`
- Storage: `storage.blob`, `storage.storage`
- Network: `network.vnet`, `network.frontdoor`, `network.apim`
- Integration: `integration.servicebus`, `integration.eventhubs`

## Examples

### Serverless API (AWS)

```yaml
version: 1
docId: serverless-api
title: "Serverless REST API"

nodes:
  - id: apigw
    provider: aws
    kind: network.apigateway
    label: "REST API"
    layout: { x: 100, y: 150 }

  - id: lambda
    provider: aws
    kind: compute.lambda
    label: "Handler"
    layout: { x: 300, y: 150 }

  - id: dynamodb
    provider: aws
    kind: database.dynamodb
    label: "Users Table"
    layout: { x: 500, y: 150 }

edges:
  - id: api-to-lambda
    from: apigw
    to: lambda
    label: "invoke"
    color: "#3498DB"

  - id: lambda-to-db
    from: lambda
    to: dynamodb
    label: "read/write"
    color: "#27AE60"
```

### VPC with Auto-Layout

```yaml
version: 1
docId: vpc-architecture
title: "VPC Architecture"

nodes:
  - id: vpc
    provider: aws
    kind: network.vpc
    label: "Production VPC"
    layout: { x: 0, y: 0, w: 600, h: 400 }

  - id: alb
    provider: aws
    kind: compute.lb.alb
    parent: vpc
    # Auto-positioned: (60, 60)

  - id: ecs
    provider: aws
    kind: compute.container.ecs_service
    parent: vpc
    # Auto-positioned: (220, 60)

  - id: rds
    provider: aws
    kind: database.rds
    parent: vpc
    # Auto-positioned: (380, 60)

edges:
  - id: alb-to-ecs
    from: alb
    to: ecs
  - id: ecs-to-rds
    from: ecs
    to: rds
```

## Validation Errors

| Error | Fix |
|-------|-----|
| Missing required field "version" | Add `version: 1` |
| Missing required field "docId" | Add unique `docId` |
| Duplicate node id | Use unique IDs |
| layout is required for top-level nodes | Add `layout: {x, y}` |
| references unknown parent | Fix parent ID |
| Edge references unknown node | Fix `from`/`to` IDs |
| Cycle detected in parent hierarchy | Break the cycle |

## Custom Icons

```yaml
# In diagram.yaml or figram-icons.yaml
icons:
  aws:
    "compute": "./icons/compute-generic.png"  # Fallback
    "compute.ec2": "./icons/ec2.png"          # Specific
```

Supported: PNG, JPG, JPEG, GIF, WebP (no SVG)

## Commands

```bash
npx figram init              # Create template
npx figram build diagram.yaml # Validate and build
npx figram serve diagram.yaml # Start live server
npx figram serve diagram.yaml -p 8080 # Custom port
```
