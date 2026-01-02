import type { IREdge } from "@figram/core";
import {
  edgeIndex,
  getCurrentDocId,
  nodeIndex,
  PLUGIN_DATA_DOC_ID,
  PLUGIN_DATA_EDGE_ID,
} from "../state";
import { hexToFigmaRGB, loadMediumFont } from "./utils";

// =============================================================================
// Magnet Types and Tracking
// =============================================================================

export type Magnet = "AUTO" | "TOP" | "BOTTOM" | "LEFT" | "RIGHT" | "CENTER";

/** Track used magnets per node to distribute connections */
const nodeMagnetUsage = new Map<string, Map<Magnet, number>>();

/** Reset magnet usage (call on full sync) */
export function resetMagnetUsage() {
  nodeMagnetUsage.clear();
}

/** Record magnet usage for a node */
function recordMagnetUsage(nodeId: string, magnet: Magnet) {
  if (!nodeMagnetUsage.has(nodeId)) {
    nodeMagnetUsage.set(nodeId, new Map());
  }
  const usage = nodeMagnetUsage.get(nodeId)!;
  usage.set(magnet, (usage.get(magnet) || 0) + 1);
}

/** Get usage count for a magnet on a node */
function getMagnetUsage(nodeId: string, magnet: Magnet): number {
  const nodeUsage = nodeMagnetUsage.get(nodeId);
  return nodeUsage ? nodeUsage.get(magnet) || 0 : 0;
}

/** Get alternative magnet if the preferred one is heavily used */
function getAlternativeMagnet(
  nodeId: string,
  preferred: Magnet,
  direction: "horizontal" | "vertical" | "diagonal",
): Magnet {
  const usageCount = getMagnetUsage(nodeId, preferred);

  // If preferred magnet is not heavily used, use it
  if (usageCount < 2) {
    return preferred;
  }

  // Find alternative based on direction
  let alternatives: Magnet[];
  if (direction === "horizontal") {
    alternatives = preferred === "RIGHT" ? ["TOP", "BOTTOM"] : ["TOP", "BOTTOM"];
  } else if (direction === "vertical") {
    alternatives = preferred === "BOTTOM" ? ["RIGHT", "LEFT"] : ["RIGHT", "LEFT"];
  } else {
    // Diagonal
    if (preferred === "RIGHT") alternatives = ["TOP", "BOTTOM"];
    else if (preferred === "LEFT") alternatives = ["TOP", "BOTTOM"];
    else if (preferred === "TOP") alternatives = ["RIGHT", "LEFT"];
    else alternatives = ["RIGHT", "LEFT"];
  }

  // Find least used alternative
  let bestAlt = preferred;
  let minUsage = usageCount;
  for (const alt of alternatives) {
    const altUsage = getMagnetUsage(nodeId, alt);
    if (altUsage < minUsage) {
      minUsage = altUsage;
      bestAlt = alt;
    }
  }

  return bestAlt;
}

// =============================================================================
// Magnet Calculation
// =============================================================================

/** Calculate optimal magnet positions based on relative node positions */
export function calculateMagnets(
  fromNode: SceneNode,
  toNode: SceneNode,
  fromNodeId: string,
  toNodeId: string,
): { fromMagnet: Magnet; toMagnet: Magnet } {
  // Get absolute positions (center of each node)
  const fromCenterX = fromNode.absoluteTransform[0][2] + fromNode.width / 2;
  const fromCenterY = fromNode.absoluteTransform[1][2] + fromNode.height / 2;
  const toCenterX = toNode.absoluteTransform[0][2] + toNode.width / 2;
  const toCenterY = toNode.absoluteTransform[1][2] + toNode.height / 2;

  const dx = toCenterX - fromCenterX;
  const dy = toCenterY - fromCenterY;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  let preferredFrom: Magnet;
  let preferredTo: Magnet;
  let direction: "horizontal" | "vertical" | "diagonal";

  // Determine primary direction and set magnets accordingly
  if (absDx > absDy * 1.5) {
    // Horizontal: connect LEFT/RIGHT
    direction = "horizontal";
    if (dx > 0) {
      preferredFrom = "RIGHT";
      preferredTo = "LEFT";
    } else {
      preferredFrom = "LEFT";
      preferredTo = "RIGHT";
    }
  } else if (absDy > absDx * 1.5) {
    // Vertical: connect TOP/BOTTOM
    direction = "vertical";
    if (dy > 0) {
      preferredFrom = "BOTTOM";
      preferredTo = "TOP";
    } else {
      preferredFrom = "TOP";
      preferredTo = "BOTTOM";
    }
  } else {
    // Diagonal: use corner-to-corner approach based on quadrant
    direction = "diagonal";
    if (dx > 0 && dy > 0) {
      preferredFrom = "BOTTOM";
      preferredTo = "LEFT";
    } else if (dx > 0 && dy < 0) {
      preferredFrom = "TOP";
      preferredTo = "LEFT";
    } else if (dx < 0 && dy > 0) {
      preferredFrom = "BOTTOM";
      preferredTo = "RIGHT";
    } else {
      preferredFrom = "TOP";
      preferredTo = "RIGHT";
    }
  }

  // Get actual magnets considering usage distribution
  const fromMagnet = getAlternativeMagnet(fromNodeId, preferredFrom, direction);
  const toMagnet = getAlternativeMagnet(toNodeId, preferredTo, direction);

  // Record usage
  recordMagnetUsage(fromNodeId, fromMagnet);
  recordMagnetUsage(toNodeId, toMagnet);

  return { fromMagnet, toMagnet };
}

// =============================================================================
// Edge Rendering
// =============================================================================

/** Create or update an edge */
export async function renderEdge(
  irEdge: IREdge,
  buildIndex: (docId: string) => Promise<void>,
): Promise<ConnectorNode | null> {
  let fromNode = nodeIndex.get(irEdge.from);
  let toNode = nodeIndex.get(irEdge.to);

  if (!fromNode || !toNode) {
    const docId = getCurrentDocId();
    if (docId) {
      await buildIndex(docId);
      fromNode = nodeIndex.get(irEdge.from);
      toNode = nodeIndex.get(irEdge.to);
    }
    if (!fromNode || !toNode) {
      console.warn(`Edge ${irEdge.id}: missing endpoint (from: ${irEdge.from}, to: ${irEdge.to})`);
      return null;
    }
  }

  let connector = edgeIndex.get(irEdge.id);

  if (!connector) {
    connector = figma.createConnector();
    connector.setPluginData(PLUGIN_DATA_EDGE_ID, irEdge.id);
    connector.setPluginData(PLUGIN_DATA_DOC_ID, getCurrentDocId() || "");
    edgeIndex.set(irEdge.id, connector);
  }

  // Always place connectors at page level for proper rendering in FigJam
  if (connector.parent !== figma.currentPage) {
    figma.currentPage.appendChild(connector);
  }

  // Update properties
  connector.name = irEdge.label || `${irEdge.from} -> ${irEdge.to}`;

  // Calculate optimal magnet positions based on node positions
  const magnets = calculateMagnets(fromNode, toNode, irEdge.from, irEdge.to);

  // Connect endpoints with calculated magnets
  connector.connectorStart = {
    endpointNodeId: fromNode.id,
    magnet: magnets.fromMagnet,
  };
  connector.connectorEnd = {
    endpointNodeId: toNode.id,
    magnet: magnets.toMagnet,
  };

  // Style
  connector.connectorLineType = "ELBOWED";
  connector.strokeWeight = 1.5;
  connector.strokes = [{ type: "SOLID", color: hexToFigmaRGB(irEdge.color) }];
  connector.connectorEndStrokeCap = "ARROW_EQUILATERAL";

  // Label (if FigJam supports it)
  if ("text" in connector && connector.text) {
    await loadMediumFont();
    connector.text.characters = irEdge.label;
  }

  // Keep connectors above sibling shapes within their parent
  if (connector.parent && "appendChild" in connector.parent) {
    connector.parent.appendChild(connector);
  }

  return connector;
}
