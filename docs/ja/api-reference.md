# APIリファレンス

このドキュメントでは、`@figram/core`の公開APIについて説明します。

## 概要

`@figram/core`は依存関係のないライブラリで、DSL処理を担当します：

- **バリデーション** - YAML入力をDSLスキーマに対して検証
- **正規化** - DSLをIR（中間表現）に変換
- **差分計算** - IRドキュメント間のパッチを計算

## 関数

### `validate(doc: unknown): ValidationResult`

パースされたYAMLドキュメントをDSLスキーマに対してバリデーションします。

**パラメータ:**
- `doc` - パースされたYAMLドキュメント（通常は`YAML.parse()`の結果）

**戻り値:**
- `ValidationResult` - `{ ok: true, document: DSLDocument }`または`{ ok: false, errors: ValidationError[] }`

**使用例:**

```typescript
import { validate } from "@figram/core";

const parsed = YAML.parse(yamlContent);
const result = validate(parsed);

if (result.ok) {
  console.log("有効なドキュメント:", result.document);
} else {
  for (const error of result.errors) {
    console.error(`${error.path}: ${error.message}`);
  }
}
```

**バリデーションチェック:**
- 必須フィールド: `version`, `docId`, `nodes`
- ノードバリデーション: 一意の`id`、必須の`provider`, `kind`, `layout`
- レイアウトバリデーション: 必須の`x`, `y`、オプションの`w`, `h`
- エッジバリデーション: 一意の`id`、有効な`from`/`to`参照
- 親バリデーション: 存在チェック、循環検出

---

### `normalize(dsl: DSLDocument): IRDocument`

DSLドキュメントを正規化されたIR（中間表現）に変換します。

**パラメータ:**
- `dsl` - 有効なDSLドキュメント

**戻り値:**
- `IRDocument` - 正規化されたドキュメント

**変換内容:**
- `nodes`配列を`Record<string, IRNode>`に変換
- `edges`配列を`Record<string, IREdge>`に変換
- デフォルト値の適用:
  - `node.label`は`node.id`がデフォルト
  - `node.parent`は`null`がデフォルト
  - `node.layout.w`は`null`がデフォルト
  - `node.layout.h`は`null`がデフォルト
  - `edge.label`は`""`がデフォルト
  - `document.title`は`docId`がデフォルト

**使用例:**

```typescript
import { normalize, validate } from "@figram/core";

const result = validate(parsed);
if (result.ok) {
  const ir = normalize(result.document);
  console.log(ir.nodes); // Record<string, IRNode>
  console.log(ir.edges); // Record<string, IREdge>
}
```

---

### `diff(prev: IRDocument | null, next: IRDocument): PatchOp[]`

2つのIRドキュメント間の差分を計算します。

**パラメータ:**
- `prev` - 前のIRドキュメント（初期状態の場合は`null`）
- `next` - 新しいIRドキュメント

**戻り値:**
- `PatchOp[]` - パッチ操作の配列

**操作の順序:**
1. `removeEdge` - 存在しなくなったエッジを削除
2. `removeNode` - ノードを削除（子から先に）
3. `upsertNode` - ノードを追加/更新（親から先に）
4. `upsertEdge` - エッジを追加/更新

**使用例:**

```typescript
import { diff, normalize, validate } from "@figram/core";

const prev = normalize(validate(yaml1).document);
const next = normalize(validate(yaml2).document);

const ops = diff(prev, next);

for (const op of ops) {
  switch (op.op) {
    case "upsertNode":
      console.log(`ノードを追加/更新: ${op.node.id}`);
      break;
    case "removeNode":
      console.log(`ノードを削除: ${op.id}`);
      break;
    case "upsertEdge":
      console.log(`エッジを追加/更新: ${op.edge.id}`);
      break;
    case "removeEdge":
      console.log(`エッジを削除: ${op.id}`);
      break;
  }
}
```

## 型定義

### DSL型（入力）

YAML入力フォーマットを表す型です。

#### `DSLDocument`

```typescript
interface DSLDocument {
  version: number;
  docId: string;
  title?: string;
  nodes: DSLNode[];
  edges?: DSLEdge[];
}
```

#### `DSLNode`

```typescript
interface DSLNode {
  id: string;
  provider: string;
  kind: string;
  label?: string;
  parent?: string;
  layout: DSLLayout;
}
```

#### `DSLEdge`

```typescript
interface DSLEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
}
```

#### `DSLLayout`

```typescript
interface DSLLayout {
  x: number;
  y: number;
  w?: number;
  h?: number;
}
```

### IR型（正規化後）

正規化された中間表現を表す型です。

#### `IRDocument`

```typescript
interface IRDocument {
  version: number;
  docId: string;
  title: string;
  nodes: Record<string, IRNode>;
  edges: Record<string, IREdge>;
}
```

#### `IRNode`

```typescript
interface IRNode {
  id: string;
  provider: string;
  kind: string;
  label: string;
  parent: string | null;
  layout: {
    x: number;
    y: number;
    w: number | null;
    h: number | null;
  };
}
```

#### `IREdge`

```typescript
interface IREdge {
  id: string;
  from: string;
  to: string;
  label: string;
}
```

### パッチ型

#### `PatchOp`

```typescript
type PatchOp =
  | { op: "upsertNode"; node: IRNode }
  | { op: "removeNode"; id: string }
  | { op: "upsertEdge"; edge: IREdge }
  | { op: "removeEdge"; id: string };
```

#### `Patch`

```typescript
interface Patch {
  baseRev: number;
  nextRev: number;
  ops: PatchOp[];
}
```

### バリデーション型

#### `ValidationError`

```typescript
interface ValidationError {
  path: string;
  message: string;
}
```

#### `ValidationResult`

```typescript
type ValidationResult =
  | { ok: true; document: DSLDocument }
  | { ok: false; errors: ValidationError[] };
```

### WebSocketプロトコル型

#### `HelloMessage`

プラグインからCLIへの接続開始メッセージ。

```typescript
interface HelloMessage {
  type: "hello";
  docId: string;
  secret?: string;
}
```

#### `FullMessage`

CLIからプラグインへの全体同期メッセージ。

```typescript
interface FullMessage {
  type: "full";
  rev: number;
  ir: IRDocument;
}
```

#### `PatchMessage`

CLIからプラグインへの差分更新メッセージ。

```typescript
interface PatchMessage {
  type: "patch";
  baseRev: number;
  nextRev: number;
  ops: PatchOp[];
}
```

#### `RequestFullMessage`

プラグインからCLIへの全体状態要求メッセージ。

```typescript
interface RequestFullMessage {
  type: "requestFull";
  docId: string;
}
```

#### `ErrorMessage`

CLIからプラグインへのエラー通知メッセージ。

```typescript
interface ErrorMessage {
  type: "error";
  message: string;
}
```

#### `IconsMessage`

CLIからプラグインへのカスタムアイコンデータ。

```typescript
/** アイコンレジストリ: プロバイダー -> kind -> base64エンコード画像 */
type IRIconRegistry = Record<string, Record<string, string>>;

interface IconsMessage {
  type: "icons";
  icons: IRIconRegistry;
}
```

このメッセージは、ユーザーが以下の方法でカスタムアイコンを設定した場合に、`FullMessage`の前に送信されます：
- diagram.yaml内のインライン`icons`フィールド
- 別ファイル`figram-icons.yaml`
- `--icons` CLIオプション

#### `WSMessage`

すべてのWebSocketメッセージ型の共用体。

```typescript
type WSMessage =
  | HelloMessage
  | FullMessage
  | PatchMessage
  | RequestFullMessage
  | ErrorMessage
  | IconsMessage;
```
