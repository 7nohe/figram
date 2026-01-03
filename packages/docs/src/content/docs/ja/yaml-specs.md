---
title: YAML仕様
description: アーキテクチャ図を定義するためのYAML DSL仕様
---

このドキュメントでは、アーキテクチャ図を定義するためのYAML DSL（ドメイン固有言語）について説明します。

## ドキュメント構造

```yaml
version: 1
docId: "unique-identifier"
title: "図のタイトル"

nodes:
  - id: node1
    provider: aws
    kind: network.vpc
    label: "マイVPC"
    layout: { x: 0, y: 0, w: 800, h: 500 }

edges:
  - id: edge1
    from: node1
    to: node2
    label: "接続"
```

## トップレベルプロパティ

| プロパティ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| `version` | number | はい | スキーマバージョン（現在は`1`） |
| `docId` | string | はい | 一意のドキュメント識別子（WebSocketマッチングに使用） |
| `title` | string | いいえ | ドキュメントタイトル（デフォルトは`docId`） |
| `nodes` | array | はい | ノード定義のリスト |
| `edges` | array | いいえ | エッジ定義のリスト |
| `icons` | object | いいえ | カスタムアイコンマッピング（[カスタムアイコン](#カスタムアイコン)を参照） |

## ノード

ノードはアーキテクチャ図のリソースを表します。

### ノードプロパティ

| プロパティ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| `id` | string | はい | 一意のノード識別子 |
| `provider` | string | はい | クラウドプロバイダー（例: `aws`, `gcp`, `azure`） |
| `kind` | string | はい | リソースタイプ（例: `network.vpc`, `compute.lb.alb`） |
| `label` | string | いいえ | 表示ラベル（デフォルトは`id`） |
| `parent` | string | いいえ | ネスト用の親ノードID |
| `layout` | object | はい | 位置とサイズ |

### レイアウトプロパティ

| プロパティ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| `layout` | object | 条件付き* | 位置とサイズ |
| `layout.x` | number | 条件付き* | X位置（ピクセル） |
| `layout.y` | number | 条件付き* | Y位置（ピクセル） |
| `layout.w` | number | いいえ** | 幅（ピクセル） |
| `layout.h` | number | いいえ** | 高さ（ピクセル） |

*`layout`、`layout.x`、`layout.y`は**トップレベルノードでは必須**ですが、**子ノード**（`parent`を持つノード）では**省略可能**です。[オートレイアウト](#オートレイアウト)を参照。

**`w`と`h`はコンテナノード（VPC、Subnetなど）では任意。省略時はデフォルトが適用されます。

### オートレイアウト

子ノード（`parent`を持つノード）は`layout`、`layout.x`、`layout.y`を省略できます。省略した場合、ノードは親内で3列のグリッドパターンで自動配置されます。

**ルール:**

1. **トップレベルノード**: `layout`に`x`と`y`が必須
2. **子ノード（リーフ）**: `layout`は省略可能。自動配置には省略
3. **コンテナノード**: `w`/`h`は任意。省略時はデフォルトを使用。`x`/`y`は自動配置のため省略可能
4. **部分的な座標**: 許可されません。`x`と`y`の両方を指定するか、両方を省略

**グリッドレイアウト:**

自動配置されるノードはグリッドで配置されます:
- 1行に3列
- 親エッジから60pxのパディング
- 160pxの水平間隔
- 140pxの垂直間隔

```
┌────────────────────────────────────────┐
│  [1]       [2]       [3]              │
│  (60,60)   (280,60)  (500,60)         │
│                                        │
│  [4]       [5]       [6]              │
│  (60,260)  (280,260) (500,260)        │
└────────────────────────────────────────┘
```

**例:**

```yaml
nodes:
  # コンテナ: w/hを含む明示的なlayoutが必要
  - id: vpc
    provider: aws
    kind: network.vpc
    label: "VPC"
    layout: { x: 0, y: 0, w: 800, h: 600 }

  # コンテナの子: w/hが必要、x/yは自動配置可能
  - id: subnet
    provider: aws
    kind: network.subnet
    label: "プライベートサブネット"
    parent: vpc
    layout: { w: 700, h: 500 }  # x/y自動: (40, 40)

  # リーフノード: layoutを完全に省略可能
  - id: ec2_1
    provider: aws
    kind: compute.ec2
    label: "Webサーバー1"
    parent: subnet
    # layout省略 - 自動: (40, 40)

  - id: ec2_2
    provider: aws
    kind: compute.ec2
    label: "Webサーバー2"
    parent: subnet
    # layout省略 - 自動: (200, 40)

  - id: rds
    provider: aws
    kind: database.rds
    label: "データベース"
    parent: subnet
    # layout省略 - 自動: (360, 40)

  # 明示的な配置はオートレイアウトを上書き
  - id: lambda
    provider: aws
    kind: compute.lambda
    label: "Lambda"
    parent: subnet
    layout: { x: 500, y: 300 }  # カスタム位置
```

### ノードの例

**シンプルなリソース:**

```yaml
- id: alb
  provider: aws
  kind: compute.lb.alb
  label: "Application Load Balancer"
  layout: { x: 100, y: 100 }
```

**コンテナ（VPC）:**

```yaml
- id: vpc
  provider: aws
  kind: network.vpc
  label: "VPC 10.0.0.0/16"
  layout: { x: 0, y: 0, w: 800, h: 600 }
```

**ネストされたノード:**

```yaml
- id: ecs
  provider: aws
  kind: compute.container.ecs_service
  label: "ECS Service"
  parent: subnet_private
  layout: { x: 80, y: 120 }
```

## エッジ

エッジはノード間の接続を表します。

### エッジプロパティ

| プロパティ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| `id` | string | はい | 一意のエッジ識別子 |
| `from` | string | はい | 接続元ノードID |
| `to` | string | はい | 接続先ノードID |
| `label` | string | いいえ | 接続ラベル（デフォルトは空） |
| `color` | string | いいえ | 線の色（HEX形式: `#RGB`または`#RRGGBB`）。デフォルトは`#666666`（グレー） |

### エッジの例

```yaml
edges:
  - id: alb_to_ecs
    from: alb
    to: ecs
    label: "HTTP:80"
    color: "#FF5733"  # オレンジ

  - id: ecs_to_rds
    from: ecs
    to: rds
    label: "PostgreSQL:5432"
    color: "#3498DB"  # ブルー
```

### エッジの色

`color`プロパティでコネクタの線の色をカスタマイズできます：

- **形式**: `#`プレフィックス付きのHEXカラーコード
- **短縮形**: `#RGB`は`#RRGGBB`に展開されます（例: `#F00`は`#FF0000`になる）
- **デフォルト**: `#666666`（グレー）
- **大文字小文字**: 大文字と小文字の両方を受け付けます

**例:**

```yaml
edges:
  # フルHEX形式
  - id: e1
    from: a
    to: b
    color: "#FF5733"

  # 短縮形式
  - id: e2
    from: b
    to: c
    color: "#F53"

  # 小文字
  - id: e3
    from: c
    to: d
    color: "#3498db"

  # 色指定なし（デフォルトのグレーを使用）
  - id: e4
    from: d
    to: e
```

## サポートされるプロバイダー

Figramは複数のクラウドプロバイダーをサポートしています：

| プロバイダー | 説明 |
|-------------|------|
| `aws` | Amazon Web Services |
| `gcp` | Google Cloud Platform |
| `azure` | Microsoft Azure |

## サポートされるKind

各プロバイダーには、対応するアイコンを持つ独自のKindセットがあります。

### AWS (`provider: aws`)

#### コンテナ（`w`と`h`が必要）

| Kind | 説明 |
|------|------|
| `network.vpc` | Virtual Private Cloud |
| `network.subnet` | サブネット |

#### コンピューティングリソース

| Kind | 説明 |
|------|------|
| `compute.ec2` | EC2インスタンス |
| `compute.lambda` | Lambda関数 |
| `compute.lb` | Elastic Load Balancing |
| `compute.lb.alb` | Application Load Balancer |
| `compute.lb.nlb` | Network Load Balancer |
| `compute.container.ecs` | ECSクラスター |
| `compute.container.ecs_service` | ECSサービス |
| `compute.container.ecs_task` | ECSタスク |
| `compute.container.eks` | EKSクラスター |
| `compute.container.fargate` | Fargate |
| `compute.apprunner` | App Runner |

#### データベースリソース

| Kind | 説明 |
|------|------|
| `database.rds` | RDSデータベース |
| `database.aurora` | Aurora |
| `database.dynamodb` | DynamoDBテーブル |
| `database.elasticache` | ElastiCache |
| `database.neptune` | Neptune |
| `database.redshift` | Redshift |
| `database.documentdb` | DocumentDB |

#### ストレージリソース

| Kind | 説明 |
|------|------|
| `storage.s3` | S3バケット |
| `storage.efs` | EFSファイルシステム |
| `storage.ebs` | EBSボリューム |
| `storage.glacier` | S3 Glacier |

#### ネットワーキング

| Kind | 説明 |
|------|------|
| `network.cloudfront` | CloudFront |
| `network.route53` | Route 53 |
| `network.apigateway` | API Gateway |
| `network.igw` | インターネットゲートウェイ |
| `network.natgateway` | NATゲートウェイ |
| `network.transitgateway` | Transit Gateway |

#### インテグレーション

| Kind | 説明 |
|------|------|
| `integration.sqs` | SQSキュー |
| `integration.sns` | SNSトピック |
| `integration.eventbridge` | EventBridge |
| `integration.stepfunctions` | Step Functions |

#### セキュリティ

| Kind | 説明 |
|------|------|
| `security.iam` | IAM |
| `security.cognito` | Cognito |
| `security.secretsmanager` | Secrets Manager |
| `security.kms` | KMS |

### GCP (`provider: gcp`)

#### コンテナ（`w`と`h`が必要）

| Kind | 説明 |
|------|------|
| `network.vpc` | Virtual Private Cloud |

#### コンピューティングリソース

| Kind | 説明 |
|------|------|
| `compute.gce` | Compute Engine |
| `compute.functions` | Cloud Functions |
| `compute.cloudrun` | Cloud Run |
| `compute.container.gke` | Google Kubernetes Engine |
| `compute.appengine` | App Engine |
| `compute.lb` | Cloud Load Balancing |

#### データベースリソース

| Kind | 説明 |
|------|------|
| `database.cloudsql` | Cloud SQL |
| `database.spanner` | Cloud Spanner |
| `database.bigtable` | Cloud Bigtable |
| `database.firestore` | Firestore |
| `database.memorystore` | Memorystore |

#### ストレージリソース

| Kind | 説明 |
|------|------|
| `storage.gcs` | Cloud Storage |
| `storage.filestore` | Filestore |

#### ネットワーキング

| Kind | 説明 |
|------|------|
| `network.cdn` | Cloud CDN |
| `network.dns` | Cloud DNS |
| `network.armor` | Cloud Armor |
| `network.nat` | Cloud NAT |
| `network.apigateway` | API Gateway |

#### インテグレーション

| Kind | 説明 |
|------|------|
| `integration.pubsub` | Cloud Pub/Sub |
| `integration.tasks` | Cloud Tasks |
| `integration.workflows` | Workflows |

#### セキュリティ

| Kind | 説明 |
|------|------|
| `security.iam` | Cloud IAM |
| `security.kms` | Cloud KMS |
| `security.secretmanager` | Secret Manager |

### Azure (`provider: azure`)

#### コンテナ（`w`と`h`が必要）

| Kind | 説明 |
|------|------|
| `network.vnet` | Virtual Network |

#### コンピューティングリソース

| Kind | 説明 |
|------|------|
| `compute.vm` | 仮想マシン |
| `compute.functions` | Azure Functions |
| `compute.container.aci` | Container Instances |
| `compute.container.aks` | Azure Kubernetes Service |
| `compute.appservice` | App Service |
| `compute.lb` | Load Balancer |
| `compute.lb.appgw` | Application Gateway |

#### データベースリソース

| Kind | 説明 |
|------|------|
| `database.sql` | SQL Database |
| `database.cosmosdb` | Cosmos DB |
| `database.mysql` | Azure Database for MySQL |
| `database.postgresql` | Azure Database for PostgreSQL |
| `database.redis` | Azure Cache for Redis |

#### ストレージリソース

| Kind | 説明 |
|------|------|
| `storage.storage` | ストレージアカウント |
| `storage.blob` | Blobストレージ |
| `storage.files` | ファイルストレージ |
| `storage.datalake` | Data Lake Storage |

#### ネットワーキング

| Kind | 説明 |
|------|------|
| `network.frontdoor` | Azure Front Door |
| `network.cdn` | Azure CDN |
| `network.dns` | Azure DNS |
| `network.firewall` | Azure Firewall |
| `network.apim` | API Management |

#### インテグレーション

| Kind | 説明 |
|------|------|
| `integration.servicebus` | Service Bus |
| `integration.eventhubs` | Event Hubs |
| `integration.eventgrid` | Event Grid |
| `integration.logicapps` | Logic Apps |

#### セキュリティ

| Kind | 説明 |
|------|------|
| `security.aad` | Azure Active Directory |
| `security.keyvault` | Key Vault |
| `security.defender` | Microsoft Defender |

### カスタムKind

任意の文字列が`kind`として受け入れられます。カテゴリ分けにはドット記法を使用：

```yaml
- id: custom
  provider: custom
  kind: my.custom.resource
  label: "カスタムリソース"
  layout: { x: 0, y: 0 }
```

アイコンはKind階層を通じてフォールバックします。例えば、`compute.lb.alb`は以下の順序で検索されます：
1. `compute.lb.alb`（完全一致）
2. `compute.lb`（親）
3. `compute`（祖父母）

アイコンが見つからない場合は、汎用的な形状がレンダリングされます。

## 完全な例

```yaml
version: 1
docId: "prod-architecture"
title: "本番環境アーキテクチャ"

nodes:
  # VPCコンテナ
  - id: vpc
    provider: aws
    kind: network.vpc
    label: "VPC 10.0.0.0/16"
    layout: { x: 0, y: 0, w: 960, h: 560 }

  # パブリックサブネット
  - id: subnet_public
    provider: aws
    kind: network.subnet
    label: "パブリックサブネット (ap-northeast-1a)"
    parent: vpc
    layout: { x: 40, y: 80, w: 420, h: 360 }

  # プライベートサブネット
  - id: subnet_private
    provider: aws
    kind: network.subnet
    label: "プライベートサブネット (ap-northeast-1a)"
    parent: vpc
    layout: { x: 500, y: 80, w: 420, h: 360 }

  # パブリックサブネット内のALB
  - id: alb
    provider: aws
    kind: compute.lb.alb
    label: "ALB"
    parent: subnet_public
    layout: { x: 80, y: 140 }

  # プライベートサブネット内のECS
  - id: ecs
    provider: aws
    kind: compute.container.ecs_service
    label: "ECSサービス"
    parent: subnet_private
    layout: { x: 80, y: 140 }

  # プライベートサブネット内のRDS
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

## バリデーションルール

### IDの一意性

すべてのノードとエッジのIDはドキュメント内で一意である必要があります：

```yaml
# 無効: 重複したID
nodes:
  - id: server
    # ...
  - id: server  # エラー: ノードIDが重複
    # ...
```

### 親参照

`parent`フィールドは存在するノードを参照する必要があります：

```yaml
# 無効: 親が存在しない
nodes:
  - id: ecs
    parent: nonexistent  # エラー: 親 'nonexistent' が存在しません
    # ...
```

### 循環検出

親関係は循環を形成できません：

```yaml
# 無効: 循環を検出
nodes:
  - id: a
    parent: b
    # ...
  - id: b
    parent: a  # エラー: 循環を検出
    # ...
```

### エッジ参照

エッジの`from`と`to`は存在するノードを参照する必要があります：

```yaml
# 無効: ノードが存在しない
edges:
  - id: e1
    from: alb
    to: nonexistent  # エラー: to 'nonexistent' が存在しません
```

## カスタムアイコン

ダイアグラムファイル内または別の`figram-icons.yaml`ファイルでカスタムアイコンを定義できます。

### インラインアイコン

ダイアグラムファイルにアイコンを追加：

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

### アイコン構造

| プロパティ | 型 | 説明 |
|-----------|------|------|
| `icons` | object | プロバイダーごとのアイコンマッピング |
| `icons.<provider>` | object | プロバイダーのkind-to-pathマッピング |
| `icons.<provider>.<kind>` | string | アイコンファイルへのパス（相対または絶対） |

### 別ファイル（figram-icons.yaml）

別のアイコン設定ファイルを作成：

```yaml
version: 1
icons:
  aws:
    "compute.ec2": "./icons/ec2.png"
    "compute.lambda": "./icons/lambda.png"
    "database.rds": "./icons/rds.png"
```

CLIはダイアグラムファイルと同じディレクトリにある`figram-icons.yaml`を自動的に検出します。

### パス解決

- **相対パス**: YAMLファイルの場所から解決
- **絶対パス**: そのまま使用
- **対応フォーマット**: PNG, JPG, JPEG, GIF, WebP

### 階層フォールバック

アイコンは階層的なマッチングを使用します。親kindのアイコンを定義すると、すべての子に適用されます：

```yaml
icons:
  aws:
    "compute": "./icons/compute-generic.png"      # すべてのcompute.*のフォールバック
    "compute.ec2": "./icons/ec2.png"              # EC2専用
```

この設定では：
- `compute.ec2`は`ec2.png`を使用
- `compute.lambda`は`compute-generic.png`を使用（親にフォールバック）
- `compute.container.ecs`は`compute-generic.png`を使用（祖父にフォールバック）

## ベストプラクティス

### 1. 説明的なIDを使用

```yaml
# 良い例
- id: vpc_production
- id: subnet_public_a
- id: alb_web

# 避けるべき例
- id: n1
- id: n2
```

### 2. 一貫したレイアウトで整理

ネストされたノードは親からの相対位置で配置：

```yaml
- id: vpc
  layout: { x: 0, y: 0, w: 800, h: 500 }

- id: subnet
  parent: vpc
  layout: { x: 40, y: 60, w: 360, h: 380 }  # 親からのオフセット

- id: alb
  parent: subnet
  layout: { x: 80, y: 120 }  # サブネットからのオフセット
```

### 3. 意味のあるラベルを使用

```yaml
# 良い例
- id: alb
  label: "ALB (インターネット向け)"

# これも良い: IDが説明的な場合はラベルを省略
- id: "Application Load Balancer"
  # labelはidがデフォルト
```

### 4. 関連するエッジをグループ化

```yaml
edges:
  # Webティア接続
  - id: client_to_alb
    from: client
    to: alb

  - id: alb_to_ecs
    from: alb
    to: ecs

  # データティア接続
  - id: ecs_to_rds
    from: ecs
    to: rds

  - id: ecs_to_cache
    from: ecs
    to: elasticache
```
