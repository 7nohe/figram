---
title: VS Code 拡張機能
description: IntelliSense、診断機能、ライブ同期でFigramダイアグラムを編集
---

Figram VS Code拡張機能は、YAMLダイアグラムファイルの編集において、自動補完、リアルタイム検証、サーバー管理機能を提供します。

## 機能

### 自動補完

入力中にインテリジェントな候補を表示:

- **`provider:`** - `aws`、`azure`、`gcp`をアイコン数とともに提案
- **`kind:`** - ノードのproviderに基づいてフィルタリングされたアイコンを提案

```yaml
nodes:
  - id: my-ec2
    provider: aws      # 補完: aws (873 icons), azure (636 icons), gcp (216 icons)
    kind: compute.ec2  # 補完: providerが'aws'の場合、AWSアイコンのみ表示
```

### 診断機能

リアルタイム検証でエラーと警告をハイライト:

| 問題 | 重要度 | 例 |
|------|--------|-----|
| 無効なprovider | エラー | `provider: amazon` → "Invalid provider 'amazon'. Expected: aws, azure, gcp" |
| 不明なkind | 警告 | `kind: invalid.thing` → "Unknown kind 'invalid.thing' for provider 'aws'" |
| 必須フィールドの欠落 | 警告 | `version`または`docId`が未定義 |
| 重複するノードID | エラー | 同じ`id`を持つ2つのノード |
| YAML構文エラー | エラー | 無効なYAML構造 |

### スニペット

組み込みスニペットで素早くダイアグラムを作成:

| プレフィックス | 説明 |
|---------------|------|
| `figram-diagram`, `diagram` | 基本的なダイアグラムテンプレート |
| `figram-vpc`, `aws-vpc` | AWS VPCアーキテクチャテンプレート |
| `figram-node-aws`, `node-aws` | AWSノード |
| `figram-node-gcp`, `node-gcp` | GCPノード |
| `figram-node-azure`, `node-azure` | Azureノード |
| `figram-container`, `figram-section` | コンテナ/セクションノード（幅と高さ指定） |
| `figram-node-parent`, `node-child` | コンテナ内のノード（parent指定） |
| `figram-edge`, `edge` | 2つのノードを接続するエッジ |
| `figram-edge-simple`, `edge-simple` | ラベルなしのシンプルなエッジ |
| `figram-edges`, `edges` | エッジセクション（1つのエッジ付き） |
| `figram-icons`, `icons` | カスタムアイコンセクション |
| `figram-icons-file`, `icons-file` | figram-icons.yamlファイルテンプレート |
| `figram-three-tier`, `three-tier` | 3層アーキテクチャテンプレート |

### サーバー管理

VS CodeからFigram WebSocketサーバーを直接制御:

- **ステータスバー** - サーバー状態（停止中/実行中）とポートを表示
- **コマンド**:
  - `figram: Start Serve` - WebSocketサーバーを起動
  - `figram: Stop Serve` - サーバーを停止
  - `figram: Restart Serve` - サーバーを再起動

## インストール

### VS Code Marketplaceから

1. VS Codeを開く
2. 拡張機能に移動（Ctrl+Shift+X / Cmd+Shift+X）
3. "figram"を検索
4. インストールをクリック

### VSIXから

```bash
# 拡張機能をビルド
cd packages/vscode
bun run package

# 生成された.vsixファイルをインストール
code --install-extension figram-vscode-*.vsix
```

## 設定

VS Codeの設定（`settings.json`）で拡張機能を設定:

```json
{
  // CLIコマンド（デフォルト: 自動検出またはnpx figram@latest）
  "figram.cli.command": ["bunx", "figram"],

  // サーバー設定
  "figram.serve.host": "127.0.0.1",
  "figram.serve.port": 3456,
  "figram.serve.allowRemote": false,
  "figram.serve.secret": "",
  "figram.serve.noWatch": false,
  "figram.serve.iconsPath": "",

  // 診断設定
  "figram.diagnostics.enabled": true,
  "figram.diagnostics.debounceMs": 300
}
```

## コマンド

| コマンド | 説明 |
|---------|------|
| `figram: Init diagram.yaml` | 新しいダイアグラムテンプレートを作成 |
| `figram: Build JSON (current file)` | 現在のYAMLをJSONに変換 |
| `figram: Start Serve` | WebSocketサーバーを起動 |
| `figram: Stop Serve` | WebSocketサーバーを停止 |
| `figram: Restart Serve` | WebSocketサーバーを再起動 |
| `figram: Serve Actions` | サーバー操作のクイックピックメニュー |
| `figram: Show Output` | 拡張機能の出力チャンネルを表示 |
| `figram: Refresh Diagnostics` | 現在のファイルを強制的に再解析 |

## 対応ファイル

拡張機能は以下のファイルで有効化されます:

- `diagram.yaml` / `diagram.yml`
- `*.figram.yaml` / `*.figram.yml`
- `figram-icons.yaml` / `figram-icons.yml`
- `docId:`と`nodes:`を含む任意のYAMLファイル
