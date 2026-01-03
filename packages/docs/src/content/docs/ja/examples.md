---
title: サンプル集
description: 実践的なアーキテクチャダイアグラムのパターン
---

よくあるアーキテクチャパターンの実践的なYAMLサンプルです。

## 基本的なWebアプリケーション

ALB、ECS、RDSを使用したシンプルな3層アーキテクチャ。

```yaml
version: 1
docId: "web-app"
title: "Basic Web Application"

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

  - id: subnet_private
    provider: aws
    kind: network.subnet
    label: "Private Subnet"
    parent: vpc
    layout: { x: 420, y: 60, w: 360, h: 380 }

  - id: alb
    provider: aws
    kind: compute.lb.alb
    label: "ALB"
    parent: subnet_public
    layout: { x: 100, y: 120 }

  - id: ecs
    provider: aws
    kind: compute.container.ecs_service
    label: "ECS Service"
    parent: subnet_private
    layout: { x: 100, y: 120 }

  - id: rds
    provider: aws
    kind: database.rds
    label: "RDS PostgreSQL"
    parent: subnet_private
    layout: { x: 100, y: 260 }

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

## サーバーレスAPI

API Gateway、Lambda、DynamoDBを使用したサーバーレス構成。

```yaml
version: 1
docId: "serverless-api"
title: "Serverless API"

nodes:
  - id: apigw
    provider: aws
    kind: network.apigateway
    label: "API Gateway"
    layout: { x: 0, y: 100 }

  - id: lambda_api
    provider: aws
    kind: compute.lambda
    label: "API Handler"
    layout: { x: 400, y: 100 }

  - id: dynamodb
    provider: aws
    kind: database.dynamodb
    label: "DynamoDB"
    layout: { x: 600, y: 100 }

  - id: s3
    provider: aws
    kind: storage.s3
    label: "S3 Bucket"
    layout: { x: 600, y: 450 }

  - id: sqs
    provider: aws
    kind: integration.sqs
    label: "SQS Queue"
    layout: { x: 600, y: 250 }

  - id: lambda_worker
    provider: aws
    kind: compute.lambda
    label: "Worker Lambda"
    layout: { x: 0, y: 250 }

edges:
  - id: apigw_to_lambda
    from: apigw
    to: lambda_api
    label: "REST"

  - id: lambda_to_dynamo
    from: lambda_api
    to: dynamodb
    label: "Query"

  - id: lambda_to_sqs
    from: lambda_api
    to: sqs
    label: "Publish"

  - id: sqs_to_worker
    from: sqs
    to: lambda_worker
    label: "Trigger"

  - id: worker_to_s3
    from: lambda_worker
    to: s3
    label: "Upload"
```

## マイクロサービス（自動レイアウト）

自動レイアウトを使って配置を簡略化。`layout`を省略した子ノードは自動的に配置されます。

```yaml
version: 1
docId: "microservices"
title: "Microservices Architecture"

nodes:
  - id: vpc
    provider: aws
    kind: network.vpc
    label: "VPC"
    layout: { x: 0, y: 0, w: 900, h: 600 }

  - id: subnet
    provider: aws
    kind: network.subnet
    label: "Private Subnet"
    parent: vpc
    layout: { w: 820, h: 520 }  # x/y auto-positioned

  # These nodes are auto-positioned in a 3-column grid
  - id: user_service
    provider: aws
    kind: compute.container.ecs_service
    label: "User Service"
    parent: subnet

  - id: order_service
    provider: aws
    kind: compute.container.ecs_service
    label: "Order Service"
    parent: subnet
    layout: { x: 400, y: 200 }

  - id: payment_service
    provider: aws
    kind: compute.container.ecs_service
    label: "Payment Service"
    parent: subnet

  - id: notification_service
    provider: aws
    kind: compute.container.ecs_service
    label: "Notification Service"
    parent: subnet
    layout: { x: 600, y: 300 }

  - id: user_db
    provider: aws
    kind: database.rds
    label: "User DB"
    parent: subnet
    layout: { x: 100, y: 200 }

  - id: order_db
    provider: aws
    kind: database.rds
    label: "Order DB"
    parent: subnet
    layout: { x: 100, y: 400 }

edges:
  - id: user_to_db
    from: user_service
    to: user_db

  - id: order_to_db
    from: order_service
    to: order_db

  - id: order_to_payment
    from: order_service
    to: payment_service
    label: "Process Payment"

  - id: order_to_notification
    from: order_service
    to: notification_service
    label: "Send Notification"
```

## マルチAZ本番環境

複数のアベイラビリティゾーンを使用した高可用性構成。

```yaml
version: 1
docId: "multi-az"
title: "Multi-AZ Production"

nodes:
  - id: vpc
    provider: aws
    kind: network.vpc
    label: "VPC 10.0.0.0/16"
    layout: { x: 0, y: 0, w: 900, h: 700 }

  # AZ-A
  - id: subnet_a
    provider: aws
    kind: network.subnet
    label: "Private Subnet AZ-A"
    parent: vpc
    layout: { x: 40, y: 60, w: 400, h: 580 }

  # AZ-C
  - id: subnet_c
    provider: aws
    kind: network.subnet
    label: "Private Subnet AZ-C"
    parent: vpc
    layout: { x: 460, y: 60, w: 400, h: 580 }

  # AZ-A Resources
  - id: ecs_a
    provider: aws
    kind: compute.container.ecs_service
    label: "ECS Service AZ-A"
    parent: subnet_a
    layout: { x: 180, y: 80 }

  - id: rds_primary
    provider: aws
    kind: database.rds
    label: "RDS Primary"
    parent: subnet_a
    layout: { x: 260, y: 280 }

  - id: elasticache_a
    provider: aws
    kind: database.elasticache
    label: "Redis AZ-A"
    parent: subnet_a
    layout: { x: 60, y: 220 }

  # AZ-C Resources
  - id: ecs_c
    provider: aws
    kind: compute.container.ecs_service
    label: "ECS Service AZ-C"
    parent: subnet_c
    layout: { x: 120, y: 80 }

  - id: rds_standby
    provider: aws
    kind: database.rds
    label: "RDS Standby"
    parent: subnet_c
    layout: { x: 120, y: 380 }

  - id: elasticache_c
    provider: aws
    kind: database.elasticache
    label: "Redis AZ-C"
    parent: subnet_c
    layout: { x: 220, y: 220 }

  # External
  - id: alb
    provider: aws
    kind: compute.lb.alb
    label: "Application Load Balancer"
    layout: { x: 350, y: -120 }

edges:
  - id: alb_to_ecs_a
    from: alb
    to: ecs_a
    color: "#3498DB"

  - id: alb_to_ecs_c
    from: alb
    to: ecs_c
    color: "#3498DB"

  - id: ecs_a_to_rds
    from: ecs_a
    to: rds_primary
    label: "Write"
    color: "#27AE60"

  - id: ecs_c_to_rds
    from: ecs_c
    to: rds_primary
    label: "Write"
    color: "#27AE60"

  - id: rds_replication
    from: rds_primary
    to: rds_standby
    label: "Replication"
    color: "#E74C3C"

  - id: ecs_a_to_cache
    from: ecs_a
    to: elasticache_a
    color: "#E67E22"

  - id: ecs_c_to_cache
    from: ecs_c
    to: elasticache_c
    color: "#E67E22"
```

## エッジの色分け

`color`を使って接続の種類を視覚的に区別できます。

```yaml
edges:
  # HTTPトラフィックは青
  - id: http_traffic
    from: alb
    to: ecs
    label: "HTTPS:443"
    color: "#3498DB"

  # データベースは緑
  - id: db_connection
    from: ecs
    to: rds
    label: "PostgreSQL"
    color: "#27AE60"

  # キャッシュはオレンジ
  - id: cache_connection
    from: ecs
    to: elasticache
    label: "Redis"
    color: "#E67E22"

  # 重要なパスは赤
  - id: replication
    from: rds_primary
    to: rds_standby
    label: "Sync"
    color: "#E74C3C"

  # バックグラウンド処理はグレー
  - id: logging
    from: ecs
    to: cloudwatch
    color: "#7F8C8D"
```

## Tips

### 分かりやすいIDを使う

```yaml
# 良い例
- id: vpc_production
- id: subnet_private_a
- id: rds_primary

# 避けるべき例
- id: n1
- id: n2
```

### 自動レイアウトを活用

子ノードの`layout`を省略するとグリッド配置されます：

```yaml
- id: service_1
  parent: subnet
  # layoutなし = 自動配置

- id: service_2
  parent: subnet
  # layoutなし = グリッドの次の位置
```

### レイヤーで整理

YAMLをレイヤーごとに論理的にグループ化：

```yaml
nodes:
  # ネットワーク層
  - id: vpc
  - id: subnet_public
  - id: subnet_private

  # コンピュート層
  - id: alb
  - id: ecs

  # データ層
  - id: rds
  - id: elasticache
```
