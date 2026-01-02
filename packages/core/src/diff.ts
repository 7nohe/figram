import type { IRDocument, IREdge, IRNode, PatchOp } from "./types";

/**
 * Compares two IR documents and calculates the diff
 *
 * Diff order (for stability):
 * 1. removeEdge
 * 2. removeNode
 * 3. upsertNode (parent before child)
 * 4. upsertEdge
 */
export function diff(prev: IRDocument | null, next: IRDocument): PatchOp[] {
  const ops: PatchOp[] = [];

  const prevNodes = prev?.nodes ?? {};
  const prevEdges = prev?.edges ?? {};
  const nextNodes = next.nodes;
  const nextEdges = next.edges;

  // 1. removeEdge: edges that existed before but not now
  for (const id of Object.keys(prevEdges)) {
    if (!(id in nextEdges)) {
      ops.push({ op: "removeEdge", id });
    }
  }

  // 2. removeNode: nodes that existed before but not now
  // Delete in child-first order (children deleted before parents)
  const removedNodeIds = Object.keys(prevNodes).filter((id) => !(id in nextNodes));
  const sortedRemovedNodes = sortNodesChildFirst(removedNodeIds, prevNodes);
  for (const id of sortedRemovedNodes) {
    ops.push({ op: "removeNode", id });
  }

  // 3. upsertNode: newly added or modified nodes
  // Add/update in parent-first order
  const upsertNodeIds = Object.keys(nextNodes).filter((id) => {
    if (!(id in prevNodes)) return true; // New node
    return !nodesEqual(prevNodes[id], nextNodes[id]); // Modified
  });
  const sortedUpsertNodes = sortNodesParentFirst(upsertNodeIds, nextNodes);
  for (const id of sortedUpsertNodes) {
    ops.push({ op: "upsertNode", node: nextNodes[id] });
  }

  // 4. upsertEdge: newly added or modified edges
  for (const id of Object.keys(nextEdges)) {
    if (!(id in prevEdges) || !edgesEqual(prevEdges[id], nextEdges[id])) {
      ops.push({ op: "upsertEdge", edge: nextEdges[id] });
    }
  }

  return ops;
}

/**
 * Sorts nodes in parent-first order
 */
function sortNodesParentFirst(ids: string[], nodes: Record<string, IRNode>): string[] {
  const result: string[] = [];
  const visited = new Set<string>();
  const idSet = new Set(ids);

  function visit(id: string) {
    if (visited.has(id) || !idSet.has(id)) return;

    const node = nodes[id];
    // Process parent first
    if (node.parent && idSet.has(node.parent)) {
      visit(node.parent);
    }

    visited.add(id);
    result.push(id);
  }

  for (const id of ids) {
    visit(id);
  }

  return result;
}

/**
 * Sorts nodes in child-first order
 */
function sortNodesChildFirst(ids: string[], nodes: Record<string, IRNode>): string[] {
  return sortNodesParentFirst(ids, nodes).reverse();
}

/**
 * Compares two nodes for equality
 */
function nodesEqual(a: IRNode, b: IRNode): boolean {
  return (
    a.id === b.id &&
    a.provider === b.provider &&
    a.kind === b.kind &&
    a.label === b.label &&
    a.parent === b.parent &&
    a.layout.x === b.layout.x &&
    a.layout.y === b.layout.y &&
    a.layout.w === b.layout.w &&
    a.layout.h === b.layout.h
  );
}

/**
 * Compares two edges for equality
 */
function edgesEqual(a: IREdge, b: IREdge): boolean {
  return (
    a.id === b.id &&
    a.from === b.from &&
    a.to === b.to &&
    a.label === b.label &&
    a.color === b.color
  );
}
