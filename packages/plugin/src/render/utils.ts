import {
  DEFAULT_FONT,
  getCurrentDocId,
  MEDIUM_FONT,
  nodeIndex,
  PLUGIN_DATA_DOC_ID,
  PLUGIN_DATA_NODE_ID,
} from "../state";

/**
 * Converts a HEX color (#RRGGBB) to Figma RGB format (0-1 range)
 */
export function hexToFigmaRGB(hex: string): { r: number; g: number; b: number } {
  const hexValue = hex.slice(1);
  return {
    r: parseInt(hexValue.substring(0, 2), 16) / 255,
    g: parseInt(hexValue.substring(2, 4), 16) / 255,
    b: parseInt(hexValue.substring(4, 6), 16) / 255,
  };
}

// =============================================================================
// Font Loading
// =============================================================================

export async function loadDefaultFont() {
  await figma.loadFontAsync(DEFAULT_FONT);
}

export async function loadMediumFont() {
  await figma.loadFontAsync(MEDIUM_FONT);
}

export async function ensureTextFont(textNode: TextNode | TextSublayerNode | null) {
  if (!textNode) return;
  const font = textNode.fontName;
  // Use Inter as default if font is mixed or has empty/invalid family
  if (font === figma.mixed || !font.family || font.family.trim() === "") {
    await loadDefaultFont();
    return;
  }
  await figma.loadFontAsync(font);
}

// =============================================================================
// Node Helpers
// =============================================================================

export function createIndexedNode<T extends SceneNode>(id: string, create: () => T): T {
  const node = create();
  node.setPluginData(PLUGIN_DATA_NODE_ID, id);
  node.setPluginData(PLUGIN_DATA_DOC_ID, getCurrentDocId() || "");
  nodeIndex.set(id, node);
  return node;
}

export function getOrCreateNode<T extends SceneNode>(
  id: string,
  existing: SceneNode | undefined,
  isExpected: (node: SceneNode) => node is T,
  create: () => T,
): T {
  if (existing && isExpected(existing)) {
    return existing;
  }

  if (existing) {
    existing.remove();
    nodeIndex.delete(id);
  }

  return createIndexedNode(id, create);
}
