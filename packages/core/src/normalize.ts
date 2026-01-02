import type { DSLDocument, IRDocument, IREdge, IRNode } from "./types";

// Default edge color (gray)
const DEFAULT_EDGE_COLOR = "#666666";

/**
 * Normalizes a HEX color to #RRGGBB uppercase format
 * Expands shorthand #RGB to #RRGGBB
 */
function normalizeHexColor(color: string): string {
  if (color.length === 4) {
    // Expand #RGB to #RRGGBB
    const r = color[1];
    const g = color[2];
    const b = color[3];
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return color.toUpperCase();
}

// Auto-layout constants for resources within subnets
const RESOURCE_LAYOUT = {
  PADDING: 50, // Padding from parent edge
  ITEM_WIDTH: 160, // Horizontal spacing between items
  ITEM_HEIGHT: 140, // Vertical spacing between items
  COLS: 2, // Items per row
} as const;

// Auto-layout constants for subnets within VPC
const SUBNET_LAYOUT = {
  PADDING: 40, // Padding from VPC edge
  GAP: 40, // Gap between subnets
  DEFAULT_WIDTH: 450, // Default subnet width
  DEFAULT_HEIGHT: 400, // Default subnet height
  COLS: 3, // Subnets per row
} as const;

// Check if a node is a subnet
function isSubnet(kind: string): boolean {
  return kind === "network.subnet";
}

/**
 * Normalizes a DSL document to an IR document
 * - Converts nodes/edges from array to Record<id, ...> (removes order dependency)
 * - Sets default values
 * - Calculates auto-layout positions for child nodes
 */
export function normalize(dsl: DSLDocument): IRDocument {
  const nodes: Record<string, IRNode> = {};
  const edges: Record<string, IREdge> = {};

  // Track children per parent for auto-layout positioning
  // Separate counters for subnets vs resources
  const subnetCounts = new Map<string, number>();
  const resourceCounts = new Map<string, number>();

  // Normalize nodes
  for (const node of dsl.nodes) {
    // Handle missing layout object for child nodes
    const layout = node.layout ?? {};

    // Calculate auto-layout position if needed
    let x = layout.x;
    let y = layout.y;
    let w = layout.w;
    let h = layout.h;

    // Auto-layout applies when: has parent AND both x/y are undefined
    if (node.parent && x === undefined && y === undefined) {
      if (isSubnet(node.kind)) {
        // Subnet auto-layout within VPC
        const subnetIndex = subnetCounts.get(node.parent) ?? 0;
        subnetCounts.set(node.parent, subnetIndex + 1);

        const col = subnetIndex % SUBNET_LAYOUT.COLS;
        const row = Math.floor(subnetIndex / SUBNET_LAYOUT.COLS);

        x = SUBNET_LAYOUT.PADDING + col * (SUBNET_LAYOUT.DEFAULT_WIDTH + SUBNET_LAYOUT.GAP);
        y = SUBNET_LAYOUT.PADDING + row * (SUBNET_LAYOUT.DEFAULT_HEIGHT + SUBNET_LAYOUT.GAP);

        // Set default size for subnets if not specified
        if (w === undefined) w = SUBNET_LAYOUT.DEFAULT_WIDTH;
        if (h === undefined) h = SUBNET_LAYOUT.DEFAULT_HEIGHT;
      } else {
        // Resource auto-layout within subnet/container
        const resourceIndex = resourceCounts.get(node.parent) ?? 0;
        resourceCounts.set(node.parent, resourceIndex + 1);

        const col = resourceIndex % RESOURCE_LAYOUT.COLS;
        const row = Math.floor(resourceIndex / RESOURCE_LAYOUT.COLS);

        x = RESOURCE_LAYOUT.PADDING + col * (RESOURCE_LAYOUT.ITEM_WIDTH + RESOURCE_LAYOUT.PADDING);
        y = RESOURCE_LAYOUT.PADDING + row * (RESOURCE_LAYOUT.ITEM_HEIGHT + RESOURCE_LAYOUT.PADDING);
      }
    }

    // x and y should now be defined (either explicit or auto-calculated)
    // This error should never occur if validation passed
    if (x === undefined || y === undefined) {
      throw new Error(`Node ${node.id} requires layout.x and layout.y`);
    }

    nodes[node.id] = {
      id: node.id,
      provider: node.provider,
      kind: node.kind,
      label: node.label ?? node.id,
      parent: node.parent ?? null,
      layout: {
        x,
        y,
        w: w ?? null,
        h: h ?? null,
      },
    };
  }

  // Normalize edges
  if (dsl.edges) {
    for (const edge of dsl.edges) {
      edges[edge.id] = {
        id: edge.id,
        from: edge.from,
        to: edge.to,
        label: edge.label ?? "",
        color: edge.color ? normalizeHexColor(edge.color) : DEFAULT_EDGE_COLOR,
      };
    }
  }

  return {
    version: dsl.version,
    docId: dsl.docId,
    title: dsl.title ?? dsl.docId,
    nodes,
    edges,
  };
}
