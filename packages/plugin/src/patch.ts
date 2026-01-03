import type { IRDocument, PatchOp } from "@figram/core";
import { centerContentInSection, getNodeDepth } from "./layout";
import { renderEdge, renderNode, resetMagnetUsage } from "./render";
import {
  edgeIndex,
  getCurrentDocId,
  getCurrentRev,
  getDocRoot,
  nodeIndex,
  PLUGIN_DATA_DOC_ID,
  PLUGIN_DATA_ROOT,
  setCurrentRev,
} from "./state";

// =============================================================================
// Cleanup Functions
// =============================================================================

export function getConnectorsForDoc(docId: string): ConnectorNode[] {
  return figma.currentPage
    .findAllWithCriteria({ types: ["CONNECTOR"] })
    .filter(
      (connector): connector is ConnectorNode =>
        connector.type === "CONNECTOR" && connector.getPluginData(PLUGIN_DATA_DOC_ID) === docId,
    );
}

/** Clean up all edges belonging to a document */
export function cleanupEdgesForDoc(docId: string) {
  for (const connector of getConnectorsForDoc(docId)) {
    connector.remove();
  }
}

export function cleanupNodesForDoc(docId: string) {
  const nodes = figma.currentPage.findAll();
  for (const node of nodes) {
    if (node.type === "CONNECTOR") continue;
    if (node.getPluginData(PLUGIN_DATA_DOC_ID) !== docId) continue;
    if (node.getPluginData(PLUGIN_DATA_ROOT) === "1") continue;
    node.remove();
  }
}

// =============================================================================
// Node/Edge Removal
// =============================================================================

export function removeNode(id: string) {
  const node = nodeIndex.get(id);
  if (node) {
    node.remove();
    nodeIndex.delete(id);
  }
}

export function removeEdge(id: string) {
  const edge = edgeIndex.get(id);
  if (edge) {
    edge.remove();
    edgeIndex.delete(id);
  }
}

// =============================================================================
// Apply Operations
// =============================================================================

export async function applyFull(
  ir: IRDocument,
  initDocRoot: (docId: string, options?: { buildIndex?: boolean }) => Promise<SectionNode>,
  buildIndex: (docId: string) => Promise<void>,
) {
  await initDocRoot(ir.docId, { buildIndex: false });

  // Clear existing content
  const docRoot = getDocRoot();
  if (docRoot) {
    while (docRoot.children.length > 0) {
      docRoot.children[0].remove();
    }
  }

  // Remove any stray nodes for this document outside the docRoot
  cleanupNodesForDoc(ir.docId);

  // Clean up edges that may be outside docRoot
  cleanupEdgesForDoc(ir.docId);

  nodeIndex.clear();
  edgeIndex.clear();

  // Sort nodes: parents first
  const sortedNodes = Object.values(ir.nodes).sort((a, b) => {
    const depthA = getNodeDepth(a, ir.nodes);
    const depthB = getNodeDepth(b, ir.nodes);
    return depthA - depthB;
  });

  // Render nodes
  for (const node of sortedNodes) {
    await renderNode(node);
  }

  // Center content BEFORE rendering edges so magnet calculations use final positions
  // (elbowed connectors calculate their routing when created and may not update when nodes move)
  centerContentInSection();

  // Reset magnet usage tracking for fresh render
  resetMagnetUsage();

  // Render edges
  for (const edge of Object.values(ir.edges)) {
    await renderEdge(edge, buildIndex);
  }

  figma.notify(`Loaded: ${ir.title}`);
}

export async function applyPatch(
  ops: PatchOp[],
  baseRev: number,
  nextRev: number,
  buildIndex: (docId: string) => Promise<void>,
) {
  // Check revision
  if (baseRev !== getCurrentRev()) {
    // Request full sync
    figma.ui.postMessage({
      type: "requestFull",
      docId: getCurrentDocId(),
    });
    figma.notify("Revision mismatch, requesting full sync...", { error: true });
    return;
  }

  // Reset magnet usage to avoid accumulation across incremental updates
  resetMagnetUsage();

  for (const op of ops) {
    switch (op.op) {
      case "removeEdge":
        removeEdge(op.id);
        break;
      case "removeNode":
        removeNode(op.id);
        break;
      case "upsertNode":
        await renderNode(op.node);
        break;
      case "upsertEdge":
        await renderEdge(op.edge, buildIndex);
        break;
    }
  }

  setCurrentRev(nextRev);
  figma.notify(`Updated (rev ${nextRev}): ${ops.length} changes`);
}
