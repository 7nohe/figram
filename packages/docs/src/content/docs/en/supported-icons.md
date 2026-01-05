---
title: Supported Icons
description: Overview of cloud service icons supported by Figram
---

Figram supports **1,725 cloud service icons** out of the box across three major cloud providers.

## Provider Pages

| Provider | Icons | Description |
|----------|-------|-------------|
| [AWS](./icons-aws/) | 873 | Amazon Web Services icons organized by category |
| [Azure](./icons-azure/) | 636 | Microsoft Azure service icons |
| [GCP](./icons-gcp/) | 216 | Google Cloud Platform icons organized by category |

## Usage

Use these icons by specifying `provider` and `kind` values in your YAML:

```yaml
nodes:
  - id: my-ec2
    provider: aws      # aws, azure, or gcp
    kind: compute.ec2  # Use the kind value from each provider's page
    label: "Web Server"
```

### Provider Values

| Provider | Value |
|----------|-------|
| Amazon Web Services | `aws` |
| Microsoft Azure | `azure` |
| Google Cloud Platform | `gcp` |

## Icon Naming Conventions

### AWS & GCP
Icons use hierarchical naming with categories:
```
category.service
category.service.variant
```

Examples:
- `compute.ec2` - Amazon EC2
- `database.rds` - Amazon RDS
- `container.gke` - Google Kubernetes Engine

### Azure
Icons use flat naming without category prefixes:
```
service_name
```

Examples:
- `virtual_machine` - Virtual Machine
- `storage_account` - Storage Account
- `app_service` - App Service
