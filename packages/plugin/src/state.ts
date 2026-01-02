// =============================================================================
// Plugin Data Keys
// =============================================================================

export const PLUGIN_DATA_DOC_ID = "dac:docId";
export const PLUGIN_DATA_ROOT = "dac:root";
export const PLUGIN_DATA_NODE_ID = "dac:nodeId";
export const PLUGIN_DATA_EDGE_ID = "dac:edgeId";

// =============================================================================
// Global State
// =============================================================================

let _currentDocId: string | null = null;
let _currentRev = 0;
let _docRoot: SectionNode | null = null;

export function getCurrentDocId(): string | null {
  return _currentDocId;
}

export function setCurrentDocId(docId: string | null) {
  _currentDocId = docId;
}

export function getCurrentRev(): number {
  return _currentRev;
}

export function setCurrentRev(rev: number) {
  _currentRev = rev;
}

export function getDocRoot(): SectionNode | null {
  return _docRoot;
}

export function setDocRoot(root: SectionNode | null) {
  _docRoot = root;
}

// =============================================================================
// Index Maps
// =============================================================================

export const nodeIndex = new Map<string, SceneNode>();
export const edgeIndex = new Map<string, ConnectorNode>();

// =============================================================================
// Caches
// =============================================================================

/** Icon image cache (provider:kind -> imageHash) */
export const iconImageCache = new Map<string, string>();

/** Component cache (componentKey -> ComponentNode) */
export const componentCache = new Map<string, ComponentNode>();

/** Received icons from CLI (provider -> kind -> base64) */
export const receivedIcons = new Map<string, Map<string, string>>();

// =============================================================================
// Constants
// =============================================================================

export const ICON_SIZE = 32;
export const ICON_PADDING = 8;
export const DEFAULT_FONT: FontName = { family: "Inter", style: "Regular" };
export const MEDIUM_FONT: FontName = { family: "Inter", style: "Medium" };
