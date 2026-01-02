---
name: aws-icon-finder
description: Search for AWS service icons and prepare them for addition to the plugin.
---

# AWS Icon Finder

Find and prepare AWS Architecture Icons for the Figram plugin.

## Task

1. Identify the AWS service from user input
2. Find the official icon
3. Provide download/integration instructions

## AWS Architecture Icons

Official source: https://aws.amazon.com/architecture/icons/

### Icon Categories

| Category | Services |
|----------|----------|
| Compute | Lambda, EC2, ECS, EKS, Fargate, Batch |
| Storage | S3, EBS, EFS, FSx, Storage Gateway |
| Database | DynamoDB, RDS, Aurora, ElastiCache, Neptune, Redshift |
| Networking | VPC, CloudFront, Route 53, API Gateway, ELB, Direct Connect |
| Integration | SNS, SQS, EventBridge, Step Functions, AppSync |
| Security | IAM, Cognito, KMS, WAF, Shield, Secrets Manager |
| Analytics | Kinesis, Athena, EMR, Glue, QuickSight |
| ML | SageMaker, Rekognition, Comprehend, Lex |

## Icon Specifications

- Format: SVG preferred (scalable)
- Size: 48x48 or 64x64 recommended
- Style: Use "Resource" icons (colored) not "Service" icons

## Output Format

```
## AWS Icon: <Service Name>

### Service Info
- Full name: <AWS Full Service Name>
- Category: <Category>
- Common use: <Brief description>

### Icon Details
- Recommended icon: Resource icon (48x48)
- Download URL: <if available>
- Asset pack: AWS Architecture Icons (download from AWS)

### Integration Steps

1. Save SVG to: `packages/plugin/src/icons/<service>.svg`

2. Add export to `packages/plugin/src/icons/index.ts`:
   ```typescript
   export { default as <serviceName> } from "./<service>.svg";
   ```

3. Add node type to `packages/core/src/types.ts`:
   ```typescript
   export type NodeType = ... | "<serviceName>";
   ```

4. Update renderer in `packages/plugin/src/code.ts`

5. Rebuild: `cd packages/plugin && bun run build`

### Naming Convention
- File: `<service-name>.svg` (kebab-case)
- Export: `<serviceName>` (camelCase)
- Type: `"<serviceName>"` (camelCase string)
```

## Usage

Provide an AWS service name (e.g., "Lambda", "DynamoDB", "API Gateway") to get icon integration instructions.
