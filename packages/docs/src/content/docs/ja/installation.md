---
title: インストール
description: Figramのインストールとセットアップ方法
---

このガイドでは、Figramのインストールとセットアップ方法を説明します。

## 前提条件

- [Node.js](https://nodejs.org/) v18以降（または[Bun](https://bun.sh/)）
- [Figma Desktop](https://www.figma.com/downloads/)

## クイックスタート

### 1. CLIのインストール

```bash
npm install -g figram
```

またはnpxで直接実行（インストール不要）:

```bash
npx figram <command>
```

### 2. ダイアグラムの作成

```bash
npx figram init
```

現在のディレクトリに`diagram.yaml`テンプレートが作成されます。

### 3. FigJamプラグインのインストール

1. [Figma Community](https://www.figma.com/community/plugin/1588833479203267078/figram)からインストール
2. FigJamファイルを開く
3. プラグインメニューからfigramプラグインを実行

### 4. ライブ同期の開始

```bash
npx figram diagram.yaml
```

FigJamプラグイン上で:
1. YAMLファイルの`docId`を入力
2. `ws://127.0.0.1:3456`に接続

ダイアグラムが表示され、YAMLを編集すると自動的に同期されます！

## CLIコマンド

### `figram init`

`diagram.yaml`テンプレートを作成します。

```bash
npx figram init
```

### `figram build <file>`

YAMLをJSON形式に変換します。

```bash
npx figram build diagram.yaml
# 出力: diagram.json
```

### `figram serve <file>`（デフォルト）

ファイル監視付きでWebSocketサーバーを起動します。デフォルトコマンドのため、`serve`を省略できます:

```bash
npx figram diagram.yaml
# または明示的に:
npx figram serve diagram.yaml
```

オプション:

| オプション | 説明 |
|-----------|------|
| `--port, -p` | ポート番号（デフォルト: 3456） |
| `--host` | バインドするホスト（デフォルト: 127.0.0.1） |
| `--no-watch` | ファイル監視を無効化 |
| `--allow-remote` | リモート接続を許可 |
| `--secret` | 接続にシークレットを要求 |
| `--icons` | カスタムアイコンファイルのパス |

## アイコン表示

Figramは利用可能な場合、**FigJamの標準クラウドプロバイダーシェイプ**を使用します。これには以下が必要です:
- FigJam Pro、Organization、またはEnterpriseプラン（標準シェイプライブラリを含む）

### 無料プランユーザー（カスタムアイコン）

無料プランでFigJamの標準シェイプにアクセスできない場合、ノードはラベル付きのシンプルな矩形として表示されます。以下の方法でカスタムアイコンを追加できます:

#### オプション1: figram-icons.yaml（推奨）

ダイアグラムと同じディレクトリに`figram-icons.yaml`ファイルを作成:

```yaml
version: 1
icons:
  aws:
    "compute.ec2": "./icons/ec2.png"
    "database.rds": "./icons/rds.png"
    "compute.lambda": "./icons/lambda.png"
```

アイコンファイル（PNG、JPGなど）を`icons/`フォルダに配置:

```
project/
  diagram.yaml
  figram-icons.yaml
  icons/
    ec2.png
    rds.png
    lambda.png
```

サーバーを起動 - アイコンは自動で検出されます:

```bash
npx figram diagram.yaml
```

#### オプション2: diagram.yaml内にインライン定義

ダイアグラムファイル内に直接アイコンを追加:

```yaml
version: 1
docId: "prod"
icons:
  aws:
    "compute.ec2": "./icons/ec2.png"
    "database.rds": "./icons/rds.png"
nodes:
  - id: web
    provider: aws
    kind: compute.ec2
    # ...
```

#### オプション3: 明示的なアイコンファイル指定

カスタムアイコンファイルのパスを指定:

```bash
npx figram serve diagram.yaml --icons path/to/my-icons.yaml
```

#### 優先順位

複数のアイコンソースが利用可能な場合、以下の優先順位でマージされます（高い順）:

1. **インラインアイコン**（`diagram.yaml`内）
2. **外部ファイル**（`figram-icons.yaml`または`--icons`フラグ）

これにより、共通アイコンを外部ファイルで定義し、特定のアイコンをインラインで上書きできます。

#### 公式アイコンのダウンロード

以下から公式クラウドプロバイダーアイコンをダウンロードできます:
- **AWS**: https://aws.amazon.com/architecture/icons/
- **GCP**: https://cloud.google.com/icons
- **Azure**: https://learn.microsoft.com/en-us/azure/architecture/icons/

#### アイコンパスの解決

- 相対パスはYAMLファイルの場所から解決されます
- 絶対パスはそのまま使用されます
- 対応フォーマット: PNG, JPG, JPEG, GIF, WebP
- **注意:** SVGはFigJamの画像APIでサポートされていません

#### 階層フォールバック

アイコンは階層的なマッチングをサポートします。例えば、`compute.ec2`のアイコンを定義すると、より具体的なアイコンが定義されていない限り、`compute.ec2.t3`や`compute.ec2.custom`にも使用されます。

## Claude Code プラグイン

[Claude Code](https://claude.ai/code)を使用している場合、FigramプラグインをインストールすることでYAML構文のヘルプやトラブルシューティングガイドなど、AIによるダイアグラム作成支援を受けられます。

### インストール

```bash
/plugin install 7nohe/figram
```

### 利用可能なスキル

| スキル | 説明 |
|--------|------|
| `getting-started` | セットアップガイド、ワークフロー、プラグイン接続 |
| `yaml-authoring` | YAML構文、プロバイダー、パターン、トラブルシューティング |

インストール後、Figram YAMLファイルで作業する際にClaudeが自動的にこれらのスキルを参照します。

## リモートアクセス

デフォルトでは、サーバーは`127.0.0.1`（localhost のみ）にバインドされます。他のマシンからの接続を許可するには:

```bash
npx figram serve diagram.yaml --allow-remote
```

セキュリティのため、`--secret`で認証を要求できます:

```bash
npx figram serve diagram.yaml --allow-remote --secret my-secret
```

クライアントは接続時にプラグインでシークレットを入力する必要があります。

## トラブルシューティング

### WebSocket接続の問題

- CLIサーバーが実行中か確認（`npx figram serve`）
- ポート（デフォルト: 3456）が使用されていないか確認
- プラグインの`docId`がYAMLファイルと一致しているか確認

### プラグインが読み込まれない

- Web版ではなく**Figma Desktop**を使用していることを確認
- コンソール（表示 > 開発者 > コンソール）でエラーを確認

### YAMLバリデーションエラー

- `npx figram build diagram.yaml`で詳細なエラーメッセージを確認
- 必須フィールドがすべて存在することを確認（[YAML仕様](/ja/yaml-specs/)を参照）
