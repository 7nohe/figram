---
title: 対応アイコン
description: Figramがサポートするクラウドサービスアイコンの概要
---

Figramは **1,725種類のクラウドサービスアイコン** を3つの主要クラウドプロバイダー向けにサポートしています。

## プロバイダー別ページ

| プロバイダー | アイコン数 | 説明 |
|-------------|----------|------|
| [AWS](./icons-aws/) | 873 | カテゴリ別に整理されたAmazon Web Servicesアイコン |
| [Azure](./icons-azure/) | 636 | カテゴリ別に整理されたMicrosoft Azureサービスアイコン |
| [GCP](./icons-gcp/) | 216 | カテゴリ別に整理されたGoogle Cloud Platformアイコン |

## 使い方

YAMLで `provider` と `kind` の値を指定してアイコンを使用します。

```yaml
nodes:
  - id: my-ec2
    provider: aws      # aws, azure, gcp のいずれか
    kind: compute.ec2  # 各プロバイダーページのkind値を使用
    label: "Web Server"
```

### プロバイダー値

| プロバイダー | 値 |
|-------------|-----|
| Amazon Web Services | `aws` |
| Microsoft Azure | `azure` |
| Google Cloud Platform | `gcp` |

## アイコン命名規則

すべてのプロバイダーでカテゴリを含む階層的な命名を使用しています。

```
category.service_name
```

### AWS の例
- `compute.ec2` - Amazon EC2
- `database.rds` - Amazon RDS
- `networking.vpc` - Amazon VPC

### Azure の例
- `compute.virtual_machine` - 仮想マシン
- `storage.storage_accounts` - ストレージアカウント
- `web.app_services` - App Service

### GCP の例
- `compute.compute_engine` - Compute Engine
- `databases.cloud_sql` - Cloud SQL
- `networking.cloud_dns` - Cloud DNS
