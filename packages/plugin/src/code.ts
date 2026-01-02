// Main thread (code.ts) - FigJam API and rendering
// Entry point - delegates to specialized modules

import type {
  ErrorMessage,
  FullMessage,
  IconsMessage,
  IRIconRegistry,
  PatchMessage,
} from "@figram/core";
import { applyFull, applyPatch, getConnectorsForDoc } from "./patch";
import {
  edgeIndex,
  getDocRoot,
  iconImageCache,
  nodeIndex,
  PLUGIN_DATA_DOC_ID,
  PLUGIN_DATA_NODE_ID,
  PLUGIN_DATA_ROOT,
  receivedIcons,
  setCurrentDocId,
  setCurrentRev,
  setDocRoot,
} from "./state";

type WSMessage = FullMessage | PatchMessage | ErrorMessage | IconsMessage;

// =============================================================================
// Initialization
// =============================================================================

figma.showUI(__html__, { width: 320, height: 480 });

/** Find or create doc root */
async function initDocRoot(
  docId: string,
  options?: { buildIndex?: boolean },
): Promise<SectionNode> {
  // Look for existing root with matching docId
  for (const node of figma.currentPage.children) {
    if (
      node.type === "SECTION" &&
      node.getPluginData(PLUGIN_DATA_ROOT) === "1" &&
      node.getPluginData(PLUGIN_DATA_DOC_ID) === docId
    ) {
      setDocRoot(node);
      setCurrentDocId(docId);
      if (options && options.buildIndex !== undefined ? options.buildIndex : true) {
        await buildIndex(docId);
      }
      return node;
    }
  }

  // Create new root section
  const section = figma.createSection();
  section.name = `figram: ${docId}`;
  section.resizeWithoutConstraints(1600, 1200);
  section.setPluginData(PLUGIN_DATA_ROOT, "1");
  section.setPluginData(PLUGIN_DATA_DOC_ID, docId);

  setDocRoot(section);
  setCurrentDocId(docId);
  nodeIndex.clear();
  edgeIndex.clear();

  // Scroll to section
  figma.viewport.scrollAndZoomIntoView([section]);

  return section;
}

// =============================================================================
// Indexing
// =============================================================================

/** Index nodes from docRoot tree */
function indexNodesFromDocRoot(root: SectionNode) {
  function traverse(node: SceneNode) {
    const nodeId = node.getPluginData(PLUGIN_DATA_NODE_ID);
    if (nodeId) {
      nodeIndex.set(nodeId, node);
    }

    if ("children" in node) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  traverse(root);
}

/** Index edges from entire page (connectors may not be children of docRoot) */
function indexEdgesFromPage(docId: string) {
  for (const connector of getConnectorsForDoc(docId)) {
    const edgeId = connector.getPluginData("dac:edgeId");
    if (edgeId) {
      edgeIndex.set(edgeId, connector);
    }
  }
}

/** Build index from existing nodes and edges */
async function buildIndex(docId: string) {
  nodeIndex.clear();
  edgeIndex.clear();

  const docRoot = getDocRoot();
  if (!docRoot) return;

  indexNodesFromDocRoot(docRoot);
  indexEdgesFromPage(docId);
}

// =============================================================================
// Icons Handler
// =============================================================================

/** Handle icons message from CLI */
function handleIconsMessage(icons: IRIconRegistry) {
  receivedIcons.clear();

  let iconCount = 0;
  for (const [provider, kinds] of Object.entries(icons)) {
    const kindMap = new Map<string, string>();
    for (const [kind, base64] of Object.entries(kinds)) {
      kindMap.set(kind, base64);
      iconCount++;
    }
    receivedIcons.set(provider, kindMap);
  }

  // Clear icon image cache to force re-render with new icons
  iconImageCache.clear();

  if (iconCount > 0) {
    figma.notify(`Received ${iconCount} custom icons`);
  }
}

// =============================================================================
// Message Handler
// =============================================================================

figma.ui.onmessage = async (msg: WSMessage) => {
  switch (msg.type) {
    case "icons":
      handleIconsMessage(msg.icons);
      break;

    case "full":
      await applyFull(msg.ir, initDocRoot, buildIndex);
      setCurrentRev(msg.rev);
      break;

    case "patch":
      await applyPatch(msg.ops, msg.baseRev, msg.nextRev, buildIndex);
      break;

    case "error":
      figma.notify(`Error: ${msg.message}`, { error: true });
      break;
  }
};

// Close plugin handler
figma.on("close", () => {
  // Cleanup if needed
});
