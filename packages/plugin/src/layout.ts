import type { IRNode } from "@figram/core";
import { getDocRoot } from "./state";

/** Padding around content in the section */
export const SECTION_PADDING = 50;

/** Center all content within the docRoot section and resize to fit content */
export function centerContentInSection() {
  const docRoot = getDocRoot();
  if (!docRoot || docRoot.children.length === 0) return;

  // Calculate bounding box of all top-level children
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const child of docRoot.children) {
    minX = Math.min(minX, child.x);
    minY = Math.min(minY, child.y);
    maxX = Math.max(maxX, child.x + child.width);
    maxY = Math.max(maxY, child.y + child.height);
  }

  const contentWidth = maxX - minX;
  const contentHeight = maxY - minY;

  // Resize section to fit content with padding
  const newWidth = Math.max(contentWidth + SECTION_PADDING * 2, 400);
  const newHeight = Math.max(contentHeight + SECTION_PADDING * 2, 300);
  docRoot.resizeWithoutConstraints(newWidth, newHeight);

  // Calculate offset to center content with padding
  const offsetX = SECTION_PADDING - minX;
  const offsetY = SECTION_PADDING - minY;

  // Apply offset to all top-level children
  for (const child of docRoot.children) {
    child.x += offsetX;
    child.y += offsetY;
  }

  // Scroll to show the section
  figma.viewport.scrollAndZoomIntoView([docRoot]);
}

/** Calculate depth of a node in the tree */
export function getNodeDepth(node: IRNode, nodes: Record<string, IRNode>): number {
  let depth = 0;
  let current = node;
  while (current.parent) {
    depth++;
    const parent = nodes[current.parent];
    if (!parent) break;
    current = parent;
  }
  return depth;
}
