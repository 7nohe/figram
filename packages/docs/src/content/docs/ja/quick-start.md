---
title: クイックスタート
description: 5分で最初のダイアグラムを作成
---

5分でFigramを動かしましょう。

## 1. ダイアグラムを作成

```bash
npx figram init
```

`diagram.yaml` が作成されます：

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

## 2. サーバーを起動

```bash
npx figram diagram.yaml
```

出力：
```
WebSocket server started on ws://127.0.0.1:3456
Watching diagram.yaml for changes...
```

## awsdac YAML の読み込み（実験的）

[AWS Diagram-as-Code (awsdac)](https://github.com/awslabs/diagram-as-code) の YAML を直接読み込めます：

```bash
npx figram path/to/awsdac.yaml
```

注意:
- Doc ID はファイル名から自動生成（例: `vpc.yaml` -> `vpc`）
- レイアウト/スタック方向/リンク装飾は保持されません
- Go テンプレートは未対応（`awsdac -t` で事前展開）
- 未対応リソースは汎用アイコンにフォールバック

## 3. FigJamプラグインに接続

1. Figma DesktopでFigJamを開く
2. プラグインメニューからFigramを実行
3. 以下を入力：
   - **Doc ID**: `my-architecture`
   - **URL**: `ws://127.0.0.1:3456`
4. **Connect** をクリック

キャンバスにダイアグラムが表示されます！

## 4. ライブ編集

`diagram.yaml` を編集して保存すると、自動的にFigJamに反映されます。

新しいノードを追加してみましょう：

```yaml
  - id: rds
    provider: aws
    kind: database.rds
    label: "PostgreSQL"
    parent: subnet_public
    layout: { x: 100, y: 260 }
```

## 次のステップ

- [YAML仕様](/ja/yaml-specs/) - 完全なYAML構文リファレンス
- [サンプル集](/ja/examples/) - 実践的なアーキテクチャパターン
- [インストール](/ja/installation/) - カスタムアイコン、リモートアクセスなど
