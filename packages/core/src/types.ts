// =============================================================================
// DSL Types (YAML input)
// =============================================================================

/** Layout information (x/y optional for child nodes with auto-layout) */
export interface DSLLayout {
  x?: number; // Optional when parent is specified (auto-layout)
  y?: number; // Optional when parent is specified (auto-layout)
  w?: number; // For container nodes (VPC/Subnet)
  h?: number;
}

/** DSL node (YAML input format) */
export interface DSLNode {
  id: string;
  provider: string;
  kind: string;
  label?: string;
  parent?: string;
  layout?: DSLLayout; // Optional for child nodes (auto-layout)
}

/** DSL edge (YAML input format) */
export interface DSLEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  color?: string; // HEX: #RRGGBB or #RGB
}

/** Icon mapping: kind -> file path (relative or absolute) */
export type DSLIcons = Record<string, Record<string, string>>;

/** DSL document (YAML input format) */
export interface DSLDocument {
  version: number;
  docId: string;
  title?: string;
  nodes: DSLNode[];
  edges?: DSLEdge[];
  icons?: DSLIcons;
}

// =============================================================================
// IR Types (Normalized intermediate representation)
// =============================================================================

/** IR node (normalized) */
export interface IRNode {
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

/** IR edge (normalized) */
export interface IREdge {
  id: string;
  from: string;
  to: string;
  label: string;
  color: string; // Normalized HEX: #RRGGBB
}

/** IR document (normalized: used for diff calculation) */
export interface IRDocument {
  version: number;
  docId: string;
  title: string;
  nodes: Record<string, IRNode>;
  edges: Record<string, IREdge>;
}

// =============================================================================
// Patch Types
// =============================================================================

export type PatchOp =
  | { op: "upsertNode"; node: IRNode }
  | { op: "removeNode"; id: string }
  | { op: "upsertEdge"; edge: IREdge }
  | { op: "removeEdge"; id: string };

export interface Patch {
  baseRev: number;
  nextRev: number;
  ops: PatchOp[];
}

// =============================================================================
// WebSocket Protocol Types
// =============================================================================

/** Plugin → CLI: Connection initiation */
export interface HelloMessage {
  type: "hello";
  docId: string;
  secret?: string;
  pluginVersion?: string;
}

/** CLI → Plugin: Connection acknowledgment with version info */
export interface WelcomeMessage {
  type: "welcome";
  cliVersion: string;
  protocolVersion: number;
}

/** CLI → Plugin: Full sync */
export interface FullMessage {
  type: "full";
  rev: number;
  ir: IRDocument;
}

/** CLI → Plugin: Diff update */
export interface PatchMessage {
  type: "patch";
  baseRev: number;
  nextRev: number;
  ops: PatchOp[];
}

/** Plugin → CLI: Full sync request */
export interface RequestFullMessage {
  type: "requestFull";
  docId: string;
}

/** CLI → Plugin: Error notification */
export interface ErrorMessage {
  type: "error";
  message: string;
}

/** Icon registry: provider -> kind -> base64 encoded image */
export type IRIconRegistry = Record<string, Record<string, string>>;

/** CLI → Plugin: Custom icons sync */
export interface IconsMessage {
  type: "icons";
  icons: IRIconRegistry;
}

export type WSMessage =
  | HelloMessage
  | WelcomeMessage
  | FullMessage
  | PatchMessage
  | RequestFullMessage
  | ErrorMessage
  | IconsMessage;

// =============================================================================
// Validation Types
// =============================================================================

export interface ValidationError {
  path: string;
  message: string;
}

export type ValidationResult =
  | { ok: true; document: DSLDocument }
  | { ok: false; errors: ValidationError[] };
