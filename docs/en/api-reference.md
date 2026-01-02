# API Reference

This document describes the public API of `@figram/core`.

## Overview

`@figram/core` is a dependency-free library that handles DSL processing:

- **Validation** - Validate YAML input against the DSL schema
- **Normalization** - Convert DSL to IR (Intermediate Representation)
- **Diff** - Calculate patches between IR documents

## Functions

### `validate(doc: unknown): ValidationResult`

Validates a parsed YAML document against the DSL schema.

**Parameters:**
- `doc` - The parsed YAML document (typically from `YAML.parse()`)

**Returns:**
- `ValidationResult` - Either `{ ok: true, document: DSLDocument }` or `{ ok: false, errors: ValidationError[] }`

**Example:**

```typescript
import { validate } from "@figram/core";

const parsed = YAML.parse(yamlContent);
const result = validate(parsed);

if (result.ok) {
  console.log("Valid document:", result.document);
} else {
  for (const error of result.errors) {
    console.error(`${error.path}: ${error.message}`);
  }
}
```

**Validation Checks:**
- Required fields: `version`, `docId`, `nodes`
- Node validation: unique `id`, required `provider`, `kind`, `layout`
- Layout validation: required `x`, `y`; optional `w`, `h`
- Edge validation: unique `id`, valid `from`/`to` references
- Parent validation: existence check, cycle detection

---

### `normalize(dsl: DSLDocument): IRDocument`

Converts a DSL document to its normalized IR (Intermediate Representation).

**Parameters:**
- `dsl` - A valid DSL document

**Returns:**
- `IRDocument` - The normalized document

**Transformations:**
- Converts `nodes` array to `Record<string, IRNode>`
- Converts `edges` array to `Record<string, IREdge>`
- Applies default values:
  - `node.label` defaults to `node.id`
  - `node.parent` defaults to `null`
  - `node.layout.w` defaults to `null`
  - `node.layout.h` defaults to `null`
  - `edge.label` defaults to `""`
  - `document.title` defaults to `docId`

**Example:**

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

Calculates the difference between two IR documents.

**Parameters:**
- `prev` - The previous IR document (or `null` for initial state)
- `next` - The new IR document

**Returns:**
- `PatchOp[]` - Array of patch operations

**Operation Order:**
1. `removeEdge` - Remove edges that no longer exist
2. `removeNode` - Remove nodes (child-first order)
3. `upsertNode` - Add/update nodes (parent-first order)
4. `upsertEdge` - Add/update edges

**Example:**

```typescript
import { diff, normalize, validate } from "@figram/core";

const prev = normalize(validate(yaml1).document);
const next = normalize(validate(yaml2).document);

const ops = diff(prev, next);

for (const op of ops) {
  switch (op.op) {
    case "upsertNode":
      console.log(`Upsert node: ${op.node.id}`);
      break;
    case "removeNode":
      console.log(`Remove node: ${op.id}`);
      break;
    case "upsertEdge":
      console.log(`Upsert edge: ${op.edge.id}`);
      break;
    case "removeEdge":
      console.log(`Remove edge: ${op.id}`);
      break;
  }
}
```

## Types

### DSL Types (Input)

These types represent the YAML input format.

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

### IR Types (Normalized)

These types represent the normalized intermediate representation.

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

### Patch Types

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

### Validation Types

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

### WebSocket Protocol Types

#### `HelloMessage`

Sent from Plugin to CLI when connecting.

```typescript
interface HelloMessage {
  type: "hello";
  docId: string;
  secret?: string;
}
```

#### `FullMessage`

Sent from CLI to Plugin for full sync.

```typescript
interface FullMessage {
  type: "full";
  rev: number;
  ir: IRDocument;
}
```

#### `PatchMessage`

Sent from CLI to Plugin for incremental updates.

```typescript
interface PatchMessage {
  type: "patch";
  baseRev: number;
  nextRev: number;
  ops: PatchOp[];
}
```

#### `RequestFullMessage`

Sent from Plugin to CLI to request full state.

```typescript
interface RequestFullMessage {
  type: "requestFull";
  docId: string;
}
```

#### `ErrorMessage`

Sent from CLI to Plugin on errors.

```typescript
interface ErrorMessage {
  type: "error";
  message: string;
}
```

#### `IconsMessage`

Sent from CLI to Plugin with custom icon data.

```typescript
/** Icon registry: provider -> kind -> base64 encoded image */
type IRIconRegistry = Record<string, Record<string, string>>;

interface IconsMessage {
  type: "icons";
  icons: IRIconRegistry;
}
```

This message is sent before `FullMessage` when the user has configured custom icons via:
- Inline `icons` field in diagram.yaml
- Separate `figram-icons.yaml` file
- `--icons` CLI option

#### `WSMessage`

Union of all WebSocket message types.

```typescript
type WSMessage =
  | HelloMessage
  | FullMessage
  | PatchMessage
  | RequestFullMessage
  | ErrorMessage
  | IconsMessage;
```
