---
title: YAML Specs
description: YAML DSL specification for defining architecture diagrams
---

This document describes the YAML DSL (Domain Specific Language) for defining architecture diagrams.

## Document Structure

```yaml
version: 1
docId: "unique-identifier"
title: "Diagram Title"

nodes:
  - id: node1
    provider: aws
    kind: network.vpc
    label: "My VPC"
    layout: { x: 0, y: 0, w: 800, h: 500 }

edges:
  - id: edge1
    from: node1
    to: node2
    label: "Connection"
```

## Top-Level Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `version` | number | Yes | Schema version (currently `1`) |
| `docId` | string | Yes | Unique document identifier (used for WebSocket matching) |
| `title` | string | No | Document title (defaults to `docId`) |
| `nodes` | array | Yes | List of node definitions |
| `edges` | array | No | List of edge definitions |
| `icons` | object | No | Custom icon mappings (see [Custom Icons](#custom-icons)) |

## Nodes

Nodes represent resources in your architecture diagram.

### Node Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | Yes | Unique node identifier |
| `provider` | string | Yes | Cloud provider (e.g., `aws`, `gcp`, `azure`) |
| `kind` | string | Yes | Resource type (e.g., `network.vpc`, `compute.lb.alb`) |
| `label` | string | No | Display label (defaults to `id`) |
| `parent` | string | No | Parent node id for nesting |
| `layout` | object | Yes | Position and size |

### Layout Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `layout` | object | Conditional* | Position and size |
| `layout.x` | number | Conditional* | X position (pixels) |
| `layout.y` | number | Conditional* | Y position (pixels) |
| `layout.w` | number | No** | Width (pixels) |
| `layout.h` | number | No** | Height (pixels) |

*`layout`, `layout.x`, and `layout.y` are **required for top-level nodes** but **optional for child nodes** (nodes with `parent`). See [Auto-Layout](#auto-layout).

**`w` and `h` are optional for container nodes (VPC, Subnet, etc.). Defaults are applied when omitted.

### Auto-Layout

Child nodes (nodes with a `parent`) can omit `layout`, `layout.x`, and `layout.y`. When omitted, nodes are automatically positioned in a 3-column grid pattern within their parent.

**Rules:**

1. **Top-level nodes**: `layout` with `x` and `y` is required
2. **Child nodes (leaf)**: `layout` is optional; omit for auto-positioning
3. **Container nodes**: `w`/`h` are optional; defaults are used when omitted. `x`/`y` can be omitted for auto-positioning
4. **Partial coordinates**: Not allowed; specify both `x` and `y`, or neither

**Grid Layout:**

Auto-positioned nodes are arranged in a grid:
- 3 columns per row
- 60px padding from parent edge
- 160px horizontal spacing
- 140px vertical spacing

```
┌────────────────────────────────────────┐
│  [1]       [2]       [3]              │
│  (60,60)   (280,60)  (500,60)         │
│                                        │
│  [4]       [5]       [6]              │
│  (60,260)  (280,260) (500,260)        │
└────────────────────────────────────────┘
```

**Example:**

```yaml
nodes:
  # Container: requires explicit layout with w/h
  - id: vpc
    provider: aws
    kind: network.vpc
    label: "VPC"
    layout: { x: 0, y: 0, w: 800, h: 600 }

  # Container child: needs w/h, can auto-position x/y
  - id: subnet
    provider: aws
    kind: network.subnet
    label: "Private Subnet"
    parent: vpc
    layout: { w: 700, h: 500 }  # x/y auto: (40, 40)

  # Leaf nodes: can omit layout entirely
  - id: ec2_1
    provider: aws
    kind: compute.ec2
    label: "Web Server 1"
    parent: subnet
    # No layout - auto: (40, 40)

  - id: ec2_2
    provider: aws
    kind: compute.ec2
    label: "Web Server 2"
    parent: subnet
    # No layout - auto: (200, 40)

  - id: rds
    provider: aws
    kind: database.rds
    label: "Database"
    parent: subnet
    # No layout - auto: (360, 40)

  # Explicit positioning overrides auto-layout
  - id: lambda
    provider: aws
    kind: compute.lambda
    label: "Lambda"
    parent: subnet
    layout: { x: 500, y: 300 }  # Custom position
```

### Node Examples

**Simple Resource:**

```yaml
- id: alb
  provider: aws
  kind: compute.lb.alb
  label: "Application Load Balancer"
  layout: { x: 100, y: 100 }
```

**Container (VPC):**

```yaml
- id: vpc
  provider: aws
  kind: network.vpc
  label: "VPC 10.0.0.0/16"
  layout: { x: 0, y: 0, w: 800, h: 600 }
```

**Nested Node:**

```yaml
- id: ecs
  provider: aws
  kind: compute.container.ecs_service
  label: "ECS Service"
  parent: subnet_private
  layout: { x: 80, y: 120 }
```

## Edges

Edges represent connections between nodes.

### Edge Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | Yes | Unique edge identifier |
| `from` | string | Yes | Source node id |
| `to` | string | Yes | Target node id |
| `label` | string | No | Connection label (defaults to empty) |
| `color` | string | No | Line color in HEX format (`#RGB` or `#RRGGBB`). Defaults to `#666666` (gray) |

### Edge Examples

```yaml
edges:
  - id: alb_to_ecs
    from: alb
    to: ecs
    label: "HTTP:80"
    color: "#FF5733"  # Orange

  - id: ecs_to_rds
    from: ecs
    to: rds
    label: "PostgreSQL:5432"
    color: "#3498DB"  # Blue
```

### Edge Color

The `color` property allows you to customize the connector line color:

- **Format**: HEX color code with `#` prefix
- **Shorthand**: `#RGB` is expanded to `#RRGGBB` (e.g., `#F00` becomes `#FF0000`)
- **Default**: `#666666` (gray)
- **Case**: Both uppercase and lowercase are accepted

**Examples:**

```yaml
edges:
  # Full HEX format
  - id: e1
    from: a
    to: b
    color: "#FF5733"

  # Shorthand format
  - id: e2
    from: b
    to: c
    color: "#F53"

  # Lowercase
  - id: e3
    from: c
    to: d
    color: "#3498db"

  # No color (uses default gray)
  - id: e4
    from: d
    to: e
```

## Supported Providers

Figram supports multiple cloud providers:

| Provider | Description |
|----------|-------------|
| `aws` | Amazon Web Services |
| `gcp` | Google Cloud Platform |
| `azure` | Microsoft Azure |

## Supported Kinds

Each provider has its own set of supported kinds with corresponding icons.

### AWS (`provider: aws`)

#### Containers (require `w` and `h`)

| Kind | Description |
|------|-------------|
| `network.vpc` | Virtual Private Cloud |
| `network.subnet` | Subnet |

#### Compute Resources

| Kind | Description |
|------|-------------|
| `compute.ec2` | EC2 Instance |
| `compute.lambda` | Lambda Function |
| `compute.lb` | Elastic Load Balancing |
| `compute.lb.alb` | Application Load Balancer |
| `compute.lb.nlb` | Network Load Balancer |
| `compute.container.ecs` | ECS Cluster |
| `compute.container.ecs_service` | ECS Service |
| `compute.container.ecs_task` | ECS Task |
| `compute.container.eks` | EKS Cluster |
| `compute.container.fargate` | Fargate |
| `compute.apprunner` | App Runner |

#### Database Resources

| Kind | Description |
|------|-------------|
| `database.rds` | RDS Database |
| `database.aurora` | Aurora |
| `database.dynamodb` | DynamoDB Table |
| `database.elasticache` | ElastiCache |
| `database.neptune` | Neptune |
| `database.redshift` | Redshift |
| `database.documentdb` | DocumentDB |

#### Storage Resources

| Kind | Description |
|------|-------------|
| `storage.s3` | S3 Bucket |
| `storage.efs` | EFS File System |
| `storage.ebs` | EBS Volume |
| `storage.glacier` | S3 Glacier |

#### Networking

| Kind | Description |
|------|-------------|
| `network.cloudfront` | CloudFront |
| `network.route53` | Route 53 |
| `network.apigateway` | API Gateway |
| `network.igw` | Internet Gateway |
| `network.natgateway` | NAT Gateway |
| `network.transitgateway` | Transit Gateway |

#### Integration

| Kind | Description |
|------|-------------|
| `integration.sqs` | SQS Queue |
| `integration.sns` | SNS Topic |
| `integration.eventbridge` | EventBridge |
| `integration.stepfunctions` | Step Functions |

#### Security

| Kind | Description |
|------|-------------|
| `security.iam` | IAM |
| `security.cognito` | Cognito |
| `security.secretsmanager` | Secrets Manager |
| `security.kms` | KMS |

### GCP (`provider: gcp`)

#### Containers (require `w` and `h`)

| Kind | Description |
|------|-------------|
| `network.vpc` | Virtual Private Cloud |

#### Compute Resources

| Kind | Description |
|------|-------------|
| `compute.gce` | Compute Engine |
| `compute.functions` | Cloud Functions |
| `compute.cloudrun` | Cloud Run |
| `compute.container.gke` | Google Kubernetes Engine |
| `compute.appengine` | App Engine |
| `compute.lb` | Cloud Load Balancing |

#### Database Resources

| Kind | Description |
|------|-------------|
| `database.cloudsql` | Cloud SQL |
| `database.spanner` | Cloud Spanner |
| `database.bigtable` | Cloud Bigtable |
| `database.firestore` | Firestore |
| `database.memorystore` | Memorystore |

#### Storage Resources

| Kind | Description |
|------|-------------|
| `storage.gcs` | Cloud Storage |
| `storage.filestore` | Filestore |

#### Networking

| Kind | Description |
|------|-------------|
| `network.cdn` | Cloud CDN |
| `network.dns` | Cloud DNS |
| `network.armor` | Cloud Armor |
| `network.nat` | Cloud NAT |
| `network.apigateway` | API Gateway |

#### Integration

| Kind | Description |
|------|-------------|
| `integration.pubsub` | Cloud Pub/Sub |
| `integration.tasks` | Cloud Tasks |
| `integration.workflows` | Workflows |

#### Security

| Kind | Description |
|------|-------------|
| `security.iam` | Cloud IAM |
| `security.kms` | Cloud KMS |
| `security.secretmanager` | Secret Manager |

### Azure (`provider: azure`)

#### Containers (require `w` and `h`)

| Kind | Description |
|------|-------------|
| `network.vnet` | Virtual Network |

#### Compute Resources

| Kind | Description |
|------|-------------|
| `compute.vm` | Virtual Machine |
| `compute.functions` | Azure Functions |
| `compute.container.aci` | Container Instances |
| `compute.container.aks` | Azure Kubernetes Service |
| `compute.appservice` | App Service |
| `compute.lb` | Load Balancer |
| `compute.lb.appgw` | Application Gateway |

#### Database Resources

| Kind | Description |
|------|-------------|
| `database.sql` | SQL Database |
| `database.cosmosdb` | Cosmos DB |
| `database.mysql` | Azure Database for MySQL |
| `database.postgresql` | Azure Database for PostgreSQL |
| `database.redis` | Azure Cache for Redis |

#### Storage Resources

| Kind | Description |
|------|-------------|
| `storage.storage` | Storage Account |
| `storage.blob` | Blob Storage |
| `storage.files` | File Storage |
| `storage.datalake` | Data Lake Storage |

#### Networking

| Kind | Description |
|------|-------------|
| `network.frontdoor` | Azure Front Door |
| `network.cdn` | Azure CDN |
| `network.dns` | Azure DNS |
| `network.firewall` | Azure Firewall |
| `network.apim` | API Management |

#### Integration

| Kind | Description |
|------|-------------|
| `integration.servicebus` | Service Bus |
| `integration.eventhubs` | Event Hubs |
| `integration.eventgrid` | Event Grid |
| `integration.logicapps` | Logic Apps |

#### Security

| Kind | Description |
|------|-------------|
| `security.aad` | Azure Active Directory |
| `security.keyvault` | Key Vault |
| `security.defender` | Microsoft Defender |

### Custom Kinds

Any string is accepted as a `kind`. Use dot notation for categorization:

```yaml
- id: custom
  provider: custom
  kind: my.custom.resource
  label: "Custom Resource"
  layout: { x: 0, y: 0 }
```

Icons fall back through the kind hierarchy. For example, `compute.lb.alb` will try:
1. `compute.lb.alb` (exact match)
2. `compute.lb` (parent)
3. `compute` (grandparent)

If no icon is found, a generic shape is rendered.

## Complete Example

```yaml
version: 1
docId: "prod-architecture"
title: "Production Architecture"

nodes:
  # VPC Container
  - id: vpc
    provider: aws
    kind: network.vpc
    label: "VPC 10.0.0.0/16"
    layout: { x: 0, y: 0, w: 960, h: 560 }

  # Public Subnet
  - id: subnet_public
    provider: aws
    kind: network.subnet
    label: "Public Subnet (ap-northeast-1a)"
    parent: vpc
    layout: { x: 40, y: 80, w: 420, h: 360 }

  # Private Subnet
  - id: subnet_private
    provider: aws
    kind: network.subnet
    label: "Private Subnet (ap-northeast-1a)"
    parent: vpc
    layout: { x: 500, y: 80, w: 420, h: 360 }

  # ALB in Public Subnet
  - id: alb
    provider: aws
    kind: compute.lb.alb
    label: "ALB"
    parent: subnet_public
    layout: { x: 80, y: 140 }

  # ECS in Private Subnet
  - id: ecs
    provider: aws
    kind: compute.container.ecs_service
    label: "ECS Service"
    parent: subnet_private
    layout: { x: 80, y: 140 }

  # RDS in Private Subnet
  - id: rds
    provider: aws
    kind: database.rds
    label: "RDS PostgreSQL"
    parent: subnet_private
    layout: { x: 80, y: 280 }

edges:
  - id: alb_to_ecs
    from: alb
    to: ecs
    label: "HTTP:80"

  - id: ecs_to_rds
    from: ecs
    to: rds
    label: "PostgreSQL:5432"
```

## Validation Rules

### ID Uniqueness

All node and edge IDs must be unique within the document:

```yaml
# Invalid: duplicate id
nodes:
  - id: server
    # ...
  - id: server  # Error: duplicate node id
    # ...
```

### Parent Reference

The `parent` field must reference an existing node:

```yaml
# Invalid: parent doesn't exist
nodes:
  - id: ecs
    parent: nonexistent  # Error: parent 'nonexistent' does not exist
    # ...
```

### Cycle Detection

Parent relationships cannot form cycles:

```yaml
# Invalid: cycle detected
nodes:
  - id: a
    parent: b
    # ...
  - id: b
    parent: a  # Error: cycle detected
    # ...
```

### Edge References

Edge `from` and `to` must reference existing nodes:

```yaml
# Invalid: node doesn't exist
edges:
  - id: e1
    from: alb
    to: nonexistent  # Error: to 'nonexistent' does not exist
```

## Custom Icons

You can define custom icons for nodes directly in your diagram file or in a separate `figram-icons.yaml` file.

### Inline Icons

Add icons to your diagram file:

```yaml
version: 1
docId: "prod"
icons:
  aws:
    "compute.ec2": "./icons/ec2.png"
    "database.rds": "./icons/rds.png"
  gcp:
    "compute.gce": "./icons/gce.png"
nodes:
  - id: web
    provider: aws
    kind: compute.ec2
    # ...
```

### Icons Structure

| Property | Type | Description |
|----------|------|-------------|
| `icons` | object | Provider-keyed icon mappings |
| `icons.<provider>` | object | Kind-to-path mappings for a provider |
| `icons.<provider>.<kind>` | string | Path to icon file (relative or absolute) |

### Separate Icons File (figram-icons.yaml)

Create a separate icons configuration file:

```yaml
version: 1
icons:
  aws:
    "compute.ec2": "./icons/ec2.png"
    "compute.lambda": "./icons/lambda.png"
    "database.rds": "./icons/rds.png"
```

The CLI automatically discovers `figram-icons.yaml` in the same directory as your diagram file.

### Path Resolution

- **Relative paths**: Resolved from the YAML file location
- **Absolute paths**: Used as-is
- **Supported formats**: PNG, JPG, JPEG, GIF, WebP

### Hierarchical Fallback

Icons use hierarchical matching. Define a parent kind icon to cover all children:

```yaml
icons:
  aws:
    "compute": "./icons/compute-generic.png"      # Fallback for all compute.*
    "compute.ec2": "./icons/ec2.png"              # Specific for EC2
```

With this configuration:
- `compute.ec2` uses `ec2.png`
- `compute.lambda` uses `compute-generic.png` (falls back to parent)
- `compute.container.ecs` uses `compute-generic.png` (falls back to grandparent)

## Best Practices

### 1. Use Descriptive IDs

```yaml
# Good
- id: vpc_production
- id: subnet_public_a
- id: alb_web

# Avoid
- id: n1
- id: n2
```

### 2. Organize with Consistent Layout

Position nested nodes relative to their parent:

```yaml
- id: vpc
  layout: { x: 0, y: 0, w: 800, h: 500 }

- id: subnet
  parent: vpc
  layout: { x: 40, y: 60, w: 360, h: 380 }  # Offset from parent

- id: alb
  parent: subnet
  layout: { x: 80, y: 120 }  # Offset from subnet
```

### 3. Use Meaningful Labels

```yaml
# Good
- id: alb
  label: "ALB (internet-facing)"

# Also good: omit label if id is descriptive enough
- id: "Application Load Balancer"
  # label defaults to id
```

### 4. Group Related Edges

```yaml
edges:
  # Web tier connections
  - id: client_to_alb
    from: client
    to: alb

  - id: alb_to_ecs
    from: alb
    to: ecs

  # Data tier connections
  - id: ecs_to_rds
    from: ecs
    to: rds

  - id: ecs_to_cache
    from: ecs
    to: elasticache
```
