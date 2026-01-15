---
name: yaml-authoring
description: Create and validate YAML diagram files. Use when writing new diagrams or troubleshooting YAML syntax.
---

# YAML Diagram Authoring

## Documentation

- [YAML Specs](https://figram.7nohe.dev/en/yaml-specs/) - Full DSL specification
- [AWS Icons](https://figram.7nohe.dev/en/icons-aws/) - All available AWS icons
- [Azure Icons](https://figram.7nohe.dev/en/icons-azure/) - All available Azure icons
- [GCP Icons](https://figram.7nohe.dev/en/icons-gcp/) - All available GCP icons

---

## Quick Start

```yaml
version: 1
docId: "my-diagram"
title: "My Architecture"

nodes:
  - id: lambda
    provider: aws
    kind: compute.lambda
    label: "Handler"
    layout: { x: 100, y: 100 }

  - id: dynamodb
    provider: aws
    kind: database.dynamodb
    label: "Users Table"
    layout: { x: 300, y: 100 }

edges:
  - id: lambda-to-db
    from: lambda
    to: dynamodb
    label: "read/write"
```

**Commands:**
```bash
# Validate and build to JSON
npx figram build diagram.yaml

# Start WebSocket server with live reload
npx figram serve diagram.yaml
```

---

## Document Structure

### Top-Level Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `version` | number | Yes | Schema version (currently `1`) |
| `docId` | string | Yes | Unique document identifier (used for WebSocket matching) |
| `title` | string | No | Document title (defaults to `docId`) |
| `nodes` | array | Yes | List of node definitions |
| `edges` | array | No | List of edge definitions |
| `icons` | object | No | Custom icon mappings |

### Node Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | Yes | Unique node identifier |
| `provider` | string | Yes | Cloud provider (`aws`, `gcp`, `azure`) |
| `kind` | string | Yes | Resource type (e.g., `compute.lambda`) |
| `label` | string | No | Display label (defaults to `id`) |
| `parent` | string | No | Parent node id for nesting |
| `layout` | object | Conditional | Position and size |

### Layout Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `x` | number | Conditional* | X position (pixels) |
| `y` | number | Conditional* | Y position (pixels) |
| `w` | number | No** | Width (for containers) |
| `h` | number | No** | Height (for containers) |

*Required for top-level nodes; optional for child nodes (auto-layout)
**Required for container nodes (VPC, Subnet, VNet)

### Edge Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | Yes | Unique edge identifier |
| `from` | string | Yes | Source node id |
| `to` | string | Yes | Target node id |
| `label` | string | No | Connection label |
| `color` | string | No | Line color in HEX (`#RGB` or `#RRGGBB`). Default: `#666666` |

---

## Auto-Layout

Child nodes (with `parent`) can omit `layout` for automatic grid positioning.

**Grid Layout:**
```
+------------------------------------------+
|  [1]         [2]         [3]             |
|  (60,60)     (220,60)    (380,60)        |
|                                          |
|  [4]         [5]         [6]             |
|  (60,200)    (220,200)   (380,200)       |
+------------------------------------------+
```

**Rules:**
- 3 columns per row
- 60px padding from parent edge
- 160px horizontal spacing, 140px vertical spacing
- Explicit `x`/`y` overrides auto-positioning
- Cannot specify only `x` or only `y` (both or neither)

**Example:**
```yaml
nodes:
  - id: vpc
    provider: aws
    kind: network.vpc
    layout: { x: 0, y: 0, w: 800, h: 600 }  # Container: explicit

  - id: ec2_1
    provider: aws
    kind: compute.ec2
    parent: vpc
    # No layout - auto: (60, 60)

  - id: ec2_2
    provider: aws
    kind: compute.ec2
    parent: vpc
    # No layout - auto: (220, 60)

  - id: rds
    provider: aws
    kind: database.rds
    parent: vpc
    layout: { x: 500, y: 300 }  # Explicit override
```

---

## Providers & Kinds

### AWS (`provider: aws`)

**Containers** (require `w` and `h`):
| Kind | Description |
|------|-------------|
| `network.vpc` | Virtual Private Cloud |
| `network.subnet` | Subnet |

**Common Resources:**
| Category | Kind | Description |
|----------|------|-------------|
| Compute | `compute.ec2` | EC2 Instance |
| Compute | `compute.lambda` | Lambda Function |
| Compute | `compute.lb.alb` | Application Load Balancer |
| Compute | `compute.lb.nlb` | Network Load Balancer |
| Compute | `compute.container.ecs` | ECS Cluster |
| Compute | `compute.container.ecs_service` | ECS Service |
| Compute | `compute.container.eks` | EKS Cluster |
| Compute | `compute.container.fargate` | Fargate |
| Compute | `compute.apprunner` | App Runner |
| Database | `database.rds` | RDS Database |
| Database | `database.aurora` | Aurora |
| Database | `database.dynamodb` | DynamoDB Table |
| Database | `database.elasticache` | ElastiCache |
| Database | `database.redshift` | Redshift |
| Storage | `storage.s3` | S3 Bucket |
| Storage | `storage.efs` | EFS File System |
| Storage | `storage.ebs` | EBS Volume |
| Network | `network.cloudfront` | CloudFront CDN |
| Network | `network.route53` | Route 53 DNS |
| Network | `network.apigateway` | API Gateway |
| Network | `network.igw` | Internet Gateway |
| Network | `network.natgateway` | NAT Gateway |
| Integration | `integration.sqs` | SQS Queue |
| Integration | `integration.sns` | SNS Topic |
| Integration | `integration.eventbridge` | EventBridge |
| Integration | `integration.stepfunctions` | Step Functions |
| Security | `security.iam` | IAM |
| Security | `security.cognito` | Cognito |
| Security | `security.secretsmanager` | Secrets Manager |
| Security | `security.kms` | KMS |

### GCP (`provider: gcp`)

**Containers** (require `w` and `h`):
| Kind | Description |
|------|-------------|
| `network.vpc` | Virtual Private Cloud |

**Common Resources:**
| Category | Kind | Description |
|----------|------|-------------|
| Compute | `compute.gce` | Compute Engine |
| Compute | `compute.functions` | Cloud Functions |
| Compute | `compute.cloudrun` | Cloud Run |
| Compute | `compute.container.gke` | GKE Cluster |
| Compute | `compute.appengine` | App Engine |
| Compute | `compute.lb` | Cloud Load Balancing |
| Database | `database.cloudsql` | Cloud SQL |
| Database | `database.spanner` | Cloud Spanner |
| Database | `database.bigtable` | Cloud Bigtable |
| Database | `database.firestore` | Firestore |
| Database | `database.memorystore` | Memorystore |
| Storage | `storage.gcs` | Cloud Storage |
| Storage | `storage.filestore` | Filestore |
| Network | `network.cdn` | Cloud CDN |
| Network | `network.dns` | Cloud DNS |
| Network | `network.armor` | Cloud Armor |
| Network | `network.apigateway` | API Gateway |
| Integration | `integration.pubsub` | Cloud Pub/Sub |
| Integration | `integration.tasks` | Cloud Tasks |
| Integration | `integration.workflows` | Workflows |
| Security | `security.iam` | Cloud IAM |
| Security | `security.kms` | Cloud KMS |
| Security | `security.secretmanager` | Secret Manager |

### Azure (`provider: azure`)

**Containers** (require `w` and `h`):
| Kind | Description |
|------|-------------|
| `network.vnet` | Virtual Network |

**Common Resources:**
| Category | Kind | Description |
|----------|------|-------------|
| Compute | `compute.vm` | Virtual Machine |
| Compute | `compute.functions` | Azure Functions |
| Compute | `compute.container.aci` | Container Instances |
| Compute | `compute.container.aks` | Azure Kubernetes Service |
| Compute | `compute.appservice` | App Service |
| Compute | `compute.lb` | Load Balancer |
| Compute | `compute.lb.appgw` | Application Gateway |
| Database | `database.sql` | SQL Database |
| Database | `database.cosmosdb` | Cosmos DB |
| Database | `database.mysql` | Azure Database for MySQL |
| Database | `database.postgresql` | Azure Database for PostgreSQL |
| Database | `database.redis` | Azure Cache for Redis |
| Storage | `storage.storage` | Storage Account |
| Storage | `storage.blob` | Blob Storage |
| Storage | `storage.files` | File Storage |
| Storage | `storage.datalake` | Data Lake Storage |
| Network | `network.frontdoor` | Azure Front Door |
| Network | `network.cdn` | Azure CDN |
| Network | `network.dns` | Azure DNS |
| Network | `network.firewall` | Azure Firewall |
| Network | `network.apim` | API Management |
| Integration | `integration.servicebus` | Service Bus |
| Integration | `integration.eventhubs` | Event Hubs |
| Integration | `integration.eventgrid` | Event Grid |
| Integration | `integration.logicapps` | Logic Apps |
| Security | `security.aad` | Azure Active Directory |
| Security | `security.keyvault` | Key Vault |
| Security | `security.defender` | Microsoft Defender |

### Custom Kinds

Any string is accepted as a `kind`. Icons fall back through the hierarchy:
- `compute.lb.alb` tries: exact match -> `compute.lb` -> `compute`

```yaml
- id: custom
  provider: custom
  kind: my.custom.resource
  label: "Custom Resource"
  layout: { x: 0, y: 0 }
```

---

## Custom Icons

Define custom icons when using FigJam Free Plan or needing icons not in the default set.

### Inline Definition

```yaml
version: 1
docId: "my-diagram"
icons:
  aws:
    "compute.ec2": "./icons/server.png"
    "database.rds": "./icons/database.png"
  gcp:
    "compute.gce": "./icons/vm.png"
nodes:
  # ...
```

### External Icons File (figram-icons.yaml)

Create `figram-icons.yaml` in the same directory as your diagram:

```yaml
version: 1
icons:
  aws:
    "compute.ec2": "./icons/server.png"
    "database": "./icons/db-generic.png"
```

The CLI automatically discovers this file.

### Hierarchical Fallback

Define parent kinds as fallbacks:

```yaml
icons:
  aws:
    "compute": "./icons/compute-generic.png"      # Fallback for all compute.*
    "compute.ec2": "./icons/ec2-specific.png"     # Specific override
```

### Supported Formats

- PNG, JPG, JPEG, GIF, WebP
- **SVG is NOT supported** by FigJam

---

## Edge Styling

### Color Format

- Full HEX: `#RRGGBB` (e.g., `#FF5733`)
- Shorthand: `#RGB` (e.g., `#F53` expands to `#FF5533`)
- Default: `#666666` (gray)

### Color Conventions

| Color | HEX | Use For |
|-------|-----|---------|
| Blue | `#3498DB` | HTTP/HTTPS traffic |
| Green | `#27AE60` | Database connections |
| Orange | `#E67E22` | Cache/Redis |
| Red | `#E74C3C` | Critical/Replication |
| Purple | `#9B59B6` | Container/Image pulls |
| Gray | `#666666` | Default/General |

```yaml
edges:
  - id: http
    from: alb
    to: ecs
    label: "HTTP:80"
    color: "#3498DB"

  - id: db
    from: ecs
    to: rds
    label: "PostgreSQL:5432"
    color: "#27AE60"
```

---

## Examples

### AWS: Serverless API

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

### GCP: Cloud Run + Pub/Sub

```yaml
version: 1
docId: gcp-cloudrun
title: "Event-Driven Cloud Run"

nodes:
  - id: pubsub
    provider: gcp
    kind: integration.pubsub
    label: "Events Topic"
    layout: { x: 100, y: 150 }

  - id: cloudrun
    provider: gcp
    kind: compute.cloudrun
    label: "Event Handler"
    layout: { x: 300, y: 150 }

  - id: firestore
    provider: gcp
    kind: database.firestore
    label: "Events Store"
    layout: { x: 500, y: 150 }

edges:
  - id: pubsub-to-run
    from: pubsub
    to: cloudrun
    label: "push"
    color: "#9B59B6"

  - id: run-to-db
    from: cloudrun
    to: firestore
    label: "store"
    color: "#27AE60"
```

### Azure: App Service Architecture

```yaml
version: 1
docId: azure-appservice
title: "Azure Web App"

nodes:
  - id: frontdoor
    provider: azure
    kind: network.frontdoor
    label: "Front Door"
    layout: { x: 100, y: 150 }

  - id: appservice
    provider: azure
    kind: compute.appservice
    label: "Web App"
    layout: { x: 300, y: 150 }

  - id: cosmosdb
    provider: azure
    kind: database.cosmosdb
    label: "Cosmos DB"
    layout: { x: 500, y: 150 }

edges:
  - id: fd-to-app
    from: frontdoor
    to: appservice
    label: "HTTPS"
    color: "#3498DB"

  - id: app-to-cosmos
    from: appservice
    to: cosmosdb
    label: "API"
    color: "#27AE60"
```

### VPC with Nested Resources

```yaml
version: 1
docId: vpc-nested
title: "VPC Architecture"

nodes:
  - id: vpc
    provider: aws
    kind: network.vpc
    label: "Production VPC"
    layout: { x: 0, y: 0, w: 700, h: 400 }

  - id: subnet-public
    provider: aws
    kind: network.subnet
    label: "Public Subnet"
    parent: vpc
    layout: { x: 40, y: 60, w: 280, h: 280 }

  - id: subnet-private
    provider: aws
    kind: network.subnet
    label: "Private Subnet"
    parent: vpc
    layout: { x: 380, y: 60, w: 280, h: 280 }

  - id: alb
    provider: aws
    kind: compute.lb.alb
    label: "ALB"
    parent: subnet-public
    # Auto-layout: (60, 60)

  - id: ecs
    provider: aws
    kind: compute.container.ecs_service
    label: "ECS Service"
    parent: subnet-private
    # Auto-layout: (60, 60)

  - id: rds
    provider: aws
    kind: database.rds
    label: "RDS"
    parent: subnet-private
    # Auto-layout: (220, 60)

edges:
  - id: alb-to-ecs
    from: alb
    to: ecs
    label: "HTTP:80"

  - id: ecs-to-rds
    from: ecs
    to: rds
    label: "PostgreSQL"
```

---

## Common Patterns

### 3-Tier Architecture

```yaml
nodes:
  - id: vpc
    provider: aws
    kind: network.vpc
    layout: { x: 0, y: 0, w: 600, h: 400 }

  - id: alb
    provider: aws
    kind: compute.lb.alb
    label: "Web Tier"
    parent: vpc

  - id: ecs
    provider: aws
    kind: compute.container.ecs_service
    label: "App Tier"
    parent: vpc

  - id: rds
    provider: aws
    kind: database.rds
    label: "Data Tier"
    parent: vpc

edges:
  - id: web-to-app
    from: alb
    to: ecs
  - id: app-to-data
    from: ecs
    to: rds
```

### Microservices Pattern

```yaml
nodes:
  - id: gateway
    provider: aws
    kind: network.apigateway
    layout: { x: 0, y: 200 }

  - id: svc-users
    provider: aws
    kind: compute.lambda
    label: "Users Service"
    layout: { x: 200, y: 100 }

  - id: svc-orders
    provider: aws
    kind: compute.lambda
    label: "Orders Service"
    layout: { x: 200, y: 300 }

  - id: queue
    provider: aws
    kind: integration.sqs
    label: "Event Queue"
    layout: { x: 400, y: 200 }

edges:
  - id: gw-to-users
    from: gateway
    to: svc-users
  - id: gw-to-orders
    from: gateway
    to: svc-orders
  - id: users-to-queue
    from: svc-users
    to: queue
  - id: orders-to-queue
    from: svc-orders
    to: queue
```

---

## Validation & Commands

### Build (Validate)

```bash
# Validate and output JSON
npx figram build diagram.yaml

# Specify output file
npx figram build diagram.yaml -o output.json
```

### Serve (Live Sync)

```bash
# Start WebSocket server (default: localhost:3456)
npx figram serve diagram.yaml

# Custom port
npx figram serve diagram.yaml -p 8080

# With custom icons
npx figram serve diagram.yaml --icons figram-icons.yaml
```

---

## Troubleshooting

### Common Errors

**Missing required field:**
```
Error: Missing required field "version"
Error: Missing required field "docId"
```
Ensure `version` and `docId` are at the document root.

**Duplicate ID:**
```
Error: Duplicate node id: "my-node"
```
Each node and edge must have a unique `id`.

**Missing layout for top-level node:**
```
Error: layout is required for top-level nodes
Error: layout.x is required for top-level nodes
```
Top-level nodes (without `parent`) must have `layout` with `x` and `y`.

**Partial coordinates:**
```
Error: layout.x and layout.y must be both specified or both omitted
```
Provide both `x` and `y`, or omit both for auto-layout.

**Invalid parent reference:**
```
Error: Node "child" references unknown parent: "missing-vpc"
```
Ensure `parent` references an existing container node.

**Missing edge target:**
```
Error: Edge references unknown node: "missing-id"
```
Ensure `from` and `to` reference existing node IDs.

**Cycle detected:**
```
Error: Cycle detected in parent hierarchy
```
Parent relationships cannot form cycles.

**YAML syntax error:**
```
Error: YAML parse error at line 5
```
Check indentation (2 spaces) and proper quoting.

---

## Best Practices

1. **Use descriptive IDs:** `user-api` not `n1`
2. **Labels for clarity:** Include context like ports or regions
3. **Nest appropriately:** Use `parent` for VPC/Subnet hierarchy
4. **Group edges:** Comment or order edges by connection type
5. **Consistent layout:** Align related resources
6. **Use auto-layout:** For child nodes when possible
7. **Color-code edges:** Follow conventions for readability
